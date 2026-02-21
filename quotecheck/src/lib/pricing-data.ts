// Realistic pricing database for common services
// Prices are base rates (national average) and adjusted by region/zip

export interface ServicePricing {
  item: string;
  keywords: string[];
  avgPrice: number;
  lowPrice: number;
  highPrice: number;
  unit: string;
}

export interface CategoryData {
  name: string;
  services: ServicePricing[];
}

export const PRICING_DATABASE: Record<string, CategoryData> = {
  auto_repair: {
    name: "Auto Repair",
    services: [
      { item: "Brake pad replacement (front)", keywords: ["brake", "pad", "front"], avgPrice: 250, lowPrice: 150, highPrice: 350, unit: "per axle" },
      { item: "Brake pad replacement (rear)", keywords: ["brake", "pad", "rear"], avgPrice: 270, lowPrice: 160, highPrice: 380, unit: "per axle" },
      { item: "Brake rotor replacement", keywords: ["rotor", "resurface", "resurfac"], avgPrice: 200, lowPrice: 120, highPrice: 300, unit: "per pair" },
      { item: "Brake fluid flush", keywords: ["brake fluid", "fluid flush"], avgPrice: 80, lowPrice: 50, highPrice: 120, unit: "service" },
      { item: "Oil change (synthetic)", keywords: ["oil change", "oil", "synthetic"], avgPrice: 75, lowPrice: 45, highPrice: 110, unit: "service" },
      { item: "Oil change (conventional)", keywords: ["oil change", "conventional"], avgPrice: 45, lowPrice: 25, highPrice: 65, unit: "service" },
      { item: "Tire rotation", keywords: ["tire rotation", "rotate tire"], avgPrice: 35, lowPrice: 15, highPrice: 60, unit: "service" },
      { item: "Transmission fluid change", keywords: ["transmission", "trans fluid"], avgPrice: 175, lowPrice: 100, highPrice: 275, unit: "service" },
      { item: "Transmission rebuild", keywords: ["transmission rebuild", "trans rebuild"], avgPrice: 2800, lowPrice: 1800, highPrice: 4200, unit: "service" },
      { item: "Alternator replacement", keywords: ["alternator"], avgPrice: 450, lowPrice: 300, highPrice: 650, unit: "service" },
      { item: "Starter motor replacement", keywords: ["starter"], avgPrice: 400, lowPrice: 250, highPrice: 600, unit: "service" },
      { item: "Battery replacement", keywords: ["battery"], avgPrice: 180, lowPrice: 100, highPrice: 280, unit: "service" },
      { item: "AC recharge", keywords: ["ac", "a/c", "air condition", "recharge", "freon"], avgPrice: 200, lowPrice: 120, highPrice: 300, unit: "service" },
      { item: "Timing belt replacement", keywords: ["timing belt", "timing chain"], avgPrice: 700, lowPrice: 400, highPrice: 1100, unit: "service" },
      { item: "Water pump replacement", keywords: ["water pump"], avgPrice: 450, lowPrice: 250, highPrice: 700, unit: "service" },
      { item: "Spark plug replacement", keywords: ["spark plug"], avgPrice: 200, lowPrice: 100, highPrice: 350, unit: "set" },
      { item: "Diagnostic fee", keywords: ["diagnostic", "inspection", "scan"], avgPrice: 100, lowPrice: 50, highPrice: 150, unit: "service" },
      { item: "Auto labor rate", keywords: ["labor", "labour", "per hour", "/hr", "per hr"], avgPrice: 120, lowPrice: 80, highPrice: 160, unit: "per hour" },
      { item: "Shop supplies / fees", keywords: ["shop supplies", "shop fee", "disposal", "environmental"], avgPrice: 30, lowPrice: 10, highPrice: 55, unit: "flat" },
    ],
  },
  plumbing: {
    name: "Plumbing",
    services: [
      { item: "Service call / trip charge", keywords: ["service call", "trip charge", "dispatch"], avgPrice: 85, lowPrice: 50, highPrice: 150, unit: "flat" },
      { item: "Drain cleaning", keywords: ["drain clean", "clog", "unclog", "snake"], avgPrice: 225, lowPrice: 130, highPrice: 350, unit: "service" },
      { item: "Water heater installation", keywords: ["water heater", "hot water"], avgPrice: 1200, lowPrice: 800, highPrice: 1800, unit: "service" },
      { item: "Toilet repair", keywords: ["toilet repair", "toilet fix"], avgPrice: 175, lowPrice: 100, highPrice: 300, unit: "service" },
      { item: "Toilet replacement", keywords: ["toilet replace", "new toilet", "toilet install"], avgPrice: 400, lowPrice: 250, highPrice: 600, unit: "service" },
      { item: "Faucet replacement", keywords: ["faucet", "tap replace"], avgPrice: 250, lowPrice: 150, highPrice: 400, unit: "service" },
      { item: "Pipe repair", keywords: ["pipe repair", "pipe fix", "pipe leak", "leak repair"], avgPrice: 350, lowPrice: 150, highPrice: 600, unit: "service" },
      { item: "Sewer line repair", keywords: ["sewer", "main line"], avgPrice: 2500, lowPrice: 1500, highPrice: 4500, unit: "service" },
      { item: "Garbage disposal install", keywords: ["garbage disposal", "disposal install"], avgPrice: 300, lowPrice: 180, highPrice: 450, unit: "service" },
      { item: "Plumbing labor rate", keywords: ["labor", "labour", "per hour", "/hr"], avgPrice: 100, lowPrice: 65, highPrice: 150, unit: "per hour" },
    ],
  },
  electrical: {
    name: "Electrical",
    services: [
      { item: "Outlet installation", keywords: ["outlet", "receptacle", "plug"], avgPrice: 175, lowPrice: 100, highPrice: 275, unit: "per outlet" },
      { item: "Light fixture installation", keywords: ["light fixture", "ceiling light", "chandelier"], avgPrice: 200, lowPrice: 100, highPrice: 350, unit: "per fixture" },
      { item: "Ceiling fan installation", keywords: ["ceiling fan"], avgPrice: 250, lowPrice: 150, highPrice: 400, unit: "per fan" },
      { item: "Panel upgrade (200 amp)", keywords: ["panel", "200 amp", "breaker box", "electrical panel"], avgPrice: 2000, lowPrice: 1300, highPrice: 3000, unit: "service" },
      { item: "EV charger installation", keywords: ["ev charger", "electric vehicle", "car charger", "level 2"], avgPrice: 1200, lowPrice: 700, highPrice: 2000, unit: "service" },
      { item: "Electrician labor rate", keywords: ["labor", "labour", "per hour", "/hr"], avgPrice: 110, lowPrice: 70, highPrice: 160, unit: "per hour" },
    ],
  },
  dental: {
    name: "Dental",
    services: [
      { item: "Dental cleaning (routine)", keywords: ["cleaning", "prophylaxis", "prophy"], avgPrice: 125, lowPrice: 75, highPrice: 200, unit: "visit" },
      { item: "Deep cleaning (per quadrant)", keywords: ["deep cleaning", "scaling", "root planing", "quadrant"], avgPrice: 275, lowPrice: 150, highPrice: 400, unit: "per quadrant" },
      { item: "Dental crown (porcelain)", keywords: ["crown", "porcelain", "ceramic"], avgPrice: 1100, lowPrice: 800, highPrice: 1500, unit: "per tooth" },
      { item: "Dental crown (gold)", keywords: ["gold crown"], avgPrice: 1300, lowPrice: 900, highPrice: 1800, unit: "per tooth" },
      { item: "Root canal (molar)", keywords: ["root canal", "molar"], avgPrice: 1000, lowPrice: 700, highPrice: 1400, unit: "per tooth" },
      { item: "Root canal (front tooth)", keywords: ["root canal", "front", "anterior"], avgPrice: 750, lowPrice: 500, highPrice: 1100, unit: "per tooth" },
      { item: "Tooth extraction (simple)", keywords: ["extraction", "pull tooth", "simple extract"], avgPrice: 200, lowPrice: 120, highPrice: 300, unit: "per tooth" },
      { item: "Tooth extraction (surgical)", keywords: ["surgical extract", "wisdom tooth", "impacted"], avgPrice: 400, lowPrice: 250, highPrice: 600, unit: "per tooth" },
      { item: "Dental filling (composite)", keywords: ["filling", "composite", "resin"], avgPrice: 200, lowPrice: 130, highPrice: 300, unit: "per tooth" },
      { item: "Dental implant", keywords: ["implant"], avgPrice: 3500, lowPrice: 2400, highPrice: 5000, unit: "per implant" },
      { item: "Dental exam + X-rays", keywords: ["exam", "x-ray", "xray", "checkup"], avgPrice: 150, lowPrice: 75, highPrice: 250, unit: "visit" },
      { item: "Teeth whitening (in-office)", keywords: ["whitening", "bleaching"], avgPrice: 500, lowPrice: 300, highPrice: 800, unit: "session" },
      { item: "Veneer (porcelain)", keywords: ["veneer"], avgPrice: 1200, lowPrice: 800, highPrice: 2000, unit: "per tooth" },
    ],
  },
  medical: {
    name: "Medical",
    services: [
      { item: "Office visit (primary care)", keywords: ["office visit", "primary care", "checkup", "physical"], avgPrice: 250, lowPrice: 150, highPrice: 400, unit: "visit" },
      { item: "Urgent care visit", keywords: ["urgent care"], avgPrice: 175, lowPrice: 100, highPrice: 300, unit: "visit" },
      { item: "ER visit (basic)", keywords: ["emergency", "er visit"], avgPrice: 1500, lowPrice: 800, highPrice: 2500, unit: "visit" },
      { item: "MRI scan", keywords: ["mri"], avgPrice: 1200, lowPrice: 400, highPrice: 2500, unit: "scan" },
      { item: "CT scan", keywords: ["ct scan", "cat scan"], avgPrice: 800, lowPrice: 300, highPrice: 1500, unit: "scan" },
      { item: "X-ray", keywords: ["x-ray", "xray"], avgPrice: 200, lowPrice: 100, highPrice: 400, unit: "scan" },
      { item: "Blood work (basic panel)", keywords: ["blood work", "blood test", "lab", "panel", "cbc"], avgPrice: 150, lowPrice: 50, highPrice: 300, unit: "panel" },
    ],
  },
  home_renovation: {
    name: "Home Renovation",
    services: [
      { item: "Kitchen remodel (mid-range)", keywords: ["kitchen remodel", "kitchen renovation"], avgPrice: 25000, lowPrice: 15000, highPrice: 40000, unit: "project" },
      { item: "Bathroom remodel (mid-range)", keywords: ["bathroom remodel", "bath renovation"], avgPrice: 12000, lowPrice: 7000, highPrice: 20000, unit: "project" },
      { item: "Interior painting (per room)", keywords: ["paint", "interior paint"], avgPrice: 400, lowPrice: 250, highPrice: 700, unit: "per room" },
      { item: "Exterior painting (whole house)", keywords: ["exterior paint"], avgPrice: 3500, lowPrice: 2000, highPrice: 6000, unit: "project" },
      { item: "Hardwood floor installation", keywords: ["hardwood", "wood floor"], avgPrice: 8, lowPrice: 5, highPrice: 14, unit: "per sq ft" },
      { item: "Tile installation", keywords: ["tile install", "tile floor", "tile work", "backsplash"], avgPrice: 12, lowPrice: 7, highPrice: 20, unit: "per sq ft" },
      { item: "Countertop (granite)", keywords: ["countertop", "granite", "counter top"], avgPrice: 60, lowPrice: 35, highPrice: 100, unit: "per sq ft" },
      { item: "Countertop (quartz)", keywords: ["quartz"], avgPrice: 70, lowPrice: 40, highPrice: 120, unit: "per sq ft" },
      { item: "Cabinet installation", keywords: ["cabinet"], avgPrice: 5000, lowPrice: 3000, highPrice: 10000, unit: "project" },
      { item: "Window replacement", keywords: ["window replace", "new window"], avgPrice: 650, lowPrice: 350, highPrice: 1000, unit: "per window" },
      { item: "Door installation", keywords: ["door install", "new door"], avgPrice: 400, lowPrice: 200, highPrice: 700, unit: "per door" },
      { item: "General contractor rate", keywords: ["labor", "labour", "per hour", "/hr", "contractor"], avgPrice: 85, lowPrice: 50, highPrice: 130, unit: "per hour" },
    ],
  },
  roofing: {
    name: "Roofing",
    services: [
      { item: "Roof replacement (asphalt shingles)", keywords: ["roof replace", "new roof", "shingle", "asphalt"], avgPrice: 9000, lowPrice: 5500, highPrice: 14000, unit: "project" },
      { item: "Roof repair", keywords: ["roof repair", "roof fix", "roof patch", "leak"], avgPrice: 600, lowPrice: 300, highPrice: 1200, unit: "service" },
      { item: "Gutter installation", keywords: ["gutter"], avgPrice: 1200, lowPrice: 600, highPrice: 2000, unit: "project" },
      { item: "Roof inspection", keywords: ["inspection", "roof inspect"], avgPrice: 200, lowPrice: 100, highPrice: 350, unit: "visit" },
    ],
  },
  hvac: {
    name: "HVAC",
    services: [
      { item: "AC unit installation", keywords: ["ac install", "air condition", "a/c install", "central air"], avgPrice: 5500, lowPrice: 3500, highPrice: 8000, unit: "service" },
      { item: "Furnace installation", keywords: ["furnace install", "heating install", "new furnace"], avgPrice: 4500, lowPrice: 2800, highPrice: 7000, unit: "service" },
      { item: "HVAC maintenance/tune-up", keywords: ["tune up", "maintenance", "service call"], avgPrice: 150, lowPrice: 80, highPrice: 250, unit: "visit" },
      { item: "Duct cleaning", keywords: ["duct clean", "air duct"], avgPrice: 400, lowPrice: 250, highPrice: 600, unit: "service" },
      { item: "Thermostat installation", keywords: ["thermostat"], avgPrice: 250, lowPrice: 150, highPrice: 400, unit: "service" },
      { item: "Refrigerant recharge", keywords: ["refrigerant", "recharge", "freon", "coolant"], avgPrice: 300, lowPrice: 150, highPrice: 500, unit: "service" },
      { item: "HVAC labor rate", keywords: ["labor", "labour", "per hour", "/hr"], avgPrice: 100, lowPrice: 65, highPrice: 150, unit: "per hour" },
    ],
  },
  legal: {
    name: "Legal",
    services: [
      { item: "Attorney consultation", keywords: ["consultation", "consult", "initial"], avgPrice: 250, lowPrice: 100, highPrice: 500, unit: "hour" },
      { item: "Attorney hourly rate", keywords: ["hourly", "per hour", "/hr", "rate"], avgPrice: 300, lowPrice: 150, highPrice: 500, unit: "per hour" },
      { item: "Will preparation (simple)", keywords: ["will", "simple will"], avgPrice: 500, lowPrice: 250, highPrice: 1000, unit: "document" },
      { item: "Trust creation", keywords: ["trust", "living trust"], avgPrice: 2500, lowPrice: 1500, highPrice: 5000, unit: "document" },
      { item: "Divorce (uncontested)", keywords: ["divorce", "uncontested"], avgPrice: 1500, lowPrice: 800, highPrice: 3000, unit: "case" },
      { item: "DUI defense", keywords: ["dui", "dwi"], avgPrice: 3500, lowPrice: 1500, highPrice: 7000, unit: "case" },
      { item: "Business incorporation", keywords: ["incorporation", "incorporate", "llc", "corp"], avgPrice: 1500, lowPrice: 500, highPrice: 3000, unit: "service" },
      { item: "Real estate closing", keywords: ["closing", "real estate"], avgPrice: 1200, lowPrice: 500, highPrice: 2000, unit: "transaction" },
    ],
  },
  wedding: {
    name: "Wedding",
    services: [
      { item: "Wedding photographer", keywords: ["photographer", "photography"], avgPrice: 3500, lowPrice: 1500, highPrice: 6000, unit: "package" },
      { item: "Wedding videographer", keywords: ["videographer", "video"], avgPrice: 2500, lowPrice: 1000, highPrice: 5000, unit: "package" },
      { item: "Wedding DJ", keywords: ["dj", "disc jockey"], avgPrice: 1200, lowPrice: 600, highPrice: 2000, unit: "event" },
      { item: "Wedding florist", keywords: ["florist", "flowers", "floral"], avgPrice: 2500, lowPrice: 1000, highPrice: 5000, unit: "package" },
      { item: "Wedding cake", keywords: ["cake"], avgPrice: 500, lowPrice: 250, highPrice: 1000, unit: "cake" },
      { item: "Wedding venue", keywords: ["venue", "reception", "banquet"], avgPrice: 10000, lowPrice: 3000, highPrice: 25000, unit: "event" },
      { item: "Catering (per person)", keywords: ["catering", "per person", "per head", "per plate"], avgPrice: 75, lowPrice: 35, highPrice: 150, unit: "per person" },
      { item: "Wedding planner", keywords: ["planner", "coordinator"], avgPrice: 3000, lowPrice: 1500, highPrice: 6000, unit: "package" },
    ],
  },
  moving: {
    name: "Moving",
    services: [
      { item: "Local move (2 movers, truck)", keywords: ["local move", "moving", "movers"], avgPrice: 120, lowPrice: 80, highPrice: 180, unit: "per hour" },
      { item: "Long distance move", keywords: ["long distance", "interstate", "cross country"], avgPrice: 4500, lowPrice: 2500, highPrice: 8000, unit: "move" },
      { item: "Packing service", keywords: ["packing", "pack"], avgPrice: 400, lowPrice: 200, highPrice: 700, unit: "service" },
      { item: "Piano moving", keywords: ["piano"], avgPrice: 400, lowPrice: 200, highPrice: 700, unit: "item" },
      { item: "Storage unit (monthly)", keywords: ["storage"], avgPrice: 150, lowPrice: 75, highPrice: 300, unit: "per month" },
    ],
  },
};

