import { z } from "zod";
import { partnerAdmin } from "./partner-platform";

export const IndustryContentItemSchema=z.object({
  id:z.string(),title:z.string().min(8).max(220),summary:z.string().min(30).max(900),publishedDate:z.string().date(),
  category:z.enum(["Legislation","Brand news","New release","People & craft","Auction market","Retail","Growing region","Education"]),
  sourceType:z.enum(["Government","Official organization","Independent reporting","Advocacy","Retailer"]),
  sourceName:z.string().min(2).max(160),sourceUrl:z.string().url(),jurisdiction:z.string().max(120),
  stance:z.enum(["Neutral reporting","Supports proposal","Opposes proposal","Not applicable"]),status:z.literal("published"),
});
export type IndustryContentItem=z.infer<typeof IndustryContentItemSchema>;

export const ukPlainPackagingBrief:IndustryContentItem=IndustryContentItemSchema.parse({id:"brief-uk-plain-packaging-2026",title:"UK consults on plain packaging for premium cigars",summary:"The UK government is consulting on extending standardized packaging, picture warnings, and pack inserts to cigars and other tobacco products. The consultation closes October 2, 2026; this is a proposal, not an enacted packaging requirement.",publishedDate:"2026-09-07",category:"Legislation",sourceType:"Government",sourceName:"UK Department of Health and Social Care",sourceUrl:"https://www.gov.uk/government/consultations/tobacco-and-vapes-packaging-appearance-and-display/tobacco-and-vapes-packaging-appearance-and-display",jurisdiction:"United Kingdom",stance:"Neutral reporting",status:"published"});

export async function loadPublishedIndustryContent(limit=24){const admin=partnerAdmin();if(!admin)return[ukPlainPackagingBrief];const{data,error}=await admin.from("industry_content_items").select("payload").eq("status","published").order("published_at",{ascending:false}).limit(limit);if(error)return[ukPlainPackagingBrief];const values=(data||[]).flatMap(row=>{const parsed=IndustryContentItemSchema.safeParse(row.payload);return parsed.success?[parsed.data]:[]});return[ukPlainPackagingBrief,...values.filter(item=>item.id!==ukPlainPackagingBrief.id)].slice(0,limit)}

export function industryContentKey(value:Pick<IndustryContentItem,"sourceUrl">){return value.sourceUrl.trim().toLowerCase().replace(/[?#].*$/,"").replace(/\/$/,"")}
