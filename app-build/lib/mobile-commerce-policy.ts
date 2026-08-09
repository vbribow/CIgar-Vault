import type { AvailabilityListing } from "./types";

export const mobileCommercePolicy = {
  mode: "research-only" as const,
  permitsRetailerPurchaseLinks: false,
  permitsAffiliateTracking: false,
  publicWebPath: "/retailers",
  notice: "Retailer observations are research evidence only. The mobile app does not open tobacco purchase pages or use affiliate tracking.",
};

export function removeCommercialNavigation(listings: AvailabilityListing[]) {
  return listings.map(({ outboundUrl: _outboundUrl, commercialRelationship: _relationship, commercialDisclosure: _disclosure, ...listing }) => listing);
}