// Regional cost-of-living multipliers by zip prefix
export const REGIONAL_MULTIPLIERS: Record<string, { label: string; factor: number }> = {
  "100": { label: "New York, NY", factor: 1.35 },
  "101": { label: "New York, NY", factor: 1.35 },
  "102": { label: "New York, NY", factor: 1.35 },
  "900": { label: "Los Angeles, CA", factor: 1.25 },
  "901": { label: "Los Angeles, CA", factor: 1.25 },
  "941": { label: "San Francisco, CA", factor: 1.40 },
  "940": { label: "San Francisco, CA", factor: 1.40 },
  "606": { label: "Chicago, IL", factor: 1.10 },
  "770": { label: "Houston, TX", factor: 0.95 },
  "750": { label: "Dallas, TX", factor: 0.98 },
  "787": { label: "Austin, TX", factor: 1.05 },
  "331": { label: "Miami, FL", factor: 1.12 },
  "303": { label: "Atlanta, GA", factor: 1.02 },
  "021": { label: "Boston, MA", factor: 1.30 },
  "981": { label: "Seattle, WA", factor: 1.22 },
  "802": { label: "Denver, CO", factor: 1.08 },
  "852": { label: "Phoenix, AZ", factor: 0.97 },
  "191": { label: "Philadelphia, PA", factor: 1.12 },
  "200": { label: "Washington, DC", factor: 1.25 },
  "372": { label: "Nashville, TN", factor: 0.95 },
  "402": { label: "Omaha, NE", factor: 0.88 },
  "612": { label: "Minneapolis, MN", factor: 1.05 },
};

