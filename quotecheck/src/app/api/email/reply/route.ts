import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import type { QuoteAnalysis } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  return authHeader ? authHeader.replace("Bearer ", "") : null;
}

export async function POST(request: NextRequest) {
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
  const { emailAnalysisId, customInstructions } = body;

  if (!emailAnalysisId) {
    return NextResponse.json(
      { error: "emailAnalysisId is required" },
      { status: 400 }
    );
  }

  // Fetch the email analysis (must belong to user)
  const { data: emailAnalysis, error: fetchError } = await supabase
    .from("email_analyses")
    .select("*")
    .eq("id", emailAnalysisId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !emailAnalysis) {
    return NextResponse.json(
      { error: "Analysis not found" },
      { status: 404 }
    );
  }

  if (!emailAnalysis.analysis_result) {
    return NextResponse.json(
      { error: "No analysis result available for this email" },
      { status: 400 }
    );
  }

  const analysis = emailAnalysis.analysis_result as QuoteAnalysis;

  // Check for user's reply template
  const { data: settings } = await supabase
    .from("email_automation_settings")
    .select("reply_template")
    .eq("user_id", user.id)
    .single();

  const replyTemplate = settings?.reply_template || "";

  // Generate reply using Claude
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI not configured" },
      { status: 500 }
    );
  }

  const anthropic = new Anthropic({ apiKey });

  const overpricedItems = analysis.lineItems.filter(
    (li) => li.status === "overpriced" || li.status === "slightly_high"
  );

  const prompt = `Generate a professional, polite email reply to a vendor/service provider about their quote. The reply should be from the customer's perspective, aiming to negotiate a better price while maintaining a good relationship.

CONTEXT:
- Vendor/Business: ${emailAnalysis.detected_vendor || emailAnalysis.from_name || emailAnalysis.from_email}
- Original Subject: ${emailAnalysis.subject}
- Service Category: ${analysis.serviceCategory}
- Overall Score: ${analysis.overallScore}/10 (${analysis.overallVerdict})
- Total Quoted: $${analysis.totalQuoted.toLocaleString()}
- Fair Range: $${analysis.fairTotalLow.toLocaleString()} - $${analysis.fairTotalHigh.toLocaleString()}
- Potential Savings: $${analysis.potentialSavings.toLocaleString()}

${overpricedItems.length > 0 ? `OVERPRICED ITEMS:
${overpricedItems.map((i) => `- ${i.item}: Quoted $${i.quotedPrice.toLocaleString()}, Fair range $${i.fairPriceLow.toLocaleString()}-$${i.fairPriceHigh.toLocaleString()} (${i.percentageOver}% over)`).join("\n")}` : ""}

${analysis.redFlags.length > 0 ? `RED FLAGS:\n${analysis.redFlags.join("\n")}` : ""}

${replyTemplate ? `USER'S REPLY TEMPLATE (use as base/tone guide):\n${replyTemplate}` : ""}

${customInstructions ? `USER'S CUSTOM INSTRUCTIONS:\n${customInstructions}` : ""}

RULES:
- Be polite, professional, and respectful
- Reference specific line items that are above market rate
- Mention that you've researched fair market prices for your area
- Express interest in working with them if price can be adjusted
- If the quote is fair (score >= 7), acknowledge the fair pricing and ask about any available discounts
- Keep it concise (under 200 words)
- Do NOT use markdown formatting — write as a plain email
- Start with a greeting, end with a sign-off
- Use the customer's first name as "${user.user_metadata?.full_name?.split(" ")[0] || "there"}" in the sign-off`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const reply =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Save the draft reply
    await supabase
      .from("email_analyses")
      .update({ draft_reply: reply })
      .eq("id", emailAnalysisId);

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[Reply] Generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate reply" },
      { status: 500 }
    );
  }
}
