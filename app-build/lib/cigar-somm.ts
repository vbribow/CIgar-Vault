import { z } from "zod";
import type { InventoryItem, SmokingLog } from "./types";
import { responseOutputText } from "./cigar-vision";
import { loadKnowledge, relevantKnowledge } from "./sommelier-knowledge";
import type { CigarSommCollectorContext } from "./cigar-somm-context";

export const CigarSommQuestionSchema=z.object({question:z.string().trim().min(3).max(1000),inventoryId:z.string().trim().max(100).optional(),cigarName:z.string().trim().min(3).max(300).optional(),occasion:z.string().trim().max(120).optional(),includeAlcohol:z.boolean().default(true)}).strict().refine(value=>Boolean(value.inventoryId||value.cigarName),{message:"Choose an inventory cigar or enter a cigar name"});
const Pairing=z.object({name:z.string(),style:z.string(),why:z.string(),service:z.string()});
const ResearchSource=z.object({title:z.string(),url:z.string().url(),publisher:z.string(),supports:z.string()});
const TastingProfile=z.object({body:z.string(),strength:z.string(),coreNotes:z.array(z.string()).min(1).max(10),development:z.array(z.string()).min(1).max(5),evidence:z.string()});
const Personalization=z.object({used:z.boolean(),signals:z.array(z.string()).max(5),explanation:z.string()});
export const CigarSommAnswerSchema=z.object({answer:z.string().max(600),cigarContext:z.string(),confidence:z.enum(["High","Medium","Developing"]),personalization:Personalization,tastingProfile:TastingProfile,basis:z.array(z.string()).max(6),coffee:z.array(Pairing).max(3),spirits:z.array(Pairing).max(3),cocktails:z.array(Pairing).max(3),nonAlcoholic:z.array(Pairing).max(3),sources:z.array(ResearchSource).max(8),cautions:z.array(z.string()).max(4)});
export type CigarSommAnswer=z.infer<typeof CigarSommAnswerSchema>;
const pairingJson={type:"array",maxItems:3,items:{type:"object",additionalProperties:false,properties:{name:{type:"string"},style:{type:"string"},why:{type:"string"},service:{type:"string"}},required:["name","style","why","service"]}} as const;
export const cigarSommJsonSchema={type:"object",additionalProperties:false,properties:{answer:{type:"string",maxLength:600},cigarContext:{type:"string"},confidence:{type:"string",enum:["High","Medium","Developing"]},personalization:{type:"object",additionalProperties:false,properties:{used:{type:"boolean"},signals:{type:"array",maxItems:5,items:{type:"string"}},explanation:{type:"string"}},required:["used","signals","explanation"]},tastingProfile:{type:"object",additionalProperties:false,properties:{body:{type:"string"},strength:{type:"string"},coreNotes:{type:"array",minItems:1,maxItems:10,items:{type:"string"}},development:{type:"array",minItems:1,maxItems:5,items:{type:"string"}},evidence:{type:"string"}},required:["body","strength","coreNotes","development","evidence"]},basis:{type:"array",maxItems:6,items:{type:"string"}},coffee:pairingJson,spirits:pairingJson,cocktails:pairingJson,nonAlcoholic:pairingJson,sources:{type:"array",maxItems:8,items:{type:"object",additionalProperties:false,properties:{title:{type:"string"},url:{type:"string"},publisher:{type:"string"},supports:{type:"string"}},required:["title","url","publisher","supports"]}},cautions:{type:"array",maxItems:4,items:{type:"string"}}},required:["answer","cigarContext","confidence","personalization","tastingProfile","basis","coffee","spirits","cocktails","nonAlcoholic","sources","cautions"]} as const;