const STATE_FACTORS: Record<string, { factor: number; label: string }> = {
  "CA": { factor: 1.20, label: "California" },
  "NY": { factor: 1.22, label: "New York" },
  "NJ": { factor: 1.15, label: "New Jersey" },
  "CT": { factor: 1.18, label: "Connecticut" },
  "MA": { factor: 1.30, label: "Massachusetts" },
  "WA": { factor: 1.22, label: "Washington" },
  "OR": { factor: 1.10, label: "Oregon" },
  "CO": { factor: 1.08, label: "Colorado" },
  "IL": { factor: 1.10, label: "Illinois" },
  "PA": { factor: 1.12, label: "Pennsylvania" },
  "VA": { factor: 1.08, label: "Virginia" },
  "MD": { factor: 1.12, label: "Maryland" },
  "DC": { factor: 1.25, label: "Washington DC" },
  "FL": { factor: 1.05, label: "Florida" },
  "GA": { factor: 1.02, label: "Georgia" },
  "TX": { factor: 0.95, label: "Texas" },
  "AZ": { factor: 0.97, label: "Arizona" },
  "NV": { factor: 1.05, label: "Nevada" },
  "HI": { factor: 1.35, label: "Hawaii" },
  "AK": { factor: 1.30, label: "Alaska" },
  "TN": { factor: 0.95, label: "Tennessee" },
  "NC": { factor: 0.98, label: "North Carolina" },
  "SC": { factor: 0.92, label: "South Carolina" },
  "OH": { factor: 0.95, label: "Ohio" },
  "MI": { factor: 0.98, label: "Michigan" },
  "MN": { factor: 1.05, label: "Minnesota" },
  "WI": { factor: 0.98, label: "Wisconsin" },
  "IN": { factor: 0.92, label: "Indiana" },
  "MO": { factor: 0.90, label: "Missouri" },
  "AL": { factor: 0.88, label: "Alabama" },
  "MS": { factor: 0.85, label: "Mississippi" },
  "AR": { factor: 0.87, label: "Arkansas" },
  "LA": { factor: 0.92, label: "Louisiana" },
  "OK": { factor: 0.88, label: "Oklahoma" },
  "KS": { factor: 0.90, label: "Kansas" },
  "NE": { factor: 0.88, label: "Nebraska" },
  "IA": { factor: 0.90, label: "Iowa" },
  "ND": { factor: 0.88, label: "North Dakota" },
  "SD": { factor: 0.87, label: "South Dakota" },
  "MT": { factor: 0.92, label: "Montana" },
  "WY": { factor: 0.93, label: "Wyoming" },
  "ID": { factor: 0.95, label: "Idaho" },
  "UT": { factor: 0.98, label: "Utah" },
  "NM": { factor: 0.92, label: "New Mexico" },
  "KY": { factor: 0.90, label: "Kentucky" },
  "WV": { factor: 0.85, label: "West Virginia" },
  "ME": { factor: 1.05, label: "Maine" },
  "NH": { factor: 1.10, label: "New Hampshire" },
  "VT": { factor: 1.08, label: "Vermont" },
  "RI": { factor: 1.12, label: "Rhode Island" },
  "DE": { factor: 1.05, label: "Delaware" },
};

