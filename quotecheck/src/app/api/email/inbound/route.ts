import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { createClient } from "@supabase/supabase-js";
import { after } from "next/server";
import { classifyEmail } from "@/lib/email-classifier";
import { runFullAnalysisPipeline } from "@/lib/analysis-pipeline";
import { sendAnalysisNotification, sendQuotaExceededNotification } from "@/lib/email";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

interface InboundEmailPayload {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

function extractEmailAddress(from: string): { email: string; name: string | null } {
  const match = from.match(/<([^>]+)>/);
  if (match) {
    const name = from.replace(/<[^>]+>/, "").trim() || null;
    return { email: match[1], name };
  }
  return { email: from.trim(), name: null };
}

function extractForwardingHash(toField: string | string[]): string | null {
  const domain = process.env.INBOUND_EMAIL_DOMAIN || "quotecheck.chat";
  const toStr = Array.isArray(toField) ? toField.join(",") : toField;
  const match = toStr.match(new RegExp(`([a-z0-9]+)@${domain.replace(/\./g, "\\.")}`));
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  const body = await request.text();

  // Verify webhook signature if secret is configured
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (webhookSecret) {
    const svixId = request.headers.get("svix-id") || "";
    const svixTimestamp = request.headers.get("svix-timestamp") || "";
    const svixSignature = request.headers.get("svix-signature") || "";

    // Only verify if svix headers are present (Resend sends them)
    if (svixId && svixTimestamp && svixSignature) {
      try {
        const wh = new Webhook(webhookSecret);
        wh.verify(body, {
          "svix-id": svixId,
          "svix-timestamp": svixTimestamp,
          "svix-signature": svixSignature,
        });
      } catch (err) {
        console.error("[Inbound] Signature verification failed:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }
  }

  try {
    const event = JSON.parse(body);
    const emailData = event.data as InboundEmailPayload;

    if (!emailData || !emailData.to) {
      return NextResponse.json({ received: true });
    }

    const hash = extractForwardingHash(emailData.to);
    if (!hash) {
      console.log("[Inbound] No forwarding hash found in:", emailData.to);
      return NextResponse.json({ received: true });
    }

    const { data: settings } = await supabase
      .from("email_automation_settings")
      .select("*")
      .eq("forwarding_address", hash)
      .eq("is_enabled", true)
      .single();

    if (!settings) {
      console.log("[Inbound] No active settings for hash:", hash);
      return NextResponse.json({ received: true });
    }

    const { email: fromEmail, name: fromName } = extractEmailAddress(emailData.from);
    const emailBody = emailData.text || emailData.html || "";

    after(async () => {
      await processInboundEmail({
        userId: settings.user_id,
        settings,
        fromEmail,
        fromName,
        subject: emailData.subject || "(No subject)",
        emailBody,
      });
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Inbound] Parse error:", err);
    return NextResponse.json({ received: true });
  }
}

interface ProcessParams {
  userId: string;
  settings: Record<string, unknown>;
  fromEmail: string;
  fromName: string | null;
  subject: string;
  emailBody: string;
}

async function processInboundEmail(params: ProcessParams) {
  const { userId, settings, fromEmail, fromName, subject, emailBody } = params;
  const supabase = getSupabase();

  try {
    // Rate limit: max 10 emails per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("email_analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("received_at", oneHourAgo);

    if ((count || 0) >= 10) {
      console.log(`[Inbound] Rate limit exceeded for user ${userId}`);
      return;
    }

    // Check quota
    const { data: quotaData } = await supabase.rpc("check_user_quota", {
      p_user_id: userId,
    });
    const quota = quotaData?.[0];

    if (!quota || !quota.is_subscribed || !quota.has_quota) {
      await supabase.from("email_analyses").insert({
        user_id: userId,
        from_email: fromEmail,
        from_name: fromName,
        subject,
        email_body: emailBody.slice(0, 10000),
        analysis_status: "failed",
        error_message: !quota?.is_subscribed
          ? "No active subscription"
          : "Monthly quota exceeded",
      });

      const notifyEmail =
        (settings.notification_email as string) ||
        (await getUserEmail(userId));
      if (notifyEmail) {
        await sendQuotaExceededNotification(notifyEmail);
      }
      return;
    }

    // Insert as processing
    const { data: emailRecord } = await supabase
      .from("email_analyses")
      .insert({
        user_id: userId,
        from_email: fromEmail,
        from_name: fromName,
        subject,
        email_body: emailBody.slice(0, 10000),
        analysis_status: "processing",
      })
      .select("id")
      .single();

    if (!emailRecord) return;
    const emailAnalysisId = emailRecord.id;

    // Classify the email
    const classification = await classifyEmail(subject, emailBody, fromEmail, fromName);

    if (!classification.isQuoteEmail || !classification.category) {
      await supabase
        .from("email_analyses")
        .update({
          analysis_status: "skipped",
          error_message: "Email does not contain a recognizable quote or invoice",
          detected_category: classification.category || null,
        })
        .eq("id", emailAnalysisId);
      return;
    }

    // Apply category filter
    const categoriesFilter = (settings.categories_filter as string[]) || [];
    if (categoriesFilter.length > 0 && !categoriesFilter.includes(classification.category)) {
      await supabase
        .from("email_analyses")
        .update({
          analysis_status: "skipped",
          error_message: `Category "${classification.category}" not in your filter list`,
          detected_category: classification.category,
          detected_vendor: classification.vendorName,
        })
        .eq("id", emailAnalysisId);
      return;
    }

    // Determine zip code
    let zipCode: string = classification.zipCode || "";
    if (!zipCode) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("zip_code")
        .eq("user_id", userId)
        .single();
      zipCode = profile?.zip_code || "90210";
    }

    // Apply price threshold filter
    const minThreshold = Number(settings.min_price_threshold) || 0;
    if (minThreshold > 0) {
      const priceMatch = classification.extractedQuoteText.match(
        /\$\s*([\d,]+(?:\.\d{1,2})?)/g
      );
      if (priceMatch) {
        const prices = priceMatch.map((p) =>
          parseFloat(p.replace(/[\$,\s]/g, ""))
        );
        const maxPrice = Math.max(...prices);
        if (maxPrice < minThreshold) {
          await supabase
            .from("email_analyses")
            .update({
              analysis_status: "skipped",
              error_message: `Quote total ($${maxPrice}) below your $${minThreshold} threshold`,
              detected_category: classification.category,
              detected_vendor: classification.vendorName,
            })
            .eq("id", emailAnalysisId);
          return;
        }
      }
    }

    // Run the full analysis pipeline
    const result = await runFullAnalysisPipeline({
      quoteText: classification.extractedQuoteText,
      serviceCategory: classification.category,
      zipCode,
      userId,
      businessName: classification.vendorName || undefined,
    });

    // Update the email analysis record
    await supabase
      .from("email_analyses")
      .update({
        analysis_status: "completed",
        analysis_result: result.analysis,
        detected_category: classification.category,
        detected_zip: zipCode,
        detected_vendor: classification.vendorName,
        community_analysis_id: result.analysisId,
      })
      .eq("id", emailAnalysisId);

    // Send notification if enabled
    if (settings.notify_on_analysis) {
      const notifyEmail =
        (settings.notification_email as string) ||
        (await getUserEmail(userId));

      if (notifyEmail) {
        const sent = await sendAnalysisNotification({
          to: notifyEmail,
          fromEmail,
          fromName,
          subject,
          analysis: result.analysis,
          emailAnalysisId,
        });

        if (sent) {
          await supabase
            .from("email_analyses")
            .update({ notified_at: new Date().toISOString() })
            .eq("id", emailAnalysisId);
        }
      }
    }

    console.log(
      `[Inbound] Processed email for user ${userId}: score=${result.analysis.overallScore}, verdict=${result.analysis.overallVerdict}`
    );
  } catch (err) {
    console.error("[Inbound] Processing error:", err);
  }
}

async function getUserEmail(userId: string): Promise<string | null> {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.admin.getUserById(userId);
  return user?.email || null;
}