export function cleanSommText(value:string){
 return value.replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g,"$1").replace(/https?:\/\/\S+/g,"").replace(/[*_#`]+/g,"").replace(/\s+-\s+/g," ").replace(/\s+/g," ").trim();
}
export function sommLeadSummary(value:string){
 const boundary=value.search(/\*{0,2}(?:Tasting Profile|Pairing Recommendations|Coffee Pairing|Spirit Pairing)\s*:?\*{0,2}/i);
 const cleaned=cleanSommText(boundary>0?value.slice(0,boundary):value);
 if(cleaned.length<=420)return cleaned;
 const shortened=cleaned.slice(0,420),sentence=shortened.lastIndexOf(".");
 return`${shortened.slice(0,sentence>180?sentence:417).trim()}${sentence>180?".":"…"}`;
}
export function uniqueSommItems(values:string[]){
 const seen=new Set<string>();
 return values.filter(value=>{const key=cleanSommText(value).toLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true});
}

export async function askCigarSomm(input:z.infer<typeof CigarSommQuestionSchema>,inventory:InventoryItem[],smokes:SmokingLog[],collectorContext?:CigarSommCollectorContext){const apiKey=process.env.OPENAI_API_KEY?.trim();if(!apiKey)throw new Error("Cigar Somm is not configured");const item=input.inventoryId?inventory.find(value=>value.inventoryId===input.inventoryId):undefined;if(input.inventoryId&&!item)throw new Error("The selected inventory cigar was not found");const tastings=item?smokes.filter(value=>value.inventoryId===item.inventoryId).slice(-5):[];const context=item?{source:"owned inventory",inventoryId:item.inventoryId,brand:item.brand,line:item.line,vitola:item.vitola,vintage:item.vintage,quantity:item.currentQty,status:item.status,personalScore:item.score,notes:item.notes,tastings:tastings.map(value=>({overall:value.overall,strength:value.strength,sweetness:value.sweetness,flavor:value.flavor,notes:value.tastingNotes,buyAgain:value.buyAgain}))}:{source:"manual entry",cigarName:input.cigarName};const cigarIdentity=item?`${item.brand} ${item.line} ${item.vitola}`:input.cigarName||"";const library=relevantKnowledge(`${input.question} ${cigarIdentity}`,await loadKnowledge("approved"));const prompt=`You are Cigar Somm, Cedriva's premium cigar advisor. Answer the collector's question using their supplied inventory, tasting context, and founder-approved Master Somm Library when available. Be refined, concise, useful, and candid about uncertainty.

PERSONALIZATION AND PRIVACY:
- The collector profile below is a private, account-scoped summary. Use it only to improve this collector's answer. Never expose internal IDs, imply it is public, or treat it as an external research source.
- Personalize only from signals actually present. Prefer established taste history over weak patterns. Do not infer health, wealth, identity, or other sensitive traits.
- Set personalization.used true only when at least one supplied collector signal materially changes the answer. Name those signals plainly and explain their influence without overstating certainty.
- Exact cigar facts and reliable sources take precedence over personal preference. Valuation and climate data are context, not proof of flavor or authenticity.

PAIRING KNOWLEDGE STANDARD:
- The answer field is only a polished two-sentence executive recommendation. Use plain text, no headings, bullets, Markdown, URLs, citations, or repeated tasting/pairing details; those belong exclusively in the structured fields below.
- Never repeat cigarContext as a basis item. Every basis item must name a distinct reason the recommendation fits, such as intensity, flavor bridge, contrast, occasion, or a recorded collector preference.
- For a selected cigar, provide a dedicated tastingProfile: body, nicotine strength, concise core notes, and likely beginning/middle/final-third development. Ground it in exact-product sources or the collector's tasting history; otherwise label it as a conservative expectation rather than a fact.
- Do not confuse body with nicotine strength. Do not copy one reviewer's subjective notes as universal experience.
- Use web research for the exact cigar, brand, blend, vitola, beverage category, spirit style, or cocktail when it would materially improve the answer. Do not present model memory as researched fact.
- Source priority for cigars: official manufacturer and importer pages; then established cigar-industry publications and documented professional reviews. Source priority for beverages: official producer and appellation or regulatory references; then recognized beverage education, distilling, coffee, tea, and cocktail references.
- Separate product facts from pairing judgment. Never copy marketing language as objective tasting fact.
- Cite only direct pages actually used and state what each supports. If reliable exact-product evidence is unavailable, lower confidence and say so.
- Match beverage intensity to cigar body first; then use flavor bridges or deliberate contrast.
- Coffee: consider roast level, origin/process, acidity, milk, extraction, temperature, and sweetness. Avoid claiming one origin is universally correct.
- Spirits: consider proof, oak, sweetness, smoke, fruit, oxidation, and serving dilution. Bourbon/rye, aged rum, Scotch, Irish whiskey, Cognac/Armagnac, brandy, tequila/mezcal, and fortified-wine styles may fit, but recommend only what serves the cigar.
- Cocktails are separate from neat spirits. Consider base spirit, modifiers, sugar, bitterness, acidity, dilution, ice, garnish, and aromatic intensity. Prefer established cocktail styles and prevent an overly sweet, sour, smoky, or high-proof drink from overwhelming the cigar.
- Nonalcoholic: treat this as a first-class category. Consider espresso or decaf, tea, cacao, sparkling mineral water, tonic, ginger, verjus, shrubs, and zero-proof drinks. Protect the palate from excessive sugar or acidity.
- Give specific styles, not invented product endorsements. Explain temperature, dilution, glassware, or sweetness when useful.
- Never make health claims. Alcohol is only for adults of legal drinking age; recommend moderation and omit both spirits and cocktails entirely when includeAlcohol is false.
- Cigar age and readiness claims must be conservative. Ownership alone does not prove flavor. Distinguish known tasting evidence from general pairing principles.

Collector question: ${JSON.stringify(input.question)}
Occasion: ${JSON.stringify(input.occasion||"not specified")}
Include alcoholic pairings: ${input.includeAlcohol}
Selected cigar context: ${JSON.stringify(context)}
Private collector summary: ${JSON.stringify(collectorContext||null)}
Founder-approved Master Somm Library: ${JSON.stringify(library.map(record=>({subject:record.subject,factType:record.factType,statement:record.statement,pairingImplications:record.pairingImplications,sourceTitle:record.sourceTitle,sourceUrl:record.sourceUrl,evidenceDate:record.evidenceDate,confidence:record.confidence})))}`;
const model=process.env.OPENAI_SOMM_MODEL?.trim()||"gpt-4.1-mini";
const response=await fetch("https://api.openai.com/v1/responses",{
 method:"POST",
 headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},
 body:JSON.stringify({
  model,
  store:false,
  max_output_tokens:2200,
  tools:[{type:"web_search",search_context_size:"low"}],
  tool_choice:"required",
  include:["web_search_call.action.sources"],
  input:prompt,
  text:{format:{type:"json_schema",name:"cigar_somm_answer",strict:true,schema:cigarSommJsonSchema}},
 }),
 signal:AbortSignal.timeout(60_000),
});
const payload=await response.json();
if(!response.ok)throw new Error((payload as{error?:{message?:string}}).error?.message||`OpenAI request failed (${response.status})`);
const text=responseOutputText(payload);
if(!text)throw new Error("Cigar Somm returned no answer");
return CigarSommAnswerSchema.parse(JSON.parse(text))}
