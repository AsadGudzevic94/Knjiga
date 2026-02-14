export interface LineItemAnalysis {
  item: string;
  quotedPrice: number;
  fairPriceLow: number;
  fairPriceHigh: number;
  status: "fair" | "slightly_high" | "overpriced";
  percentageOver: number;
  notes: string;
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
}

export interface AnalyzeRequest {
  quoteText: string;
  serviceCategory: string;
  zipCode: string;
}
