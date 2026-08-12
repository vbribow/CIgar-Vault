import { z } from "zod";
import type { InventoryItem, SmokingLog } from "./types";
import { responseOutputText } from "./cigar-vision";
import { loadKnowledge, relevantKnowledge } from "./sommelier-knowledge";
import type { CigarSommCollectorContext } from "./cigar-somm-context";

export const CigarSommQuestionSchema=z.object({submissionId:z.string().uuid().optional().default(()=>crypto.randomUUID()),question:z.string().trim().min(3).max(1000),inventoryId:z.string().trim().max(100).optional(),cigarName:z.string().trim().min(3).max(300).optional(),pairingDirection:z.enum(["cigar-to-beverage","occasion-to-cigar"]).default("cigar-to-beverage"),pairingContext:z.string().trim().max(500).optional(),occasion:z.string().trim().max(120).optional(),includeAlcohol:z.boolean().default(true),collectionChoiceConfirmed:z.boolean().default(false)}).strict().refine(value=>value.pairingDirection==="occasion-to-cigar"?Boolean(value.pairingContext&&value.pairingContext.length>=3):Boolean(value.inventoryId||value.cigarName),{message:"Choose a cigar, or describe the drink, meal, time, or occasion you want to pair"});
const Pairing=z.object({name:z.string(),style:z.string(),why:z.string(),service:z.string()});
const SpiritPairing=Pairing.extend({producer:z.string().trim().min(2),label:z.string().trim().min(2),verificationUrl:z.string().url()});
const ResearchSource=z.object({title:z.string(),url:z.string().url(),publisher:z.string(),supports:z.string()});
const TastingProfile=z.object({body:z.string(),strength:z.string(),coreNotes:z.array(z.string()).min(1).max(10),development:z.array(z.string()).min(1).max(5),evidence:z.string()});
const Personalization=z.object({used:z.boolean(),signals:z.array(z.string()).max(5),explanation:z.string()});
const CigarRecommendation=z.object({inventoryId:z.string(),cigarName:z.string(),why:z.string(),serviceMoment:z.string()});
export const CigarSommAnswerSchema=z.object({answer:z.string().max(600),cigarContext:z.string(),cigarRecommendations:z.array(CigarRecommendation).max(5),confidence:z.enum(["High","Medium","Developing"]),personalization:Personalization,tastingProfile:TastingProfile,basis:z.array(z.string()).max(6),coffee:z.array(Pairing).max(3),spirits:z.array(SpiritPairing).max(3),cocktails:z.array(Pairing).max(3),nonAlcoholic:z.array(Pairing).max(3),sources:z.array(ResearchSource).max(8),cautions:z.array(z.string()).max(4)});
export type CigarSommAnswer=z.infer<typeof CigarSommAnswerSchema>;
const pairingJson=(required:boolean)=>({type:"array",...(required?{minItems:1}:{}),maxItems:3,items:{type:"object",additionalProperties:false,properties:{name:{type:"string"},style:{type:"string"},why:{type:"string"},service:{type:"string"}},required:["name","style","why","service"]}} as const);
const spiritPairingJson=(required:boolean)=>({type:"array",...(required?{minItems:1}:{}),maxItems:3,items:{type:"object",additionalProperties:false,properties:{name:{type:"string"},producer:{type:"string"},label:{type:"string"},verificationUrl:{type:"string"},style:{type:"string"},why:{type:"string"},service:{type:"string"}},required:["name","producer","label","verificationUrl","style","why","service"]}} as const);
export const cigarSommJsonSchemaFor=(includeAlcohol:boolean)=>({type:"object",additionalProperties:false,properties:{answer:{type:"string",maxLength:600},cigarContext:{type:"string"},cigarRecommendations:{type:"array",maxItems:5,items:{type:"object",additionalProperties:false,properties:{inventoryId:{type:"string"},cigarName:{type:"string"},why:{type:"string"},serviceMoment:{type:"string"}},required:["inventoryId","cigarName","why","serviceMoment"]}},confidence:{type:"string",enum:["High","Medium","Developing"]},personalization:{type:"object",additionalProperties:false,properties:{used:{type:"boolean"},signals:{type:"array",maxItems:5,items:{type:"string"}},explanation:{type:"string"}},required:["used","signals","explanation"]},tastingProfile:{type:"object",additionalProperties:false,properties:{body:{type:"string"},strength:{type:"string"},coreNotes:{type:"array",minItems:1,maxItems:10,items:{type:"string"}},development:{type:"array",minItems:1,maxItems:5,items:{type:"string"}},evidence:{type:"string"}},required:["body","strength","coreNotes","development","evidence"]},basis:{type:"array",maxItems:6,items:{type:"string"}},coffee:pairingJson(true),spirits:spiritPairingJson(includeAlcohol),cocktails:pairingJson(includeAlcohol),nonAlcoholic:pairingJson(true),sources:{type:"array",maxItems:8,items:{type:"object",additionalProperties:false,properties:{title:{type:"string"},url:{type:"string"},publisher:{type:"string"},supports:{type:"string"}},required:["title","url","publisher","supports"]}},cautions:{type:"array",maxItems:4,items:{type:"string"}}},required:["answer","cigarContext","cigarRecommendations","confidence","personalization","tastingProfile","basis","coffee","spirits","cocktails","nonAlcoholic","sources","cautions"]} as const);
export function requireCompletePairings(answer:CigarSommAnswer,includeAlcohol:boolean){
 const missing=[!answer.coffee.length&&"coffee",!answer.nonAlcoholic.length&&"nonalcoholic",includeAlcohol&&!answer.spirits.length&&"spirits",includeAlcohol&&!answer.cocktails.length&&"cocktails"].filter(Boolean);
 if(missing.length)throw new Error(`Cigar Somm returned an incomplete pairing profile (${missing.join(", ")}). Please analyze again.`);
 if(includeAlcohol&&answer.spirits.some(spirit=>!spirit.producer||!spirit.label||!spirit.verificationUrl))throw new Error("Cigar Somm could not verify a specific spirit label. Please analyze again.");
 return answer;
}

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

