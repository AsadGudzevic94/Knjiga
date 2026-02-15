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

export interface ScamFlag {
  name: string;
  description: string;
  severity: "critical" | "warning" | "info";
  matchedOn: string;
  whatToDo: string;
  realExample?: string;
}

export interface HiddenFeeWarning {
  fee: string;
  likelihood: "very_likely" | "likely" | "possible";
  typicalRange: string;
  description: string;
}

export interface SeasonalAdvice {
  bestMonths: string;
  worstMonths: string;
  savingsPercent: string;
  explanation: string;
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
    detailedExplanation: string;
    communityInsights: CommunityInsight[];
    scoreJustification: string;
    regionalContext: string;
    watchOutFor: string[];
    poweredByAi: boolean;
  };

  /** Scam pattern detection results */
  protection?: {
    scamFlags: ScamFlag[];
    hiddenFees: HiddenFeeWarning[];
    seasonalTip: SeasonalAdvice | null;
    smartQuestions: string[];
    riskLevel: "low" | "medium" | "high";
  };
}

export interface AnalyzeRequest {
  quoteText: string;
  serviceCategory: string;
  zipCode: string;
  businessName?: string;
}
