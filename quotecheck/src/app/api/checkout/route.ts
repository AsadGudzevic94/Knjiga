import { NextRequest, NextResponse } from "next/server";

// In production, install stripe: npm install stripe
// import Stripe from "stripe";
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { planId, email } = await request.json();

    if (!planId || !email) {
      return NextResponse.json(
        { error: "Missing plan or email." },
        { status: 400 }
      );
    }

    // Price IDs would come from your Stripe dashboard
    const priceMap: Record<string, string> = {
      pro_monthly: "price_REPLACE_WITH_STRIPE_PRICE_ID_MONTHLY",
      pro_annual: "price_REPLACE_WITH_STRIPE_PRICE_ID_ANNUAL",
    };

    const priceId = priceMap[planId];
    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid plan selected." },
        { status: 400 }
      );
    }

    // In production, create a Stripe Checkout session:
    //
    // const session = await stripe.checkout.sessions.create({
    //   mode: "subscription",
    //   payment_method_types: ["card"],
    //   customer_email: email,
    //   line_items: [{ price: priceId, quantity: 1 }],
    //   subscription_data: { trial_period_days: 14 },
    //   success_url: `${process.env.NEXT_PUBLIC_APP_URL}/analyze?checkout=success`,
    //   cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=cancelled`,
    // });
    //
    // return NextResponse.json({ url: session.url });

    return NextResponse.json({
      message: "Stripe checkout session would be created here.",
      planId,
      email,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
