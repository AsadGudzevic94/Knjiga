import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { planId } = body;

    if (!planId || !["pro_monthly", "pro_annual"].includes(planId)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Get variant ID from environment based on plan
    const variantId =
      planId === "pro_monthly"
        ? process.env.LEMONSQUEEZY_VARIANT_ID_MONTHLY
        : process.env.LEMONSQUEEZY_VARIANT_ID_ANNUAL;

    if (!variantId) {
      console.error(`❌ Variant ID not configured for plan: ${planId}`);
      return NextResponse.json(
        { error: "Plan configuration missing" },
        { status: 500 }
      );
    }

    const storeSlug = process.env.LEMONSQUEEZY_STORE_SLUG;
    if (!storeSlug) {
      return NextResponse.json(
        { error: "Store not configured" },
        { status: 500 }
      );
    }

    // Get user's email
    const email = user.email;

    // Build Lemon Squeezy checkout URL
    const checkoutUrl = new URL(
      `https://${storeSlug}.lemonsqueezy.com/checkout/buy/${variantId}`
    );

    // Pre-fill email and pass user ID as custom data
    if (email) {
      checkoutUrl.searchParams.set("checkout[email]", email);
    }
    checkoutUrl.searchParams.set("checkout[custom][user_id]", user.id);

    // Set redirect URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    checkoutUrl.searchParams.set(
      "checkout[success_url]",
      `${baseUrl}/dashboard?subscribed=true`
    );
    checkoutUrl.searchParams.set("checkout[cancel_url]", `${baseUrl}/pricing`);

    // Enable dark mode for checkout (optional)
    checkoutUrl.searchParams.set("dark", "1");

    console.log(`✅ Created checkout URL for user ${user.id}, plan: ${planId}`);

    return NextResponse.json({ checkoutUrl: checkoutUrl.toString() });
  } catch (error) {
    console.error("❌ Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
