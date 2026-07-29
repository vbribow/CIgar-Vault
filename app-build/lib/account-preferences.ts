import { z } from "zod";

export const AccountPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  wishlistAlerts: z.boolean().default(true),
  valuationResearch: z.boolean().default(true),
  ratingResearch: z.boolean().default(true),
  productAnalytics: z.boolean().default(true),
  upgradeRecommendations: z.boolean().default(true),
});
export type AccountPreferences = z.infer<typeof AccountPreferencesSchema>;
export const defaultAccountPreferences: AccountPreferences = AccountPreferencesSchema.parse({});
export function accountPreferencesFromRow(row?:Record<string,unknown>|null):AccountPreferences{return AccountPreferencesSchema.parse({emailNotifications:row?.email_notifications,wishlistAlerts:row?.wishlist_alerts,valuationResearch:row?.valuation_research,ratingResearch:row?.rating_research,productAnalytics:row?.product_analytics,upgradeRecommendations:row?.upgrade_recommendations})}
