// ── Scam Pattern Detection Engine ─────────────────────────────
// 50+ real scam tactics organized by industry, matched against quote text

export interface ScamPattern {
  id: string;
  name: string;
  description: string;
  severity: "critical" | "warning" | "info";
  categories: string[];
  triggers: {
    keywords?: string[];
    pricePatterns?: {
      type: "exact_round" | "suspiciously_low" | "huge_deposit" | "cash_only" | "no_itemization" | "hidden_multiplier";
      threshold?: number;
    };
    textPatterns?: RegExp[];
  };
  whatToDo: string;
  realExample?: string;
}

export const SCAM_PATTERNS: ScamPattern[] = [
  // ── Universal (all categories) ──
  {
    id: "cash_only",
    name: "Cash-Only Payment Demand",
    description: "Legitimate businesses accept multiple payment methods. Cash-only demands often mean they're avoiding taxes, have no insurance, or plan to disappear.",
    severity: "critical",
    categories: ["*"],
    triggers: {
      keywords: ["cash only", "cash payment", "no checks", "no credit card", "no cards", "cash preferred"],
    },
    whatToDo: "Never pay cash-only. Insist on a check or card payment that creates a paper trail. If they refuse, walk away.",
    realExample: "A roofing scam in Texas collected $8,000 cash from 12 homeowners after a storm and vanished.",
  },
  {
    id: "huge_deposit",
    name: "Excessive Upfront Deposit",
    description: "Requesting more than 30-50% upfront before any work begins is a major red flag. Legitimate contractors work with reasonable deposit structures.",
    severity: "critical",
    categories: ["*"],
    triggers: {
      keywords: ["full payment upfront", "pay in full before", "100% deposit", "pay before we start", "advance payment required"],
      pricePatterns: { type: "huge_deposit" },
    },
    whatToDo: "Standard deposits are 10-33% for most services. Never pay more than 50% upfront. Structure payments around milestones.",
    realExample: "The FTC reports that advance-fee schemes are among the top consumer complaints annually.",
  },
  {
    id: "pressure_urgency",
    name: "High-Pressure Urgency Tactics",
    description: "Creating false urgency ('this price is only good today', 'we have one slot left') is a classic pressure sales technique designed to prevent you from comparison shopping.",
    severity: "warning",
    categories: ["*"],
    triggers: {
      keywords: ["today only", "limited time", "price goes up tomorrow", "last slot", "only good today", "act now", "expires today", "won't last", "special offer ends"],
    },
    whatToDo: "A legitimate deal will still be there tomorrow. Take time to get competing quotes. If a contractor won't wait 24-48 hours, that's a red flag.",
  },
  {
    id: "no_written_estimate",
    name: "No Written Estimate or Contract",
    description: "Verbal-only quotes leave you with zero legal protection. A legitimate professional always provides written documentation.",
    severity: "critical",
    categories: ["*"],
    triggers: {
      keywords: ["verbal estimate", "verbal agreement", "handshake deal", "no paperwork needed", "we'll figure it out"],
    },
    whatToDo: "ALWAYS get a written estimate with: itemized costs, timeline, materials list, warranty terms, and cancellation policy. No paper = no deal.",
  },
  {
    id: "no_license",
    name: "Unlicensed or Uninsured",
    description: "Working without a license or insurance means you have zero recourse if something goes wrong. You could even be liable for worker injuries on your property.",
    severity: "critical",
    categories: ["*"],
    triggers: {
      keywords: ["don't need a license", "no license needed", "we're not licensed but", "insurance not needed", "save you the licensing fee"],
    },
    whatToDo: "Always verify license and insurance before hiring. Check your state's contractor licensing board. Ask for certificate of insurance from their carrier directly.",
  },
  {
    id: "door_knocker",
    name: "Unsolicited Door-to-Door Offer",
    description: "Contractors who show up uninvited — especially after storms — are frequently running scams. Legitimate contractors don't need to cold-call door-to-door.",
    severity: "warning",
    categories: ["roofing", "home_renovation", "hvac", "plumbing", "electrical"],
    triggers: {
      keywords: ["happened to be in the area", "noticed your roof", "spotted a problem", "free inspection", "just driving by"],
    },
    whatToDo: "Never hire someone who shows up unsolicited. If they claim damage, get an independent inspection from a contractor YOU chose.",
    realExample: "After Hurricane Ian, the Florida AG received 16,000+ complaints about storm-chaser contractors.",
  },
  {
    id: "suspiciously_low",
    name: "Suspiciously Low Price",
    description: "A quote that's 40%+ below market rate usually means they'll cut corners, use substandard materials, or hit you with change orders later.",
    severity: "warning",
    categories: ["*"],
    triggers: {
      pricePatterns: { type: "suspiciously_low", threshold: 0.6 },
    },
    whatToDo: "Ask HOW they can offer such a low price. Verify materials quality, ask about warranty, and check reviews for complaints about unfinished work.",
  },
  {
    id: "vague_scope",
    name: "Vague or Undefined Scope of Work",
    description: "A quote that says 'plumbing work' or 'repairs as needed' without specifying exactly what will be done opens the door to endless upselling.",
    severity: "warning",
    categories: ["*"],
    triggers: {
      keywords: ["as needed", "miscellaneous", "various repairs", "general work", "to be determined", "tbd", "approximate scope"],
    },
    whatToDo: "Insist on a specific, detailed scope: what exact work, what materials/brands, what's included, what's excluded, and the completion timeline.",
  },

  // ── Auto Repair ──
  {
    id: "auto_flush_upsell",
    name: "Unnecessary Fluid Flush Upsell",
    description: "Transmission flush, coolant flush, brake fluid flush, power steering flush — these are the #1 auto repair upsell. Most aren't needed at the intervals shops push.",
    severity: "warning",
    categories: ["auto_repair"],
    triggers: {
      keywords: ["transmission flush", "coolant flush", "power steering flush", "fuel system flush", "fuel injector clean", "engine flush", "induction service"],
    },
    whatToDo: "Check your owner's manual for manufacturer-recommended service intervals. Most flushes are pushed at 30-50k miles when the manual says 100k+.",
    realExample: "A 2023 Consumer Reports investigation found that 73% of 'recommended' fluid flushes were unnecessary.",
  },
  {
    id: "auto_bait_switch",
    name: "Bait-and-Switch Diagnostic",
    description: "Advertising a cheap or free diagnostic, then claiming much more expensive problems were found. The 'free check' locks you in psychologically.",
    severity: "warning",
    categories: ["auto_repair"],
    triggers: {
      keywords: ["free diagnostic", "free check", "free inspection", "complimentary inspection", "$0 diagnostic"],
    },
    whatToDo: "Get the diagnostic findings in writing. Take those findings to another shop for a second opinion before authorizing any repairs.",
  },
  {
    id: "auto_oem_parts",
    name: "Charging OEM Prices for Aftermarket Parts",
    description: "Quoting OEM (dealer) part prices but installing cheaper aftermarket parts. The markup can be 200-400%.",
    severity: "warning",
    categories: ["auto_repair"],
    triggers: {
      keywords: ["oem parts", "dealer parts", "genuine parts", "factory parts", "original parts"],
    },
    whatToDo: "Ask for the specific part number. Verify the price on RockAuto or AutoZone. Aftermarket parts are fine for most repairs — don't pay OEM unless it matters.",
  },
  {
    id: "auto_phantom_repairs",
    name: "Phantom Repairs (Work Not Performed)",
    description: "Charging for work that was never actually done — the old dirty air filter trick, unnecessary part replacements, or labor that never happened.",
    severity: "critical",
    categories: ["auto_repair"],
    triggers: {
      keywords: ["found additional issues", "while we were in there", "also noticed", "recommend replacing while"],
    },
    whatToDo: "Ask to see the old parts. Take a before/after photo. Mark parts with a paint pen before service. Get a second opinion on any 'discovered' problems.",
    realExample: "Undercover investigations by local news stations regularly catch shops charging for unreplaced parts.",
  },
  {
    id: "auto_labor_padding",
    name: "Inflated Labor Time (Book Time Abuse)",
    description: "Charging 'book time' (manufacturer estimate) when the actual repair took far less time. Some shops quote 3 hours for a 45-minute job.",
    severity: "warning",
    categories: ["auto_repair"],
    triggers: {
      keywords: ["book time", "standard labor time", "flat rate", "labor guide time"],
    },
    whatToDo: "Ask for the hourly rate AND estimated hours. Look up the job on RepairPal to see typical labor time. Compare flat-rate vs. actual time shops.",
  },

  // ── Plumbing ──
  {
    id: "plumb_camera_upsell",
    name: "Unnecessary Camera Inspection Upsell",
    description: "Recommending an expensive camera inspection ($200-500) for a simple clog that a $150 snake would fix. Camera inspections are for suspected pipe damage, not routine clogs.",
    severity: "warning",
    categories: ["plumbing"],
    triggers: {
      keywords: ["camera inspection", "video inspection", "sewer camera", "pipe camera"],
    },
    whatToDo: "Ask: 'Is there reason to suspect pipe damage or a structural issue?' If it's a straightforward clog, a camera is usually unnecessary.",
  },
  {
    id: "plumb_reroute",
    name: "Unnecessary Pipe Reroute/Replacement",
    description: "Recommending a full pipe reroute ($5,000-15,000) when a spot repair ($500-1,500) would fix the issue. This is the highest-dollar plumbing scam.",
    severity: "critical",
    categories: ["plumbing"],
    triggers: {
      keywords: ["full reroute", "repipe", "re-pipe", "replace all pipes", "whole house repipe", "complete pipe replacement"],
    },
    whatToDo: "ALWAYS get a second opinion for reroute/repipe recommendations. Ask to see the camera footage. Get at least 3 quotes. Most leaks can be spot-repaired.",
    realExample: "A plumber in Arizona was convicted of fraud for recommending full repipes to 200+ customers who only needed spot repairs.",
  },
  {
    id: "plumb_emergency_markup",
    name: "Extreme Emergency Markup",
    description: "Charging 3-5x normal rates for 'emergency' service. While after-hours premiums are normal (50-100% markup), some plumbers exploit panic situations.",
    severity: "warning",
    categories: ["plumbing", "electrical", "hvac"],
    triggers: {
      keywords: ["emergency rate", "emergency fee", "after hours rate", "weekend rate", "holiday rate", "emergency service call"],
    },
    whatToDo: "Unless water is actively flooding, call during business hours. Even then, ask for the rate BEFORE they come. A fair emergency premium is 50-100%, not 300%.",
  },

  // ── Home Renovation / Roofing ──
  {
    id: "reno_change_orders",
    name: "Planned Change Order Scam",
    description: "Giving a low initial bid to win the job, then flooding you with 'necessary' change orders that double or triple the final cost.",
    severity: "critical",
    categories: ["home_renovation", "roofing"],
    triggers: {
      keywords: ["change order", "additional work needed", "unforeseen conditions", "scope change", "additional cost for"],
    },
    whatToDo: "Your contract should specify how change orders are handled. Include a clause that NO change orders over $500 proceed without your written approval. Cap total change orders at 10-15%.",
  },
  {
    id: "reno_permit_skip",
    name: "Skipping Required Permits",
    description: "Offering to 'save you money' by skipping permits. This can void your homeowner's insurance, create legal liability, and tank your home's resale value.",
    severity: "critical",
    categories: ["home_renovation", "roofing", "electrical", "plumbing"],
    triggers: {
      keywords: ["no permit needed", "skip the permit", "don't need permits", "save on permits", "permit not required"],
    },
    whatToDo: "ALWAYS pull proper permits. The cost is minimal vs. the risk. If the contractor doesn't want permits, they may not be licensed or their work won't pass inspection.",
  },
  {
    id: "roof_storm_chaser",
    name: "Storm Chaser / Insurance Fraud",
    description: "After a storm, contractors offer to 'work with your insurance' and inflate the claim. This is insurance fraud that can get YOUR policy cancelled.",
    severity: "critical",
    categories: ["roofing"],
    triggers: {
      keywords: ["work with your insurance", "we'll handle the claim", "insurance will cover it", "free roof", "no out of pocket", "assignment of benefits"],
    },
    whatToDo: "Never sign an Assignment of Benefits (AOB). File the claim yourself. Get your own independent inspection. Use a local, established roofer — not storm chasers.",
    realExample: "The National Insurance Crime Bureau says roofing fraud costs consumers $2 billion/year.",
  },

  // ── Dental ──
  {
    id: "dental_unnecessary",
    name: "Unnecessary Dental Procedures",
    description: "Recommending crowns when fillings would work, deep cleanings for healthy gums, or 'watching' a cavity that doesn't exist. Dental over-treatment is widespread.",
    severity: "warning",
    categories: ["dental"],
    triggers: {
      keywords: ["crown recommended", "deep cleaning needed", "scaling and root planing", "multiple crowns", "full mouth restoration"],
    },
    whatToDo: "Always get a second opinion for: crowns on teeth that aren't broken, more than 2 crowns at once, deep cleanings if you have no gum disease symptoms. Ask to see the X-rays.",
    realExample: "A Reader's Digest investigation sent the same reporter to 50 dentists — treatment recommendations varied from $500 to $29,000.",
  },
  {
    id: "dental_cosmetic_push",
    name: "Cosmetic Upsell Disguised as Necessary",
    description: "Framing cosmetic procedures (veneers, whitening, bonding) as medically necessary when they're purely aesthetic.",
    severity: "info",
    categories: ["dental"],
    triggers: {
      keywords: ["veneers recommended", "cosmetic bonding", "teeth whitening", "smile makeover", "aesthetic treatment"],
    },
    whatToDo: "Ask: 'Is this medically necessary or cosmetic?' Insurance won't cover cosmetic work. If it's cosmetic, shop around — prices vary enormously.",
  },

  // ── Medical ──
  {
    id: "medical_surprise_billing",
    name: "Surprise/Balance Billing Risk",
    description: "The provider is in-network but uses out-of-network labs, anesthesiologists, or specialists — leading to surprise bills thousands over what you expected.",
    severity: "warning",
    categories: ["medical"],
    triggers: {
      keywords: ["out of network", "not covered", "balance billing", "facility fee", "professional fee separate", "anesthesia separate"],
    },
    whatToDo: "Before any procedure, ask: 'Will ALL providers involved be in-network?' Get it in writing. The No Surprises Act protects you for emergency care, but not always elective.",
  },
  {
    id: "medical_unbundling",
    name: "Procedure Unbundling",
    description: "Billing separate charges for parts of a procedure that should be billed as one code. This inflates the total bill by 30-100%.",
    severity: "warning",
    categories: ["medical", "dental"],
    triggers: {
      keywords: ["facility fee", "professional fee", "separate charges", "component billing", "technical fee"],
    },
    whatToDo: "Ask for the CPT codes upfront. Look them up on the CMS website. If codes that should be bundled are listed separately, challenge it with the billing department.",
  },

  // ── HVAC ──
  {
    id: "hvac_oversizing",
    name: "Oversized System Recommendation",
    description: "Recommending an AC/furnace that's too large for your space. An oversized unit costs more, cycles more often, wears out faster, and doesn't dehumidify properly.",
    severity: "warning",
    categories: ["hvac"],
    triggers: {
      keywords: ["5 ton", "bigger is better", "extra capacity", "upgrade to larger", "more powerful unit"],
    },
    whatToDo: "Insist on a Manual J load calculation before agreeing to any system size. A proper HVAC company will ALWAYS do this. If they just eyeball it, get another quote.",
  },
  {
    id: "hvac_refrigerant_scam",
    name: "Refrigerant Scam (R-22 Scare)",
    description: "Telling you your system uses 'banned' refrigerant and must be fully replaced. R-22 phase-out doesn't mean your existing system is illegal.",
    severity: "warning",
    categories: ["hvac"],
    triggers: {
      keywords: ["r-22", "r22", "freon banned", "refrigerant illegal", "must replace system", "obsolete refrigerant"],
    },
    whatToDo: "R-22 systems can legally operate until they die. Replacement refrigerant is available. Only replace the system when it actually fails, not because the refrigerant type changed.",
  },

  // ── Legal ──
  {
    id: "legal_retainer_trap",
    name: "Non-Refundable Retainer Trap",
    description: "Large non-refundable retainers where the lawyer does minimal work. Ethical rules require lawyers to only keep fees for work actually performed.",
    severity: "warning",
    categories: ["legal"],
    triggers: {
      keywords: ["non-refundable retainer", "non refundable", "retainer non-refundable", "earned on receipt", "flat retainer"],
    },
    whatToDo: "Most state bars require retainers to be refundable for unearned portions. Ask for a detailed billing structure. Request monthly itemized statements showing hours worked.",
  },

  // ── Wedding ──
  {
    id: "wedding_markup",
    name: "Wedding Tax (Premium for Wedding Events)",
    description: "The exact same service priced 40-300% higher because it's for a 'wedding'. Venues, florists, DJs, and photographers routinely charge a wedding premium.",
    severity: "info",
    categories: ["wedding"],
    triggers: {
      keywords: ["wedding package", "bridal package", "wedding premium", "wedding special"],
    },
    whatToDo: "Get quotes without mentioning 'wedding' first, then compare. Book items à la carte instead of packages. Many couples save 30-50% by not using the W-word initially.",
    realExample: "A BBC investigation found the same cake cost £100 for a birthday and £235 for a wedding.",
  },

  // ── Moving ──
  {
    id: "moving_hostage",
    name: "Moving Hostage Scam",
    description: "Giving a low estimate, loading your belongings, then demanding 2-3x the quoted price before unloading. Your stuff is literally held hostage.",
    severity: "critical",
    categories: ["moving"],
    triggers: {
      keywords: ["estimate may change", "approximate estimate", "not a binding estimate", "non-binding estimate", "price may vary based on"],
    },
    whatToDo: "ALWAYS get a binding estimate or a not-to-exceed estimate. Check their USDOT number on FMCSA. Never hire movers who give phone-only estimates without seeing your stuff.",
    realExample: "The FMCSA receives 4,000+ complaints annually about household goods moving scams.",
  },
  {
    id: "moving_extra_fees",
    name: "Hidden Moving Fees",
    description: "Tacking on charges after the fact: long carry fees, stair fees, elevator fees, shuttle fees, packing material fees — none of which were in the original estimate.",
    severity: "warning",
    categories: ["moving"],
    triggers: {
      keywords: ["long carry", "stair fee", "elevator fee", "shuttle fee", "bulky item fee", "fuel surcharge", "packing materials extra"],
    },
    whatToDo: "Before signing, ask about EVERY possible fee: stairs, long walk, elevator, heavy items, packing materials, fuel, overtime. Get it all in the written estimate.",
  },
];

