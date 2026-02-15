export interface LineItemAnalysis {
  item: string;
  quotedPrice: number;
  fairPriceLow: number;
  fairPriceHigh: number;
  status: "fair" | "slightly_high" | "overpriced";
  percentageOver: number;
  notes: string;
  /** AI-generated detailed explanation for this line item */
  aiExplanation?: string;
}

export interface CommunityInsight {
  source: string; // e.g. "Reddit r/MechanicAdvice", "Yelp reviews", "Consumer Reports"
  snippet: string;
  sentiment: "supports_price" | "price_too_high" | "neutral";
}

export interface QuoteAnalysis {
  overallScore: number; // 1-10
  overallVerdict: "great_deal" | "fair" | "slightly_high" | "overpriced" | "ripoff";
  totalQuoted: number;
  fairTotalLow: number;
  fairTotalHigh: number;
  potentialSavings: number;
  serviceCategory: string;
  lineItems: LineItemAnalysis[];
  redFlags: string[];
  negotiationTips: string[];
  negotiationScript: string;
  summary: string;

  /** AI-generated deep analysis - the "meat" of the response */
  aiAnalysis?: {
    /** Detailed narrative explaining the score (like talking to a knowledgeable friend) */
    detailedExplanation: string;
    /** What people typically report paying on Reddit/forums */
    communityInsights: CommunityInsight[];
    /** Specific factors that justify the score */
    scoreJustification: string;
    /** Regional context */
    regionalContext: string;
    /** What to watch out for with this type of service */
    watchOutFor: string[];
    /** Whether AI analysis was used */
    poweredByAi: boolean;
  };
}

export interface AnalyzeRequest {
  quoteText: string;
  serviceCategory: string;
  zipCode: string;
}
