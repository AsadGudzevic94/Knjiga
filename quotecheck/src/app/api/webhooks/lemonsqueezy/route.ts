import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Initialize Supabase admin client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Need service role key for admin access
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Verify webhook signature from Lemon Squeezy
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");
    const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("❌ LEMONSQUEEZY_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Verify webhook signature
    if (!signature || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error("❌ Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventName = event.meta?.event_name;

    console.log(`[Lemon Squeezy Webhook] Event: ${eventName}`);

    // Handle different webhook events
    switch (eventName) {
      case "subscription_created":
        await handleSubscriptionCreated(event);
        break;

      case "subscription_updated":
        await handleSubscriptionUpdated(event);
        break;

      case "subscription_cancelled":
      case "subscription_expired":
        await handleSubscriptionCancelled(event);
        break;

      case "subscription_resumed":
        await handleSubscriptionResumed(event);
        break;

      case "subscription_payment_success":
        console.log("✅ Payment successful for subscription:", event.data.id);
        break;

      case "subscription_payment_failed":
        console.error("❌ Payment failed for subscription:", event.data.id);
        await handlePaymentFailed(event);
        break;

      default:
        console.log(`ℹ️  Unhandled event: ${eventName}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle new subscription creation
 */
async function handleSubscriptionCreated(event: any) {
  const subscription = event.data;
  const attributes = subscription.attributes;
  const customData = attributes.custom_data || {};

  const userId = customData.user_id;
  if (!userId) {
    console.error("❌ No user_id in subscription custom_data");
    return;
  }

  // Determine plan type from variant name or product name
  const variantName = attributes.variant_name?.toLowerCase() || "";
  const planType = variantName.includes("annual") ? "pro_annual" : "pro_monthly";

  console.log(`✅ Creating subscription for user ${userId}, plan: ${planType}`);

  const { error } = await supabaseAdmin.from("user_subscriptions").upsert(
    {
      user_id: userId,
      plan_type: planType,
      status: "active",
      monthly_quote_limit: 100,
      lemon_squeezy_customer_id: attributes.customer_id,
      lemon_squeezy_subscription_id: subscription.id,
      current_period_start: new Date(attributes.renews_at),
      current_period_end: new Date(attributes.ends_at || attributes.renews_at),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("❌ Failed to create subscription:", error);
  } else {
    console.log("✅ Subscription created successfully");
  }
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(event: any) {
  const subscription = event.data;
  const attributes = subscription.attributes;

  console.log(`✅ Updating subscription ${subscription.id}`);

  // Determine new status
  let status = "active";
  if (attributes.status === "cancelled") status = "cancelled";
  if (attributes.status === "expired") status = "expired";
  if (attributes.status === "past_due") status = "active"; // Keep active but payment overdue

  const { error } = await supabaseAdmin
    .from("user_subscriptions")
    .update({
      status,
      current_period_start: new Date(attributes.renews_at),
      current_period_end: new Date(attributes.ends_at || attributes.renews_at),
      updated_at: new Date().toISOString(),
    })
    .eq("lemon_squeezy_subscription_id", subscription.id);

  if (error) {
    console.error("❌ Failed to update subscription:", error);
  } else {
    console.log("✅ Subscription updated successfully");
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(event: any) {
  const subscription = event.data;

  console.log(`❌ Cancelling subscription ${subscription.id}`);

  const { error } = await supabaseAdmin
    .from("user_subscriptions")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("lemon_squeezy_subscription_id", subscription.id);

  if (error) {
    console.error("❌ Failed to cancel subscription:", error);
  } else {
    console.log("✅ Subscription cancelled successfully");
  }
}

/**
 * Handle subscription resumption
 */
async function handleSubscriptionResumed(event: any) {
  const subscription = event.data;

  console.log(`✅ Resuming subscription ${subscription.id}`);

  const { error } = await supabaseAdmin
    .from("user_subscriptions")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("lemon_squeezy_subscription_id", subscription.id);

  if (error) {
    console.error("❌ Failed to resume subscription:", error);
  } else {
    console.log("✅ Subscription resumed successfully");
  }
}

/**
 * Handle payment failure
 */
async function handlePaymentFailed(event: any) {
  const subscription = event.data;

  console.error(`❌ Payment failed for subscription ${subscription.id}`);

  // Optionally update subscription status or send notification
  // For now, we'll let Lemon Squeezy handle retry logic
}
