export type AffiliateProgramResearchStatus =
  | "public-program-verified"
  | "program-not-publicly-verified"
  | "locked";

export type AffiliateProgramCandidate = {
  retailerName: string;
  status: AffiliateProgramResearchStatus;
  score: number | null;
  scoreLabel: string;
  collectorFit: number;
  credibility: number;
  transparency: number;
  technicalFit: number;
  complianceFit: number;
  programUrl: string | null;
  retailerUrl: string;
  network: string | null;
  commission: string;
  referralWindow: string;
  evidence: readonly string[];
  openQuestions: readonly string[];
  restriction: string | null;
};

export const affiliateShortlistVerifiedAt = "2026-07-29";

export const affiliateShortlistNotice = {
  applicationSubmitted: false,
  outreachSent: false,
  trackingConfigured: false,
  programActivated: false,
} as const;

export const affiliateScoreWeights = [
  ["Collector fit", 25],
  ["Credibility and retail maturity", 25],
  ["Public program transparency", 20],
  ["Technical and deep-link fit", 15],
  ["Adult-access and jurisdiction posture", 15],
] as const;

export const affiliateProgramShortlist: readonly AffiliateProgramCandidate[] = [
  {
    retailerName: "Famous Cigars",
    status: "public-program-verified",
    score: 92,
    scoreLabel: "Priority 1",
    collectorFit: 24,
    credibility: 24,
    transparency: 20,
    technicalFit: 14,
    complianceFit: 10,
    programUrl: "https://www.famous-smoke.com/affiliate-program",
    retailerUrl: "https://www.famous-smoke.com/",
    network: "CJ",
    commission: "Up to 15% (public claim; agreement controls)",
    referralWindow: "Up to 30 days (public claim; agreement controls)",
    evidence: [
      "Official retailer page confirms a CJ affiliate program.",
      "Official page identifies a product feed and affiliate tools.",
      "Official page publishes commission and referral-window ranges.",
    ],
    openQuestions: [
      "Exact accepted commission tier and qualifying-sale rules",
      "Deep-link, product-feed, returns, and attribution terms",
      "State targeting, age controls, and data-processing obligations",
    ],
    restriction: "Cigar Monster and Cigar Auctioneer sales are excluded; trademark bidding is restricted.",
  },
  {
    retailerName: "Cigars International",
    status: "public-program-verified",
    score: 87,
    scoreLabel: "Priority 2",
    collectorFit: 24,
    credibility: 23,
    transparency: 20,
    technicalFit: 12,
    complianceFit: 8,
    programUrl: "https://www.cigarsinternational.com/affiliate-program.html",
    retailerUrl: "https://www.cigarsinternational.com/",
    network: "CJ",
    commission: "5%–7% (public claim; agreement controls)",
    referralWindow: "30 days (public claim; agreement controls)",
    evidence: [
      "Official retailer page confirms a commission program and CJ signup path.",
      "Official page publishes commission tiers and cookie duration.",
      "Official page publishes approved and unapproved publisher/targeting states.",
    ],
    openQuestions: [
      "Product-feed and exact-product deep-link support",
      "Returns, cancellations, coupon attribution, and payment terms",
      "How current state restrictions must be enforced in Hojavía",
    ],
    restriction: "Publisher-location and consumer-targeting restrictions require legal and technical review.",
  },
  {
    retailerName: "JR Cigars",
    status: "public-program-verified",
    score: 80,
    scoreLabel: "Priority 3",
    collectorFit: 24,
    credibility: 23,
    transparency: 13,
    technicalFit: 12,
    complianceFit: 8,
    programUrl: "https://www.jrcigars.com/affiliate-program.html",
    retailerUrl: "https://www.jrcigars.com/",
    network: null,
    commission: "Not publicly stated",
    referralWindow: "Not publicly stated",
    evidence: [
      "Official retailer page confirms an affiliate program.",
      "Official page identifies product links, banners, and commissions on referred products.",
      "The public page states that acceptance follows an online application.",
    ],
    openQuestions: [
      "Affiliate network, commission schedule, and cookie duration",
      "Product-feed and exact-product deep-link support",
      "Geographic, tobacco-marketing, privacy, and reporting terms",
    ],
    restriction: "Material commercial terms are not public and require agreement review.",
  },
] as const;