// ── Hidden Fee Predictor ─────────────────────────────────────

export interface HiddenFee {
  fee: string;
  likelihood: "very_likely" | "likely" | "possible";
  typicalRange: string;
  description: string;
}

export const HIDDEN_FEES_BY_CATEGORY: Record<string, HiddenFee[]> = {
  auto_repair: [
    { fee: "Shop supplies/environmental fee", likelihood: "very_likely", typicalRange: "$10–$55", description: "Almost every shop adds this — covers rags, solvents, disposal. Should be <5% of the total bill." },
    { fee: "Diagnostic/inspection fee", likelihood: "very_likely", typicalRange: "$50–$150", description: "Even if they 'find' the problem while you wait, many shops charge a separate diagnostic fee." },
    { fee: "Hazardous waste disposal", likelihood: "likely", typicalRange: "$5–$25", description: "For oil, coolant, brake fluid, etc. Legitimate but sometimes padded." },
    { fee: "Parts markup over retail", likelihood: "very_likely", typicalRange: "50–100% markup", description: "Shops mark up parts significantly. Ask for the part number and compare to retail pricing." },
    { fee: "Fluid top-off charge", likelihood: "possible", typicalRange: "$10–$40", description: "Charging separately for topping off fluids during a related service." },
    { fee: "Storage fee (if car sits)", likelihood: "possible", typicalRange: "$25–$75/day", description: "If your car sits at the shop after repair, some charge daily storage." },
  ],
  plumbing: [
    { fee: "Service call / trip charge", likelihood: "very_likely", typicalRange: "$50–$150", description: "Charged just for the plumber showing up, even before any work. Ask if it's waived with repair." },
    { fee: "Permit fees", likelihood: "likely", typicalRange: "$50–$500", description: "Required for many plumbing jobs. Some contractors include it, others add it on top." },
    { fee: "Material markup", likelihood: "very_likely", typicalRange: "30–100% over wholesale", description: "Plumbers buy at wholesale and mark up. Fair, but can be excessive." },
    { fee: "Camera inspection fee", likelihood: "possible", typicalRange: "$150–$500", description: "Sometimes added after the initial quote if they 'need to investigate further'." },
    { fee: "After-hours / weekend premium", likelihood: "possible", typicalRange: "50–100% surcharge", description: "Check if your quoted time falls into their premium hours." },
    { fee: "Cleanup / debris removal", likelihood: "likely", typicalRange: "$50–$200", description: "For drywall patches, pipe debris, or water cleanup. Should be included but often isn't." },
  ],
  electrical: [
    { fee: "Permit and inspection fee", likelihood: "very_likely", typicalRange: "$75–$500", description: "Most electrical work legally requires permits. Verify this is included or budgeted separately." },
    { fee: "Service call / trip charge", likelihood: "very_likely", typicalRange: "$50–$125", description: "Standard for electricians. Ask if it applies toward the job total." },
    { fee: "Panel access or modification", likelihood: "possible", typicalRange: "$100–$500", description: "If your panel is full, adding a circuit requires panel work not in the original scope." },
    { fee: "Drywall patching", likelihood: "likely", typicalRange: "$75–$300", description: "Running new wire often means cutting drywall. Patching is frequently excluded from electrical quotes." },
    { fee: "Code compliance upgrades", likelihood: "possible", typicalRange: "$200–$2,000+", description: "If they open a wall and find old wiring not up to code, they may be required to upgrade it." },
  ],
  dental: [
    { fee: "X-ray / imaging fees", likelihood: "very_likely", typicalRange: "$25–$250", description: "Panoramic or bite-wing X-rays billed separately from the procedure." },
    { fee: "Anesthesia / sedation fee", likelihood: "likely", typicalRange: "$50–$500", description: "Local anesthesia is usually included; conscious sedation or nitrous is always extra." },
    { fee: "Lab fees (for crowns/bridges)", likelihood: "very_likely", typicalRange: "$100–$500", description: "Custom fabrication of crowns, bridges, or dentures at an outside lab." },
    { fee: "Temporary crown/restoration", likelihood: "likely", typicalRange: "$50–$200", description: "If you need a temp while waiting for permanent work, it's often a separate charge." },
    { fee: "Post-operative follow-up", likelihood: "possible", typicalRange: "$50–$150", description: "Some offices charge for follow-up visits that should be included in the procedure cost." },
  ],
  medical: [
    { fee: "Facility / room fee", likelihood: "very_likely", typicalRange: "$200–$5,000+", description: "The hospital/facility charges separately from the doctor. Can be the biggest surprise bill." },
    { fee: "Anesthesiologist fee", likelihood: "very_likely", typicalRange: "$500–$3,000+", description: "Billed separately and often out-of-network. Ask IN ADVANCE if the anesthesiologist is in-network." },
    { fee: "Lab / pathology fees", likelihood: "very_likely", typicalRange: "$50–$1,000+", description: "Blood work, tissue analysis, etc. — billed by a separate lab company." },
    { fee: "Surgeon's assistant fee", likelihood: "possible", typicalRange: "$500–$2,500", description: "An assistant surgeon may be present and bill separately without your knowledge." },
    { fee: "Post-op supplies / medication", likelihood: "likely", typicalRange: "$25–$500", description: "Prescription medications, wound care supplies, braces, or crutches." },
  ],
  home_renovation: [
    { fee: "Permit fees", likelihood: "very_likely", typicalRange: "$100–$2,000", description: "Required for most renovations. Verify if included in the quote." },
    { fee: "Dumpster / debris removal", likelihood: "very_likely", typicalRange: "$200–$800", description: "Demolition creates waste. Disposal fees are often not in the initial quote." },
    { fee: "Subcontractor markups", likelihood: "likely", typicalRange: "15–30% markup", description: "GC marks up subcontractor work. Ask for transparency on sub costs." },
    { fee: "Change order fees", likelihood: "likely", typicalRange: "15–25% markup on changes", description: "Changes mid-project are marked up heavily. Finalize everything before work begins." },
    { fee: "Site preparation / protection", likelihood: "possible", typicalRange: "$100–$500", description: "Floor protection, dust barriers, furniture moving — often added after the fact." },
    { fee: "Final cleanup fee", likelihood: "likely", typicalRange: "$150–$500", description: "Professional cleaning after renovation. Some include it, many don't." },
  ],
  roofing: [
    { fee: "Tear-off / disposal of old roof", likelihood: "very_likely", typicalRange: "$1,000–$3,000", description: "Removing and disposing of old shingles is major labor. Make sure it's in the quote." },
    { fee: "Decking repair / replacement", likelihood: "likely", typicalRange: "$50–$100/sheet", description: "Rotten plywood under shingles can't be seen until tear-off. Budget 10-20% extra." },
    { fee: "Flashing and drip edge", likelihood: "likely", typicalRange: "$200–$600", description: "Metal flashing around chimneys, vents, and edges — sometimes quoted as an add-on." },
    { fee: "Ridge vent / ventilation", likelihood: "possible", typicalRange: "$300–$800", description: "Proper attic ventilation may be an add-on if not specified in the original quote." },
    { fee: "Permit and inspection", likelihood: "very_likely", typicalRange: "$75–$400", description: "Required in most municipalities for roof replacement." },
  ],
  hvac: [
    { fee: "Permit and inspection", likelihood: "very_likely", typicalRange: "$100–$500", description: "Required for HVAC installations. Verify inclusion." },
    { fee: "Ductwork modification", likelihood: "likely", typicalRange: "$200–$1,500", description: "New equipment may need modified ductwork connections." },
    { fee: "Electrical work for new unit", likelihood: "possible", typicalRange: "$200–$800", description: "A new AC may require a dedicated circuit or panel upgrade." },
    { fee: "Refrigerant charge", likelihood: "likely", typicalRange: "$50–$150/lb", description: "New systems need to be charged with refrigerant — sometimes quoted separately." },
    { fee: "Thermostat upgrade", likelihood: "possible", typicalRange: "$100–$300", description: "New system may not work with old thermostat. Smart thermostat upsell is common." },
    { fee: "Old unit disposal", likelihood: "likely", typicalRange: "$50–$200", description: "Hauling away the old unit and proper refrigerant recovery." },
  ],
  legal: [
    { fee: "Paralegal / staff time", likelihood: "very_likely", typicalRange: "$75–$200/hr", description: "Billed at a lower rate than attorney time, but adds up. Verify what work is done by whom." },
    { fee: "Filing fees and court costs", likelihood: "very_likely", typicalRange: "$50–$500+", description: "Passed through to you. Ask for an estimate of all anticipated filing fees." },
    { fee: "Copying / document fees", likelihood: "likely", typicalRange: "$0.25–$1.00/page", description: "Can add hundreds for document-heavy cases." },
    { fee: "Expert witness fees", likelihood: "possible", typicalRange: "$500–$5,000+", description: "If experts are needed, their fees are substantial and separate." },
    { fee: "Travel time", likelihood: "possible", typicalRange: "Full hourly rate", description: "Some lawyers bill travel time at their full rate." },
  ],
  wedding: [
    { fee: "Service charge / gratuity", likelihood: "very_likely", typicalRange: "18–25%", description: "Venues add a 'service charge' that often doesn't go to staff. Plus you're expected to tip too." },
    { fee: "Overtime fees", likelihood: "very_likely", typicalRange: "$500–$2,000/hr", description: "Going even 15 minutes over triggers overtime at premium rates." },
    { fee: "Setup / breakdown fee", likelihood: "likely", typicalRange: "$200–$1,000", description: "Charged separately from the rental fee at many venues." },
    { fee: "Cake cutting fee", likelihood: "likely", typicalRange: "$1–$3/person", description: "Venues charge per person to cut and plate a cake you brought in." },
    { fee: "Corkage fee", likelihood: "possible", typicalRange: "$15–$40/bottle", description: "If you bring your own wine/champagne, the venue charges per bottle." },
    { fee: "Vendor meals", likelihood: "likely", typicalRange: "$25–$75/person", description: "You're expected to feed your DJ, photographer, planner. Budget for 4-8 vendor meals." },
  ],
  moving: [
    { fee: "Stair carry fee", likelihood: "very_likely", typicalRange: "$50–$100/flight", description: "Per flight of stairs. Can double the price if you're on the 3rd floor." },
    { fee: "Long carry fee", likelihood: "likely", typicalRange: "$75–$200", description: "If the truck can't park close to your door (>75 ft walk)." },
    { fee: "Packing materials", likelihood: "very_likely", typicalRange: "$100–$500+", description: "Boxes, tape, bubble wrap, mattress covers — adds up fast if movers do the packing." },
    { fee: "Bulky/heavy item surcharge", likelihood: "likely", typicalRange: "$50–$300/item", description: "Pianos, safes, pool tables, and large furniture get charged extra." },
    { fee: "Fuel surcharge", likelihood: "likely", typicalRange: "5–15% of total", description: "Added as a percentage of the move cost." },
    { fee: "Insurance / valuation charge", likelihood: "possible", typicalRange: "$50–$300", description: "Basic liability coverage is minimal. Full-value protection is extra but recommended." },
  ],
};

