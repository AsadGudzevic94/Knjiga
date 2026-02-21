import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  return authHeader ? authHeader.replace("Bearer ", "") : null;
}

function generateForwardingAddress(userId: string): string {
  return createHash("md5")
    .update(userId + "quotecheck-salt")
    .digest("hex")
    .substring(0, 10);
}

export async function GET(request: NextRequest) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: settings } = await supabase
    .from("email_automation_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const domain = process.env.INBOUND_EMAIL_DOMAIN || "quotecheck.chat";

  if (!settings) {
    return NextResponse.json({
      isEnabled: false,
      autoAnalyze: true,
      categoriesFilter: [],
      minPriceThreshold: 0,
      notificationEmail: user.email || "",
      notifyOnAnalysis: true,
      autoDraftReply: false,
      replyTemplate: "",
      forwardingEmail: null,
      isSetUp: false,
    });
  }

  return NextResponse.json({
    isEnabled: settings.is_enabled,
    autoAnalyze: settings.auto_analyze,
    categoriesFilter: settings.categories_filter || [],
    minPriceThreshold: settings.min_price_threshold || 0,
    notificationEmail: settings.notification_email || user.email || "",
    notifyOnAnalysis: settings.notify_on_analysis,
    autoDraftReply: settings.auto_draft_reply,
    replyTemplate: settings.reply_template || "",
    forwardingEmail: `${settings.forwarding_address}@${domain}`,
    isSetUp: true,
    verificationCode: settings.verification_code || null,
    verificationLink: settings.verification_link || null,
    verificationReceivedAt: settings.verification_received_at || null,
    forwardingVerified: settings.forwarding_verified || false,
  });
}

export async function PUT(request: NextRequest) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();

  const forwardingAddress = generateForwardingAddress(user.id);
  const domain = process.env.INBOUND_EMAIL_DOMAIN || "quotecheck.chat";

  const { error } = await supabase.from("email_automation_settings").upsert(
    {
      user_id: user.id,
      forwarding_address: forwardingAddress,
      is_enabled: body.isEnabled ?? true,
      auto_analyze: body.autoAnalyze ?? true,
      categories_filter: body.categoriesFilter || [],
      min_price_threshold: body.minPriceThreshold || 0,
      notification_email: body.notificationEmail || user.email,
      notify_on_analysis: body.notifyOnAnalysis ?? true,
      auto_draft_reply: body.autoDraftReply ?? false,
      reply_template: body.replyTemplate || "",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[EmailSettings] Upsert error:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    forwardingEmail: `${forwardingAddress}@${domain}`,
  });
}
