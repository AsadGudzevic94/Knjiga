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
  email_id?: string;
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

    // Fetch full email content from Resend Received Emails API
    // Inbound webhooks only include metadata, not body — must fetch separately
    let emailBody = emailData.text || emailData.html || "";
    if (!emailBody && emailData.email_id) {
      try {
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
          const emailRes = await fetch(
            `https://api.resend.com/emails/receiving/${emailData.email_id}`,
            { headers: { Authorization: `Bearer ${resendKey}` } }
          );
          if (emailRes.ok) {
            const fullEmail = await emailRes.json();
            console.log("[Inbound] Fetched email body, has text:", !!fullEmail.text, "has html:", !!fullEmail.html);
            emailBody = fullEmail.text || fullEmail.html || "";
          } else {
            console.error("[Inbound] Failed to fetch email body, status:", emailRes.status);
          }
        }
      } catch (fetchErr) {
        console.error("[Inbound] Failed to fetch email body:", fetchErr);
      }
    }

    // If still no body, use subject as fallback
    if (!emailBody) {
      emailBody = emailData.subject || "";
    }

    // Check if this is a Gmail/Outlook forwarding verification email
    const verificationSenders = [
      "forwarding-noreply@google.com",
      "no-reply@microsoft.com",
      "postmaster@outlook.com",
    ];
    const isVerification = verificationSenders.some(
      (s) => fromEmail.toLowerCase() === s
    ) || emailData.subject?.toLowerCase().includes("forwarding confirmation") ||
      emailData.subject?.toLowerCase().includes("verification");

    if (isVerification) {
      // If no body yet, try fetching from Resend with a small delay (email may still be processing)
      if (!emailBody && emailData.email_id) {
        try {
          const resendKey = process.env.RESEND_API_KEY;
          if (resendKey) {
            // Small delay to allow Resend to process the email
            await new Promise((r) => setTimeout(r, 2000));
            const emailRes = await fetch(
              `https://api.resend.com/emails/receiving/${emailData.email_id}`,
              { headers: { Authorization: `Bearer ${resendKey}` } }
            );
            if (emailRes.ok) {
              const fullEmail = await emailRes.json();
              emailBody = fullEmail.text || fullEmail.html || "";
              console.log("[Inbound] Verification email body fetched, length:", emailBody.length);
            }
          }
        } catch (err) {
          console.error("[Inbound] Failed to fetch verification email body:", err);
        }
      }

      const codeText = emailBody || emailData.subject || "";
      console.log("[Inbound] Verification text to search (first 500 chars):", codeText.slice(0, 500));

      // Try multiple patterns:
      // 1. "Confirmation code: 12345678" or "verification code: 12345678"
      // 2. Gmail subject format "(#12345678)"
      // 3. HTML: code in a link like "confirm=12345678" or "#12345678"
      // 4. Any standalone 7-10 digit number (Gmail codes are typically 8-9 digits)
      const codeMatch =
        codeText.match(/(?:confirmation|verification)\s*code[:\s]*#?(\d{5,12})/i) ||
        codeText.match(/\(#(\d{5,12})\)/) ||
        codeText.match(/confirm[=\/](\d{5,12})/) ||
        codeText.match(/[\s>](\d{7,10})[\s<]/);

      const code = codeMatch ? codeMatch[1] : null;

      // Also try to extract the verification link (Gmail uses mail.google.com or mail-settings.google.com)
      const linkMatch = codeText.match(/(https:\/\/mail(?:-settings)?\.google\.com\/mail\/vf-[^\s<"]+)/);
      const verificationLink = linkMatch ? linkMatch[1] : null;

      // Store the raw email body too so we can debug if code extraction fails
      await supabase
        .from("email_automation_settings")
        .update({
          verification_code: code,
          verification_link: verificationLink,
          verification_email_from: fromEmail,
          verification_received_at: new Date().toISOString(),
        })
        .eq("forwarding_address", hash);

      // Also store as a skipped email analysis so user can see the raw content
      if (!code) {
        await supabase.from("email_analyses").insert({
          user_id: settings.user_id,
          from_email: fromEmail,
          from_name: fromName,
          subject: emailData.subject || "(No subject)",
          email_body: codeText.slice(0, 10000),
          analysis_status: "skipped",
          error_message: "Gmail verification email — check body for confirmation code",
        });
      }

      console.log(`[Inbound] Verification email from ${fromEmail}, code: ${code || "not extracted"}, body length: ${codeText.length}`);
      return NextResponse.json({ received: true });
    }

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

    // Determine zip code — try email content first, then user profile
    let zipCode: string = classification.zipCode || "";
    if (!zipCode) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("zip_code, city, state")
        .eq("user_id", userId)
        .single();
      zipCode = profile?.zip_code || "";
      // If no zip but has city/state, pass them so AI can use regional data
      if (!zipCode && (profile?.city || profile?.state)) {
        zipCode = `${profile?.city || ""}, ${profile?.state || ""}`.trim().replace(/^,\s*/, "");
      }
      if (!zipCode) {
        zipCode = "90210";
      }
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