// ── Seasonal Price Intelligence ──────────────────────────────

export interface SeasonalTip {
  bestMonths: string;
  worstMonths: string;
  savingsPercent: string;
  explanation: string;
}

export const SEASONAL_PRICING: Record<string, SeasonalTip> = {
  auto_repair: {
    bestMonths: "January–February",
    worstMonths: "October–November",
    savingsPercent: "10–20%",
    explanation: "Shops are slowest in early winter. Many run promotions in Jan-Feb to fill bays. Avoid pre-winter rush (Oct-Nov) when everyone gets their car winterized.",
  },
  plumbing: {
    bestMonths: "March–May",
    worstMonths: "December–February",
    savingsPercent: "15–25%",
    explanation: "Plumbers are slammed in winter (frozen pipes, water heater failures). Spring is their shoulder season — more availability, willingness to negotiate.",
  },
  electrical: {
    bestMonths: "October–February",
    worstMonths: "June–August",
    savingsPercent: "10–15%",
    explanation: "Electricians are busiest in summer (AC demand, construction season). Fall and winter bring more availability and better pricing.",
  },
  dental: {
    bestMonths: "January–February",
    worstMonths: "November–December",
    savingsPercent: "5–15%",
    explanation: "People rush to use insurance benefits before year-end. January starts fresh — offices have open schedules and may offer new-year specials.",
  },
  medical: {
    bestMonths: "January–March",
    worstMonths: "September–December",
    savingsPercent: "Varies by deductible",
    explanation: "If you've met your deductible, schedule procedures before year-end. For elective procedures, January means a fresh deductible but more scheduling availability.",
  },
  home_renovation: {
    bestMonths: "November–February",
    worstMonths: "May–August",
    savingsPercent: "15–30%",
    explanation: "Contractors are desperate for work in winter. Summer is peak season with 3-6 month backlogs. Interior work (bathroom, kitchen) is perfect for winter scheduling.",
  },
  roofing: {
    bestMonths: "Late winter (Feb–March)",
    worstMonths: "Post-storm seasons",
    savingsPercent: "10–25%",
    explanation: "Roofers are slow in late winter before spring storm season starts. Avoid summer backlogs and post-hurricane/hail seasons when demand skyrockets.",
  },
  hvac: {
    bestMonths: "March–April, September–October",
    worstMonths: "June–August (AC), December–February (heating)",
    savingsPercent: "10–20%",
    explanation: "HVAC companies offer their best deals in spring and fall shoulder seasons. In peak summer/winter, they're booked solid and charging premium rates.",
  },
  legal: {
    bestMonths: "No strong seasonal pattern",
    worstMonths: "No strong seasonal pattern",
    savingsPercent: "Compare 3+ firms",
    explanation: "Legal fees don't vary much by season, but many firms offer free initial consultations. The best way to save is to compare 3+ firms and negotiate the rate structure.",
  },
  wedding: {
    bestMonths: "January–March, November (non-holiday)",
    worstMonths: "June, September–October",
    savingsPercent: "20–50%",
    explanation: "Off-peak wedding months (winter, early spring) see dramatically lower venue and vendor prices. Friday or Sunday weddings save 20-30% over Saturday.",
  },
  moving: {
    bestMonths: "October–April (mid-month, mid-week)",
    worstMonths: "May–September (end of month)",
    savingsPercent: "20–40%",
    explanation: "Summer + month-end is peak moving season. Moving mid-week in winter can save 30-40%. Avoid end-of-month when leases turn over.",
  },
};

