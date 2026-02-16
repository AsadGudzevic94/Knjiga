import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
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

    const apiKey = process.env.LEMONSQUEEZY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Use Lemon Squeezy API to create a checkout session
    const lsResponse = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: user.email || undefined,
              custom: {
                user_id: user.id,
              },
            },
            checkout_options: {
              dark: true,
            },
            product_options: {
              redirect_url: `${baseUrl}/dashboard?subscribed=true`,
            },
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: process.env.LEMONSQUEEZY_STORE_ID || "",
              },
            },
            variant: {
              data: {
                type: "variants",
                id: variantId,
              },
            },
          },
        },
      }),
    });

    const lsData = await lsResponse.json();

    if (!lsResponse.ok) {
      console.error("❌ Lemon Squeezy API error:", JSON.stringify(lsData));
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    const checkoutUrl = lsData.data.attributes.url;

    console.log(`✅ Created checkout URL for user ${user.id}, plan: ${planId}`);

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error("❌ Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