export const affiliateResearchWatchlist: readonly AffiliateProgramCandidate[] = [
  {
    retailerName: "Fox Cigar",
    status: "locked",
    score: null,
    scoreLabel: "Founder lock",
    collectorFit: 25,
    credibility: 0,
    transparency: 0,
    technicalFit: 0,
    complianceFit: 0,
    programUrl: null,
    retailerUrl: "https://foxcigar.com/",
    network: null,
    commission: "Not publicly verified",
    referralWindow: "Not publicly verified",
    evidence: [
      "Public retailer and product pages were reviewed.",
      "No official public affiliate-program page was verified in the July 29 search.",
    ],
    openQuestions: [
      "Whether any publisher or referral program exists",
      "Commercial, technical, legal, age, jurisdiction, privacy, and disclosure terms",
    ],
    restriction: "No outreach, application, tracking link, test, configuration, or campaign without Brian’s separate explicit approval.",
  },
  {
    retailerName: "Holt’s Cigar Company",
    status: "program-not-publicly-verified",
    score: null,
    scoreLabel: "Research hold",
    collectorFit: 24,
    credibility: 24,
    transparency: 0,
    technicalFit: 0,
    complianceFit: 0,
    programUrl: null,
    retailerUrl: "https://www.holts.com/",
    network: null,
    commission: "Not publicly verified",
    referralWindow: "Not publicly verified",
    evidence: ["Retailer fit and public catalog were verified; no official public affiliate-program page was verified."],
    openQuestions: ["Whether a publisher program exists", "All commercial, technical, privacy, and compliance terms"],
    restriction: "Do not contact or apply without a separate founder decision.",
  },
  {
    retailerName: "Cigar Page",
    status: "program-not-publicly-verified",
    score: null,
    scoreLabel: "Research hold",
    collectorFit: 23,
    credibility: 0,
    transparency: 0,
    technicalFit: 0,
    complianceFit: 0,
    programUrl: null,
    retailerUrl: "https://www.cigarpage.com/",
    network: null,
    commission: "Not publicly verified",
    referralWindow: "Not publicly verified",
    evidence: ["Retailer catalog is relevant; no official public affiliate-program page was verified."],
    openQuestions: ["Whether a publisher program exists", "All commercial, technical, privacy, and compliance terms"],
    restriction: "Do not contact or apply without a separate founder decision.",
  },
  {
    retailerName: "Neptune Cigar",
    status: "program-not-publicly-verified",
    score: null,
    scoreLabel: "Research hold",
    collectorFit: 22,
    credibility: 0,
    transparency: 0,
    technicalFit: 0,
    complianceFit: 0,
    programUrl: null,
    retailerUrl: "https://www.neptunecigar.com/",
    network: null,
    commission: "Not publicly verified",
    referralWindow: "Not publicly verified",
    evidence: ["Retailer catalog is relevant; similarly named casino-affiliate pages are unrelated and excluded."],
    openQuestions: ["Whether a cigar-retail publisher program exists", "All commercial, technical, privacy, and compliance terms"],
    restriction: "Do not contact or apply without a separate founder decision.",
  },
] as const;

export function shortlistResearchAudit() {
  return {
    verifiedAt: affiliateShortlistVerifiedAt,
    verifiedPrograms: affiliateProgramShortlist.length,
    applicationsSubmitted: affiliateShortlistNotice.applicationSubmitted,
    outreachSent: affiliateShortlistNotice.outreachSent,
    trackingConfigured: affiliateShortlistNotice.trackingConfigured,
    programActivated: affiliateShortlistNotice.programActivated,
    foxLocked: affiliateResearchWatchlist.some(
      candidate => candidate.retailerName === "Fox Cigar" && candidate.status === "locked",
    ),
  };
}