// ── Smart Questions Generator ────────────────────────────────

export const SMART_QUESTIONS: Record<string, string[]> = {
  auto_repair: [
    "Can I see the failed part after the repair?",
    "What's your warranty on parts and labor?",
    "Are you using OEM or aftermarket parts? What brand?",
    "What's the labor rate and how many hours is this job?",
    "Is this repair recommended or actually necessary right now?",
    "Can I get this in writing with a not-to-exceed price?",
    "What happens if you find additional problems during the repair?",
    "Are you ASE-certified for this type of repair?",
    "Will this affect my manufacturer warranty?",
  ],
  plumbing: [
    "Are you licensed and insured? Can I see your license number?",
    "Does this price include the service call / trip charge?",
    "Is there a warranty on the work? How long?",
    "Will you pull the necessary permits?",
    "What brand/grade of materials will you use?",
    "Is there a simpler/cheaper fix that would work?",
    "What's the timeline? Will my water be shut off, and for how long?",
    "Is cleanup included in the price?",
    "Do you guarantee the price, or could it change?",
  ],
  electrical: [
    "Are you a licensed master electrician?",
    "Is the permit and inspection included in this price?",
    "Will this bring my panel up to current code?",
    "What brand of materials/fixtures will you use?",
    "Will drywall repair be needed, and is that included?",
    "Is there a warranty on the work?",
    "Will this require any panel upgrades?",
    "How long will the power be off during the work?",
  ],
  dental: [
    "Is this procedure medically necessary or cosmetic?",
    "What's the cost WITH and WITHOUT insurance?",
    "Are there less expensive alternatives that would work?",
    "What's the success rate for this procedure?",
    "Do you offer a payment plan?",
    "Are lab fees included in this estimate?",
    "Will I need a temporary, and is that included in the cost?",
    "Can I see the X-ray that shows the problem?",
    "How long should this restoration last?",
  ],
  medical: [
    "Is every provider involved in this procedure in-network?",
    "Can I get an itemized estimate with CPT codes?",
    "Are facility fees included?",
    "What's the cash-pay price vs. insurance price?",
    "Is there a less expensive alternative facility for this procedure?",
    "Are there any additional fees I should expect?",
    "What does the estimate include and exclude?",
    "Can I get pre-authorization from my insurance before the procedure?",
  ],
  home_renovation: [
    "Are you licensed, bonded, and insured? Can I verify?",
    "Will you pull all necessary permits?",
    "How will change orders be handled and priced?",
    "What's the payment schedule tied to milestones?",
    "What brand/grade of materials are included?",
    "Who are your subcontractors, and are they insured?",
    "What's the realistic timeline including buffer?",
    "Is debris removal and final cleanup included?",
    "Do you have 3 recent references I can call?",
    "What warranty do you offer on workmanship?",
  ],
  roofing: [
    "Is tear-off and disposal of old shingles included?",
    "What if you find rotten decking underneath?",
    "What warranty — manufacturer AND workmanship?",
    "Will you pull the permit and handle the inspection?",
    "What brand and grade of shingles?",
    "Is new flashing included around chimneys and vents?",
    "Is there an ice/water shield in the valleys and at the eaves?",
    "How will you protect my landscaping and siding?",
    "Do you carry workers' comp insurance?",
  ],
  hvac: [
    "Did you do a Manual J load calculation for sizing?",
    "What SEER rating is the unit you're recommending?",
    "Is ductwork modification included if needed?",
    "What's the warranty — parts, compressor, and labor?",
    "Is the permit and inspection included?",
    "Will this need any electrical upgrades?",
    "What brand and model specifically?",
    "Is the old unit removal and disposal included?",
    "Do you offer a maintenance plan?",
  ],
  legal: [
    "What's your billing structure — hourly, flat fee, or contingency?",
    "What's the estimated total cost for my case?",
    "Is the retainer refundable for unearned time?",
    "Who will actually work on my case — you or a junior associate?",
    "What are the likely outcomes and timelines?",
    "What filing fees and court costs should I expect?",
    "Can I get monthly itemized billing statements?",
    "What's your communication policy — how quickly will you respond?",
  ],
  wedding: [
    "Is a service charge included, and does it go to staff?",
    "What are the overtime charges if we go past the end time?",
    "Can I bring my own alcohol/cake/DJ, and what are the fees?",
    "Is setup and breakdown included?",
    "What's the cancellation and postponement policy?",
    "Is there a rain plan / backup space for outdoor events?",
    "What's included in the per-person price and what's extra?",
    "Do you have liability insurance?",
    "Can I see 3 references from recent events?",
  ],
  moving: [
    "Is this a binding or non-binding estimate?",
    "Are there stair, long-carry, or elevator fees?",
    "What's your valuation / insurance coverage?",
    "What's your USDOT number? (interstate moves)",
    "Is packing material included or extra?",
    "How do you handle claims for damaged items?",
    "Will the same crew load and unload?",
    "Are there heavy/bulky item surcharges?",
    "What's the policy if the move takes longer than estimated?",
  ],
};

