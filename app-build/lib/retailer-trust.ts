import { createHmac } from "node:crypto";
import { z } from "zod";

export const RetailerListingSchema = z.object({
  seller: z.string().trim().min(2).max(120),
  sellerType: z.enum(["Authorized retailer", "Specialty dealer", "Auction", "Manufacturer", "Other"]),
  title: z.string().trim().min(2).max(240),
  url: z.string().url().refine(value => /^https?:\/\//i.test(value), "A secure web listing is required"),
  availability: z.enum(["In stock", "Auction open", "Waitlist", "Unknown"]),
  askingPrice: z.number().nonnegative().optional(),
  quantity: z.number().int().positive().optional(),
  unitPrice: z.number().nonnegative().optional(),
  listingDate: z.string().optional(),
  condition: z.string().optional(),
  notes: z.string().max(500),
});

export const PurchaseEvidenceSchema = z.object({
  purchaseSessionId: z.string().uuid(),
  orderReference: z.string().trim().min(4).max(120),
  receiptUrl: z.string().url().refine(value => /^https:\/\//i.test(value), "Receipt evidence must use HTTPS"),
  purchaseDate: z.string().date(),
});

export const RetailerReviewSchema = z.object({
  purchaseSessionId: z.string().uuid(),
  overall: z.number().int().min(1).max(5),
  fulfillment: z.number().int().min(1).max(5),
  packaging: z.number().int().min(1).max(5),
  authenticityConfidence: z.enum(["High", "Medium", "Concern"]),
  review: z.string().trim().max(1000).optional(),
});

export type RetailerReviewEvidence = z.infer<typeof RetailerReviewSchema> & {
  status: "verified";
  userId: string;
  retailerKey: string;
  verifiedAt: string;
};
export type RetailerRatingSummary = ReturnType<typeof trustedRetailerScore>;

export function retailerKey(seller: string) {
  return seller.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
}

export function privateOrderReference(reference: string, secret: string, ownerScope: string) {
  return createHmac("sha256", secret).update(`${ownerScope}|${reference.trim().toLowerCase()}`).digest("hex");
}

export function trustedRetailerScore(reviews: RetailerReviewEvidence[]) {
  const verified = reviews.filter(review => review.status === "verified");
  if (!verified.length) return { score: undefined, count: 0, confidence: "Not yet rated" as const };
  const reviewers = new Set(verified.map(review => review.userId)).size;
  const raw = verified.reduce((sum, review) => sum + review.overall, 0);
  const priorScore = 4;
  const priorWeight = 8;
  const score = (priorScore * priorWeight + raw) / (priorWeight + verified.length);
  return {
    score: Number(score.toFixed(1)),
    count: verified.length,
    confidence: reviewers >= 25 ? "Established" as const : reviewers >= 8 ? "Developing" as const : "Early evidence" as const,
  };
}

export function ratingCanAffectPublicScore(input: {
  transactionStatus?: string;
  transactionUserId?: string;
  reviewerUserId?: string;
  receiptVerifiedAt?: string;
  existingReview?: boolean;
}) {
  return input.transactionStatus === "verified"
    && Boolean(input.receiptVerifiedAt)
    && input.transactionUserId === input.reviewerUserId
    && !input.existingReview;
}

const availabilityRank:Record<string,number>={"In stock":3,"Auction open":2,"Waitlist":1,"Unknown":0};
export function foxLaunchPlacementWeight(verifiedReviewCount:number){
  return Math.max(0,30*(1-Math.min(verifiedReviewCount,12)/12));
}
export function rankRetailerListings<T extends {seller:string;availability:string;unitPrice?:number}>(
  listings:T[],
  ratings:Record<string,RetailerRatingSummary>,
){
  return [...listings].sort((left,right)=>{
    const availability=(availabilityRank[right.availability]??0)-(availabilityRank[left.availability]??0);
    if(availability)return availability;
    const score=(listing:T)=>{
      const summary=ratings[retailerKey(listing.seller)];
      const performance=(summary?.score??4)*20+Math.min(summary?.count??0,30)*.35;
      const disclosedLaunchPrior=retailerKey(listing.seller)==="fox-cigar"?foxLaunchPlacementWeight(summary?.count??0):0;
      return performance+disclosedLaunchPrior;
    };
    const trust=score(right)-score(left);
    if(trust)return trust;
    const leftPrice=left.unitPrice??Number.POSITIVE_INFINITY,rightPrice=right.unitPrice??Number.POSITIVE_INFINITY;
    return leftPrice-rightPrice||left.seller.localeCompare(right.seller);
  });
}
