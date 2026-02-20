import { Resend } from "resend";
import type { QuoteAnalysis } from "@/lib/types";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const VERDICT_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  great_deal: { label: "Great Deal", color: "#16a34a", emoji: "&#9989;" },
  fair: { label: "Fair Price", color: "#2563eb", emoji: "&#9989;" },
  slightly_high: { label: "Slightly High", color: "#f59e0b", emoji: "&#9888;&#65039;" },
  overpriced: { label: "Overpriced", color: "#ef4444", emoji: "&#10060;" },
  ripoff: { label: "Ripoff", color: "#dc2626", emoji: "&#128680;" },
};

function buildNotificationHtml(params: {
  fromEmail: string;
  fromName: string | null;
  subject: string;
  analysis: QuoteAnalysis;
  emailAnalysisId: string;
}): string {
  const { fromName, fromEmail, subject, analysis } = params;
  const verdict = VERDICT_LABELS[analysis.overallVerdict] || VERDICT_LABELS.fair;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.quotecheck.chat";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
  <div style="text-align: center; padding: 24px 0; border-bottom: 1px solid #e5e7eb;">
    <h1 style="font-size: 24px; font-weight: 800; margin: 0;">
      <span style="color: #1f2937;">Quote</span><span style="color: #2563eb;">Check</span>
    </h1>
    <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0;">Email Quote Analysis</p>
  </div>

  <div style="padding: 24px 0;">
    <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <p style="font-size: 14px; color: #6b7280; margin: 0 0 4px;">Quote from</p>
      <p style="font-size: 16px; font-weight: 600; margin: 0;">${fromName || fromEmail}</p>
      <p style="font-size: 13px; color: #6b7280; margin: 4px 0 0;">${subject}</p>
    </div>

    <div style="text-align: center; padding: 20px; background: ${verdict.color}10; border: 2px solid ${verdict.color}30; border-radius: 12px; margin-bottom: 20px;">
      <p style="font-size: 48px; margin: 0;">${analysis.overallScore}/10</p>
      <p style="font-size: 18px; font-weight: 700; color: ${verdict.color}; margin: 8px 0 0;">${verdict.emoji} ${verdict.label}</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="padding: 12px; background: #f9fafb; border-radius: 8px 0 0 0;">
          <p style="font-size: 12px; color: #6b7280; margin: 0;">Quoted</p>
          <p style="font-size: 18px; font-weight: 700; margin: 4px 0 0;">$${analysis.totalQuoted.toLocaleString()}</p>
        </td>
        <td style="padding: 12px; background: #f9fafb;">
          <p style="font-size: 12px; color: #6b7280; margin: 0;">Fair Range</p>
          <p style="font-size: 18px; font-weight: 700; margin: 4px 0 0;">$${analysis.fairTotalLow.toLocaleString()} - $${analysis.fairTotalHigh.toLocaleString()}</p>
        </td>
        <td style="padding: 12px; background: #f9fafb; border-radius: 0 8px 0 0;">
          <p style="font-size: 12px; color: #6b7280; margin: 0;">Potential Savings</p>
          <p style="font-size: 18px; font-weight: 700; color: #16a34a; margin: 4px 0 0;">$${analysis.potentialSavings.toLocaleString()}</p>
        </td>
      </tr>
    </table>

    ${analysis.redFlags.length > 0 ? `
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <p style="font-weight: 600; color: #dc2626; margin: 0 0 8px;">Red Flags</p>
      ${analysis.redFlags.map((f) => `<p style="font-size: 14px; color: #991b1b; margin: 4px 0;">&#8226; ${f}</p>`).join("")}
    </div>
    ` : ""}

    <div style="text-align: center; padding-top: 12px;">
      <a href="${baseUrl}/dashboard?tab=emails" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
        View Full Analysis
      </a>
    </div>
  </div>

  <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center;">
    <p style="font-size: 12px; color: #9ca3af; margin: 0;">
      You received this because you enabled QuoteCheck Email Automation.
      <br><a href="${baseUrl}/settings/automation" style="color: #6b7280;">Manage settings</a>
    </p>
  </div>
</body>
</html>`;
}

export async function sendAnalysisNotification(params: {
  to: string;
  fromEmail: string;
  fromName: string | null;
  subject: string;
  analysis: QuoteAnalysis;
  emailAnalysisId: string;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.error("[Email] Resend not configured");
    return false;
  }

  const verdict = VERDICT_LABELS[params.analysis.overallVerdict] || VERDICT_LABELS.fair;

  try {
    await resend.emails.send({
      from: "QuoteCheck <noreply@quotecheck.chat>",
      to: params.to,
      subject: `${verdict.emoji} ${verdict.label}: Quote from ${params.fromName || params.fromEmail} ($${params.analysis.totalQuoted.toLocaleString()})`,
      html: buildNotificationHtml(params),
    });
    return true;
  } catch (err) {
    console.error("[Email] Send error:", err);
    return false;
  }
}

export async function sendQuotaExceededNotification(to: string): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.quotecheck.chat";

  try {
    await resend.emails.send({
      from: "QuoteCheck <noreply@quotecheck.chat>",
      to,
      subject: "QuoteCheck: Monthly quota reached",
      html: `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
  <h1 style="font-size: 24px;"><span style="color: #1f2937;">Quote</span><span style="color: #2563eb;">Check</span></h1>
  <p>You've reached your monthly quote analysis limit. New emails forwarded to QuoteCheck will be queued until your quota resets on the 1st of next month.</p>
  <a href="${baseUrl}/dashboard" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">View Dashboard</a>
</body>
</html>`,
    });
    return true;
  } catch (err) {
    console.error("[Email] Quota notification error:", err);
    return false;
  }
}