export function getRegionalFactor(zipCode: string): { factor: number; label: string } {
  // Try exact 3-digit prefix match (numeric zip codes)
  const prefix3 = zipCode.slice(0, 3);
  if (REGIONAL_MULTIPLIERS[prefix3]) {
    return REGIONAL_MULTIPLIERS[prefix3];
  }

  // Fall back to first digit broad region (numeric zip codes)
  const firstDigit = zipCode.charAt(0);
  const broadRegions: Record<string, { factor: number; label: string }> = {
    "0": { factor: 1.18, label: "Northeast" },
    "1": { factor: 1.15, label: "Mid-Atlantic" },
    "2": { factor: 1.08, label: "Southeast" },
    "3": { factor: 0.95, label: "Deep South" },
    "4": { factor: 0.98, label: "Great Lakes" },
    "5": { factor: 0.92, label: "Midwest" },
    "6": { factor: 0.95, label: "Central" },
    "7": { factor: 0.93, label: "South Central" },
    "8": { factor: 1.02, label: "Mountain West" },
    "9": { factor: 1.20, label: "West Coast" },
  };

  if (broadRegions[firstDigit]) {
    return broadRegions[firstDigit];
  }

  // Fall back to state abbreviation (when zip is "City, ST" or just "ST")
  const stateMatch = zipCode.match(/\b([A-Z]{2})\b/);
  if (stateMatch && STATE_FACTORS[stateMatch[1]]) {
    return STATE_FACTORS[stateMatch[1]];
  }

  return { factor: 1.0, label: "National Average" };
}

export function matchService(
  lineText: string,
  category: string
): ServicePricing | null {
  const catData = PRICING_DATABASE[category];
  if (!catData) return null;

  const lower = lineText.toLowerCase();

  // Score each service by keyword matches
  let bestMatch: ServicePricing | null = null;
  let bestScore = 0;

  for (const service of catData.services) {
    let score = 0;
    for (const kw of service.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += kw.length; // Longer keyword matches are more specific
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = service;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}
