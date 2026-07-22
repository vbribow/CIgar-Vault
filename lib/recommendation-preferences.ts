import{z}from"zod";
export const RecommendationPreferenceInput=z.object({upgradeRecommendations:z.boolean().default(true),upgradeSnoozedUntil:z.string().datetime().nullable().optional()});
export function recommendationAllowed(preference:{upgradeRecommendations?:boolean;upgradeSnoozedUntil?:string|null},now=new Date()){if(preference.upgradeRecommendations===false)return false;if(!preference.upgradeSnoozedUntil)return true;return new Date(preference.upgradeSnoozedUntil).getTime()<=now.getTime()}
export function snoozeUntil(now=new Date(),days=30){const result=new Date(now);result.setUTCDate(result.getUTCDate()+days);return result.toISOString()}