export async function askCigarSomm(input:z.infer<typeof CigarSommQuestionSchema>,inventory:InventoryItem[],smokes:SmokingLog[],collectorContext?:CigarSommCollectorContext){const apiKey=process.env.OPENAI_API_KEY?.trim();if(!apiKey)throw new Error("Cigar Somm is not configured");const reverse=input.pairingDirection==="occasion-to-cigar";const item=input.inventoryId?inventory.find(value=>value.inventoryId===input.inventoryId):undefined;if(input.inventoryId&&!item)throw new Error("The selected inventory cigar was not found");const collectionSiblings=item?.collectionId?inventory.filter(value=>value.collectionId===item.collectionId&&value.inventoryId!==item.inventoryId):[];if(collectionSiblings.length&&!input.collectionChoiceConfirmed)throw new Error("This collection contains multiple cigars. Confirm the exact cigar before Cigar Somm can continue.");const tastings=item?smokes.filter(value=>value.inventoryId===item.inventoryId).slice(-5):[];const collectionCompanions=collectionSiblings.map(value=>({brand:value.brand,line:value.line,vitola:value.vitola}));const ownedCandidates=reverse?inventory.filter(value=>(value.currentQty??0)>0).slice(0,150).map(value=>({inventoryId:value.inventoryId,brand:value.brand,line:value.line,vitola:value.vitola,vintage:value.vintage,quantity:value.currentQty,score:value.score,notes:value.notes})):[];const context=reverse?{source:"reverse pairing",pairingContext:input.pairingContext,ownedCandidates}:item?{source:"owned inventory",inventoryId:item.inventoryId,exactIdentity:{makerOrBrand:item.brand,line:item.line,physicalVitola:item.vitola,vintage:item.vintage},collectionCompanions,quantity:item.currentQty,status:item.status,personalScore:item.score,notes:item.notes,tastings:tastings.map(value=>({overall:value.overall,strength:value.strength,sweetness:value.sweetness,flavor:value.flavor,constructionQuality:value.construction,burn:value.burn,notes:value.tastingNotes,buyAgain:value.buyAgain}))}:{source:"manual entry",cigarName:input.cigarName};const cigarIdentity=item?`${item.brand} ${item.line} ${item.vitola}`:input.cigarName||input.pairingContext||"";const library=relevantKnowledge(`${input.question} ${cigarIdentity}`,await loadKnowledge("approved"));const prompt=`You are Cigar Somm, a premium cigar advisor. Answer the collector's question using their supplied inventory, tasting context, and founder-approved Master Somm Library when available. Be refined, concise, useful, and candid about uncertainty.

PERSONALIZATION AND PRIVACY:
- The collector profile below is a private, account-scoped summary. Use it only to improve this collector's answer. Never expose internal IDs, imply it is public, or treat it as an external research source.
- Personalize only from signals actually present. Prefer established taste history over weak patterns. Do not infer health, wealth, identity, or other sensitive traits.
- Set personalization.used true only when at least one supplied collector signal materially changes the answer. Name those signals plainly and explain their influence without overstating certainty.
- Exact cigar facts and reliable sources take precedence over personal preference. Valuation and climate data are context, not proof of flavor or authenticity.

PAIRING KNOWLEDGE STANDARD:
- The requested direction is ${input.pairingDirection}. For occasion-to-cigar, begin with the supplied drink, meal, time of day, mood, or occasion and recommend up to three exact owned cigars from ownedCandidates. Never invent ownership. Put those choices in cigarRecommendations with their real inventoryId, identify a best first choice in cigarContext, and explain why each fits now. For cigar-to-beverage, cigarRecommendations must be an empty array.
- Reverse pairing must work in every direction: beverage to cigar, meal to cigar, time of day to cigar, and occasion to cigar. Respect the collector's stated context rather than forcing a generic after-dinner answer.
- For reverse pairing, tastingProfile describes the first recommended cigar and must clearly label conservative inference when exact evidence is limited.
- IDENTITY LOCK: Analyze only exactIdentity. Repeat its maker or brand, line, and physical vitola in cigarContext. collectionCompanions are shown only to prevent confusion; never merge their maker, construction, blend, review evidence, or tasting notes into the selected cigar.
- A collaboration or presentation set may contain distinct cigars made by different companies. Match every tasting source to the selected maker, named cigar, and physical shape. If only collection-level evidence exists, say exact tasting evidence is unavailable and give conservative guidance rather than borrowing notes from a companion cigar.
- The answer field is only a polished two-sentence executive recommendation. Use plain text, no headings, bullets, Markdown, URLs, citations, or repeated tasting/pairing details; those belong exclusively in the structured fields below.
- Never repeat cigarContext as a basis item. Every basis item must name a distinct reason the recommendation fits, such as intensity, flavor bridge, contrast, occasion, or a recorded collector preference.
- For a selected cigar, provide a dedicated tastingProfile: body, nicotine strength, concise core notes, and likely beginning/middle/final-third development. Ground it in exact-product sources or the collector's tasting history; otherwise label it as a conservative expectation rather than a fact.
- Do not confuse body with nicotine strength. Do not copy one reviewer's subjective notes as universal experience.
- Treat constructionQuality and burn as separate physical performance observations. They may qualify confidence in a past tasting, but they are never flavor or nicotine-strength evidence and missing values must remain unknown.
- Use web research for the exact cigar, brand, blend, vitola, beverage category, spirit style, or cocktail when it would materially improve the answer. Do not present model memory as researched fact.
- Source priority for cigars: official manufacturer and importer pages; then established cigar-industry publications and documented professional reviews. Source priority for beverages: official producer and appellation or regulatory references; then recognized beverage education, distilling, coffee, tea, and cocktail references.
- Separate product facts from pairing judgment. Never copy marketing language as objective tasting fact.
- Cite only direct pages actually used and state what each supports. If reliable exact-product evidence is unavailable, lower confidence and say so.
- Match beverage intensity to cigar body first; then use flavor bridges or deliberate contrast.
- Coffee: consider roast level, origin/process, acidity, milk, extraction, temperature, and sweetness. Avoid claiming one origin is universally correct.
- Spirits: consider proof, oak, sweetness, smoke, fruit, oxidation, and serving dilution. Bourbon/rye, aged rum, Scotch, Irish whiskey, Cognac/Armagnac, brandy, tequila/mezcal, and fortified-wine styles may fit, but recommend only what serves the cigar.
- When includeAlcohol is true, turn the spirit style into one to three real, currently documented bottlings from named producers. Every spirit object must contain the producer, exact label, and direct verificationUrl. Put the full producer plus label in name (for example, "Appleton Estate 12 Year Rare Casks," never merely "aged rum"). Prefer an official producer or importer product page; use a reliable specialist page only when an official product page is unavailable.
- Do not invent a label, age statement, proof, tasting note, or availability claim. A generic spirit style is not a completed spirit recommendation. If no specific label can be verified, return no alcoholic pairing rather than disguising a category as a bottle; the application will transparently ask the collector to retry.
- Specific bottles are independent editorial pairing suggestions, never paid placement or an implication that the producer endorses the platform.
- Cocktails are separate from neat spirits. Consider base spirit, modifiers, sugar, bitterness, acidity, dilution, ice, garnish, and aromatic intensity. Prefer established cocktail styles and prevent an overly sweet, sour, smoky, or high-proof drink from overwhelming the cigar.
- Nonalcoholic: treat this as a first-class category. Consider espresso or decaf, tea, cacao, sparkling mineral water, tonic, ginger, verjus, shrubs, and zero-proof drinks. Protect the palate from excessive sugar or acidity.
- Give specific styles, not invented product endorsements. Explain temperature, dilution, glassware, or sweetness when useful.
- Never make health claims. Alcohol is only for adults of legal drinking age; recommend moderation and omit both spirits and cocktails entirely when includeAlcohol is false.
- Cigar age and readiness claims must be conservative. Ownership alone does not prove flavor. Distinguish known tasting evidence from general pairing principles.
- Always return at least one coffee and one nonalcoholic pairing, even when the collector asks primarily about aging or readiness. When includeAlcohol is true, also return at least one named spirit or verified spirit style and at least one cocktail. Never leave a requested pairing category blank.

Collector question: ${JSON.stringify(input.question)}
Pairing direction: ${input.pairingDirection}
Drink, meal, time, or occasion context: ${JSON.stringify(input.pairingContext||"not specified")}
Occasion: ${JSON.stringify(input.occasion||"not specified")}
Include alcoholic pairings: ${input.includeAlcohol}
Selected cigar context: ${JSON.stringify(context)}
Private collector summary: ${JSON.stringify(collectorContext||null)}
Founder-approved Master Somm Library: ${JSON.stringify(library.map(record=>({subject:record.subject,factType:record.factType,statement:record.statement,pairingImplications:record.pairingImplications,sourceTitle:record.sourceTitle,sourceUrl:record.sourceUrl,evidenceDate:record.evidenceDate,confidence:record.confidence})))}`;
const model=process.env.OPENAI_SOMM_MODEL?.trim()||"gpt-5.6-luna";
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
  text:{format:{type:"json_schema",name:"cigar_somm_answer",strict:true,schema:cigarSommJsonSchemaFor(input.includeAlcohol)}},
 }),
 signal:AbortSignal.timeout(60_000),
});
const payload=await response.json();
if(!response.ok)throw new Error((payload as{error?:{message?:string}}).error?.message||`OpenAI request failed (${response.status})`);
const text=responseOutputText(payload);
if(!text)throw new Error("Cigar Somm returned no answer");
const parsed=JSON.parse(text) as Record<string,unknown>;
if(typeof parsed.answer==="string"&&parsed.answer.length>600) parsed.answer=parsed.answer.slice(0,597).trimEnd()+"…";
return requireCompletePairings(CigarSommAnswerSchema.parse(parsed),input.includeAlcohol)}