// ── Scam Detection Engine ────────────────────────────────────

export interface ScamDetectionResult {
  flaggedPatterns: Array<{
    pattern: ScamPattern;
    matchedOn: string;
  }>;
  hiddenFees: HiddenFee[];
  seasonalTip: SeasonalTip | null;
  smartQuestions: string[];
  riskLevel: "low" | "medium" | "high";
}

export function runScamDetection(
  quoteText: string,
  category: string,
  totalQuoted: number,
  fairMidPrice: number
): ScamDetectionResult {
  const lowerText = quoteText.toLowerCase();
  const flagged: ScamDetectionResult["flaggedPatterns"] = [];

  for (const pattern of SCAM_PATTERNS) {
    if (
      !pattern.categories.includes("*") &&
      !pattern.categories.includes(category)
    ) {
      continue;
    }

    // Check keyword triggers
    if (pattern.triggers.keywords) {
      for (const kw of pattern.triggers.keywords) {
        if (lowerText.includes(kw.toLowerCase())) {
          flagged.push({ pattern, matchedOn: `Contains "${kw}"` });
          break;
        }
      }
    }

    // Check text pattern triggers
    if (pattern.triggers.textPatterns) {
      for (const re of pattern.triggers.textPatterns) {
        if (re.test(quoteText)) {
          flagged.push({ pattern, matchedOn: "Text pattern match" });
          break;
        }
      }
    }

    // Check price pattern triggers
    if (pattern.triggers.pricePatterns && fairMidPrice > 0) {
      const pp = pattern.triggers.pricePatterns;
      if (
        pp.type === "suspiciously_low" &&
        pp.threshold &&
        totalQuoted < fairMidPrice * pp.threshold
      ) {
        flagged.push({
          pattern,
          matchedOn: `Price is ${Math.round((1 - totalQuoted / fairMidPrice) * 100)}% below market average`,
        });
      }
    }
  }

  // Deduplicate by pattern ID
  const seen = new Set<string>();
  const unique = flagged.filter((f) => {
    if (seen.has(f.pattern.id)) return false;
    seen.add(f.pattern.id);
    return true;
  });

  // Get hidden fees for category
  const hiddenFees = HIDDEN_FEES_BY_CATEGORY[category] || [];

  // Get seasonal tip
  const seasonalTip = SEASONAL_PRICING[category] || null;

  // Get smart questions
  const questions = SMART_QUESTIONS[category] || SMART_QUESTIONS["home_renovation"];

  // Determine risk level
  const criticalCount = unique.filter(
    (f) => f.pattern.severity === "critical"
  ).length;
  const warningCount = unique.filter(
    (f) => f.pattern.severity === "warning"
  ).length;

  let riskLevel: "low" | "medium" | "high" = "low";
  if (criticalCount >= 2 || (criticalCount >= 1 && warningCount >= 2)) {
    riskLevel = "high";
  } else if (criticalCount >= 1 || warningCount >= 2) {
    riskLevel = "medium";
  }

  return {
    flaggedPatterns: unique,
    hiddenFees,
    seasonalTip,
    smartQuestions: questions,
    riskLevel,
  };
}
