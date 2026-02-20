import Anthropic from "@anthropic-ai/sdk";
import { PRICING_DATABASE } from "@/lib/pricing-data";

export interface EmailClassification {
  isQuoteEmail: boolean;
  category: string;
  extractedQuoteText: string;
  zipCode: string | null;
  vendorName: string | null;
  confidence: number;
}

const VALID_CATEGORIES = Object.keys(PRICING_DATABASE);

export async function classifyEmail(
  subject: string,
  body: string,
  fromEmail: string,
  fromName: string | null
): Promise<EmailClassification> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      isQuoteEmail: false,
      category: "",
      extractedQuoteText: "",
      zipCode: null,
      vendorName: null,
      confidence: 0,
    };
  }

  const anthropic = new Anthropic({ apiKey });

  const categoryList = VALID_CATEGORIES.map(
    (key) => `- ${key}: ${PRICING_DATABASE[key].name}`
  ).join("\n");

  const prompt = `Analyze this email and determine if it contains a service quote, estimate, invoice, or bill. Extract the relevant pricing information.

EMAIL METADATA:
From: ${fromName || "Unknown"} <${fromEmail}>
Subject: ${subject}

EMAIL BODY:
${body.slice(0, 5000)}

VALID SERVICE CATEGORIES:
${categoryList}

INSTRUCTIONS:
1. Determine if this email contains a quote, estimate, invoice, or bill for a service
2. If yes, extract ONLY the pricing/quote portion (strip email headers, signatures, forwarding notices, greetings)
3. Identify the service category from the list above
4. Look for any zip code, address, or location mentioned
5. Identify the vendor/business name

Handle forwarded email patterns:
- "---------- Forwarded message ----------" markers
- "Begin forwarded message:" blocks
- "From:" / "Date:" / "Subject:" forwarding headers
- Email signature blocks (strip them)

Respond with ONLY this JSON (no markdown, no explanation):
{
  "isQuoteEmail": true/false,
  "category": "category_key or empty string",
  "extractedQuoteText": "the cleaned quote text with line items and prices",
  "zipCode": "5-digit zip or null",
  "vendorName": "business name or null",
  "confidence": 0.0 to 1.0
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        isQuoteEmail: false,
        category: "",
        extractedQuoteText: "",
        zipCode: null,
        vendorName: null,
        confidence: 0,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate category
    if (parsed.category && !VALID_CATEGORIES.includes(parsed.category)) {
      parsed.category = "";
      parsed.confidence = Math.min(parsed.confidence, 0.5);
    }

    return {
      isQuoteEmail: Boolean(parsed.isQuoteEmail),
      category: parsed.category || "",
      extractedQuoteText: parsed.extractedQuoteText || "",
      zipCode: parsed.zipCode || null,
      vendorName: parsed.vendorName || null,
      confidence: Number(parsed.confidence) || 0,
    };
  } catch (err) {
    console.error("[EmailClassifier] Error:", err);
    return {
      isQuoteEmail: false,
      category: "",
      extractedQuoteText: "",
      zipCode: null,
      vendorName: null,
      confidence: 0,
    };
  }
}
