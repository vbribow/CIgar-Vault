import { z } from "zod";
import type { CatalogCigar, InventoryItem, SmokingLog } from "./types";
import { responseOutputText } from "./cigar-vision";
import { loadKnowledge, relevantKnowledge } from "./sommelier-knowledge";
import type { CigarSommCollectorContext } from "./cigar-somm-context";
import { exactCatalogMatch } from "./inventory-origin";

const SommInventorySnapshot=z.object({inventoryId:z.string(),brand:z.string(),line:z.string(),vitola:z.string(),vintage:z.union([z.string(),z.number()]).optional(),currentQty:z.number().optional(),collectionId:z.string().optional(),status:z.string().optional(),score:z.number().optional(),notes:z.string().optional(),catalogId:z.string().optional()}).strict();
const SommSmokingSnapshot=z.object({smokeId:z.string(),inventoryId:z.string(),dateSmoked:z.string(),overall:z.number().optional(),flavor:z.string().optional(),strength:z.string().optional(),sweetness:z.string().optional(),construction:z.string().optional(),burn:z.enum(["Even throughout","Minor touch-up","Multiple touch-ups","Relight required","Major burn issue"]).optional(),tastingNotes:z.string().optional(),buyAgain:z.boolean().optional()}).strict();
export const CigarSommQuestionSchema=z.object({question:z.string().trim().min(3).max(1000),inventoryId:z.string().trim().max(100).optional(),cigarName:z.string().trim().min(3).max(300).optional(),pairingDirection:z.enum(["cigar-to-beverage","occasion-to-cigar"]).default("cigar-to-beverage"),pairingContext:z.string().trim().max(500).optional(),occasion:z.string().trim().max(120).optional(),includeAlcohol:z.boolean().default(true),collectionChoiceConfirmed:z.boolean().default(false),inventorySnapshot:z.array(SommInventorySnapshot).max(200).optional(),smokingSnapshot:z.array(SommSmokingSnapshot).max(100).optional()}).strict().refine(value=>value.pairingDirection==="occasion-to-cigar"?Boolean(value.pairingContext&&value.pairingContext.length>=3):Boolean(value.inventoryId||value.cigarName),{message:"Choose a cigar, or describe the drink, meal, time, or occasion you want to pair"});
const Pairing=z.object({name:z.string(),style:z.string(),why:z.string(),service:z.string()});
const SpiritPairing=Pairing.extend({producer:z.string().trim().min(2),label:z.string().trim().min(2),verificationUrl:z.string().url().nullable()});
const ResearchSource=z.object({title:z.string(),url:z.string().url(),publisher:z.string(),supports:z.string()});
const TastingProfile=z.object({body:z.string(),strength:z.string(),coreNotes:z.array(z.string()).min(1).max(10),development:z.array(z.string()).min(1).max(5),evidence:z.string()});
const Personalization=z.object({used:z.boolean(),signals:z.array(z.string()).max(5),explanation:z.string()});
const CigarRecommendation=z.object({inventoryId:z.string(),cigarName:z.string(),why:z.string(),serviceMoment:z.string()});
export const CigarSommAnswerSchema=z.object({answer:z.string().max(600),cigarContext:z.string(),cigarRecommendations:z.array(CigarRecommendation).max(5),confidence:z.enum(["High","Medium","Developing"]),personalization:Personalization,tastingProfile:TastingProfile,basis:z.array(z.string()).max(6),coffee:z.array(Pairing).max(3),spirits:z.array(SpiritPairing).max(3),cocktails:z.array(Pairing).max(3),nonAlcoholic:z.array(Pairing).max(3),sources:z.array(ResearchSource).max(8),cautions:z.array(z.string()).max(4)});
export type CigarSommAnswer=z.infer<typeof CigarSommAnswerSchema>;
export type SommCandidateConstraints={country?:string;strength?:"Mild"|"Medium"|"Medium-full"|"Full"};
const countryTerms=[
 {country:"Nicaragua",pattern:/\b(?:nicaragua|nicaraguan)\b/i},
 {country:"Dominican Republic",pattern:/\b(?:dominican republic|dominican)\b/i},
 {country:"Honduras",pattern:/\b(?:honduras|honduran)\b/i},
 {country:"Cuba",pattern:/\b(?:cuba|cuban)\b/i},
 {country:"Mexico",pattern:/\b(?:mexico|mexican)\b/i},
 {country:"United States",pattern:/\b(?:united states|u\.s\.|american)\b/i},
 {country:"Costa Rica",pattern:/\b(?:costa rica|costa rican)\b/i},
 {country:"Brazil",pattern:/\b(?:brazil|brazilian)\b/i},
 {country:"Ecuador",pattern:/\b(?:ecuador|ecuadorian)\b/i},
 {country:"Panama",pattern:/\b(?:panama|panamanian)\b/i},
] as const;
function normalized(value:unknown){return String(value??"").trim().toLowerCase().replace(/[–—]/g,"-").replace(/\s+/g," ")}
export function parseSommCandidateConstraints(value:string):SommCandidateConstraints{
 const country=countryTerms.find(entry=>entry.pattern.test(value))?.country;
 const intensity=value.match(/\b(medium[ -]?full|full(?:[ -]?bodied)?|medium(?:[ -]?bodied)?|mild(?:[ -]?bodied)?)\b/i)?.[1];
 const key=normalized(intensity).replace(/[ -]bodied$/," ").trim();
 const strength=key==="medium full"||key==="medium-full"?"Medium-full":key==="full"?"Full":key==="medium"?"Medium":key==="mild"?"Mild":undefined;
 return{country,strength};
}
export function requiresSommCatalog(input:z.infer<typeof CigarSommQuestionSchema>){
 if(input.pairingDirection!=="occasion-to-cigar")return false;
 const constraints=parseSommCandidateConstraints(`${input.question} ${input.pairingContext||""} ${input.occasion||""}`);
 return Boolean(constraints.country||constraints.strength);
}
export function strictSommCandidates(inventory:InventoryItem[],catalog:CatalogCigar[],constraints:SommCandidateConstraints){
 const constrained=Boolean(constraints.country||constraints.strength);
 return inventory.filter(item=>{
  if((item.currentQty??0)<=0)return false;
  if(!constrained)return true;
  const evidence=exactCatalogMatch(item,catalog);
  if(!evidence)return false;
  if(constraints.country&&normalized(evidence.country)!==normalized(constraints.country))return false;
  if(constraints.strength&&normalized(evidence.strength)!==normalized(constraints.strength))return false;
  return true;
 });
}
export function enforceSommRecommendationPurity(answer:CigarSommAnswer,allowedInventoryIds:Set<string>,constraints:SommCandidateConstraints){
 if(!constraints.country&&!constraints.strength)return answer;
 if(!answer.cigarRecommendations.length)throw new Error("Cigar Somm could not produce a recommendation that satisfies every requested filter. Try again or broaden one filter.");
 if(answer.cigarRecommendations.some(item=>!allowedInventoryIds.has(item.inventoryId)))throw new Error("Cigar Somm withheld mixed results because one or more recommendations did not satisfy every requested filter. Please try again.");
 return answer;
}
const pairingJson=(required:boolean)=>({type:"array",...(required?{minItems:1}:{}),maxItems:3,items:{type:"object",additionalProperties:false,properties:{name:{type:"string"},style:{type:"string"},why:{type:"string"},service:{type:"string"}},required:["name","style","why","service"]}} as const);
const spiritPairingJson=(required:boolean)=>({type:"array",...(required?{minItems:1}:{}),maxItems:3,items:{type:"object",additionalProperties:false,properties:{name:{type:"string"},producer:{type:"string"},label:{type:"string"},verificationUrl:{type:["string","null"]},style:{type:"string"},why:{type:"string"},service:{type:"string"}},required:["name","producer","label","verificationUrl","style","why","service"]}} as const);
export const cigarSommJsonSchemaFor=(includeAlcohol:boolean)=>({type:"object",additionalProperties:false,properties:{answer:{type:"string",maxLength:600},cigarContext:{type:"string"},cigarRecommendations:{type:"array",maxItems:5,items:{type:"object",additionalProperties:false,properties:{inventoryId:{type:"string"},cigarName:{type:"string"},why:{type:"string"},serviceMoment:{type:"string"}},required:["inventoryId","cigarName","why","serviceMoment"]}},confidence:{type:"string",enum:["High","Medium","Developing"]},personalization:{type:"object",additionalProperties:false,properties:{used:{type:"boolean"},signals:{type:"array",maxItems:5,items:{type:"string"}},explanation:{type:"string"}},required:["used","signals","explanation"]},tastingProfile:{type:"object",additionalProperties:false,properties:{body:{type:"string"},strength:{type:"string"},coreNotes:{type:"array",minItems:1,maxItems:10,items:{type:"string"}},development:{type:"array",minItems:1,maxItems:5,items:{type:"string"}},evidence:{type:"string"}},required:["body","strength","coreNotes","development","evidence"]},basis:{type:"array",maxItems:6,items:{type:"string"}},coffee:pairingJson(true),spirits:spiritPairingJson(includeAlcohol),cocktails:pairingJson(includeAlcohol),nonAlcoholic:pairingJson(true),sources:{type:"array",maxItems:8,items:{type:"object",additionalProperties:false,properties:{title:{type:"string"},url:{type:"string"},publisher:{type:"string"},supports:{type:"string"}},required:["title","url","publisher","supports"]}},cautions:{type:"array",maxItems:4,items:{type:"string"}}},required:["answer","cigarContext","cigarRecommendations","confidence","personalization","tastingProfile","basis","coffee","spirits","cocktails","nonAlcoholic","sources","cautions"]} as const);
export function requireCompletePairings(answer:CigarSommAnswer,includeAlcohol:boolean){
 const missing=[!answer.coffee.length&&"coffee",!answer.nonAlcoholic.length&&"nonalcoholic",includeAlcohol&&!answer.spirits.length&&"spirits",includeAlcohol&&!answer.cocktails.length&&"cocktails"].filter(Boolean);
 if(missing.length)throw new Error(`Cigar Somm returned an incomplete pairing profile (${missing.join(", ")}). Please analyze again.`);
 if(includeAlcohol&&answer.spirits.some(spirit=>!spirit.producer||!spirit.label))throw new Error("Cigar Somm could not identify a useful spirit pairing. Please analyze again.");
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

function fallbackPairing(name:string,style:string,why:string,service:string){return{name,style,why,service}}
type BeverageProfile={name:string;style:string;why:string;service:string;signals:RegExp;body:"Mild"|"Medium"|"Full"|"Any"};
const spiritProfiles:BeverageProfile[]=[
 {name:"Cognac or mature Armagnac",style:"Fruit-led, oak-matured grape brandy",why:"Dried fruit, oak, and oxidative depth can bridge cedar, leather, nuts, and baking spice without adding cocktail sugar.",service:"Begin with a small neat pour in a tulip glass; add a few drops of water if alcohol masks the cigar.",signals:/cedar|leather|nut|almond|dried fruit|raisin|fig|spice|vintage|aged/i,body:"Medium"},
 {name:"Aged rum",style:"Oak-matured rum with restrained sweetness",why:"Molasses, caramel, vanilla, and oak can echo cocoa, coffee, brown sugar, and baking-spice notes.",service:"Serve neat or over one large cube; avoid heavily sweetened flavored rum.",signals:/cocoa|chocolate|coffee|caramel|molasses|vanilla|brown sugar|spice/i,body:"Full"},
 {name:"Rye whiskey",style:"Oak-led whiskey with grain spice and a dry finish",why:"Rye spice and oak can meet pepper, cedar, toast, and roasted notes while a drier finish limits palate fatigue.",service:"Serve neat with water alongside, or lightly diluted if proof dominates.",signals:/pepper|spice|cedar|toast|roast|earth|leather/i,body:"Full"},
 {name:"Single malt Scotch",style:"Malt-forward whisky; unpeated unless smoke is an intentional contrast",why:"Malt, orchard fruit, oak, and optional gentle smoke can either bridge toast and wood or create a deliberate contrast.",service:"Start neat in a small tulip glass; add water gradually and avoid heavy peat with a delicate cigar.",signals:/malt|toast|wood|oak|smoke|earth|orchard|fruit/i,body:"Medium"},
 {name:"Oloroso or Amontillado sherry",style:"Oxidatively aged fortified wine",why:"Nutty, savory, and dried-fruit character supports delicate aged-tobacco notes at lower alcohol intensity than distilled spirits.",service:"Serve cool, not ice-cold, in a small wine glass.",signals:/mild|delicate|nut|almond|cedar|dried fruit|savory|afternoon/i,body:"Mild"},
 {name:"Añejo tequila",style:"Oak-rested agave spirit",why:"Cooked agave, pepper, fruit, and oak can complement earth, spice, mineral, and roasted notes without assuming smoke.",service:"Serve neat at room temperature; keep citrus and salt out of the first comparison.",signals:/earth|pepper|mineral|roast|agave|citrus|warm|outdoor/i,body:"Medium"},
];
const cocktailProfiles:BeverageProfile[]=[
 {name:"Manhattan",style:"Rye or bourbon, sweet vermouth, and aromatic bitters",why:"Whiskey structure and vermouth's fruit-and-herb character can bridge cedar, baking spice, dried fruit, and cocoa without relying on extra sweetness.",service:"Stir to full dilution, serve up, and keep the vermouth measured.",signals:/cedar|spice|pepper|cocoa|chocolate|dried fruit|leather|after dinner|evening/i,body:"Full"},
 {name:"Daiquiri",style:"Aged or lightly aged rum, fresh lime, and restrained sugar",why:"Rum can echo molasses, caramel, and tropical notes while controlled acidity refreshes the palate between draws.",service:"Shake cold and serve up; keep lime and sugar balanced rather than sharp or sweet.",signals:/cream|vanilla|caramel|molasses|tropical|citrus|summer|warm/i,body:"Medium"},
 {name:"Bamboo",style:"Dry sherry, dry vermouth, and bitters",why:"Its lower-proof, savory, nutty structure supports delicate cedar, toast, almond, and mineral notes without overpowering a mild cigar.",service:"Stir, serve up, and garnish lightly with lemon oil.",signals:/mild|delicate|cedar|toast|almond|nut|mineral|morning|afternoon/i,body:"Mild"},
 {name:"Boulevardier",style:"Whiskey, bitter aperitivo, and sweet vermouth",why:"Bittersweet orange and whiskey depth can stand beside a full cigar with earth, roast, dark chocolate, or baking-spice character.",service:"Stir with generous dilution and serve over one large cube; reduce aperitivo if bitterness dominates.",signals:/full|earth|espresso|roast|dark chocolate|char|pepper|rich/i,body:"Full"},
 {name:"Highball",style:"Mature spirit lengthened with chilled soda",why:"Cold dilution and carbonation preserve the base spirit's character while refreshing the palate and lowering intensity.",service:"Build tall over clear ice with restrained garnish and very cold soda.",signals:/light|fresh|hot|outdoor|daytime|refresh|mild|medium/i,body:"Any"},
 {name:"Sherry Cobbler",style:"Amontillado or oloroso sherry, citrus, and restrained sugar",why:"Oxidative nut, dried-fruit, and savory notes can bridge aged tobacco while crushed ice keeps the pairing lively.",service:"Use modest sugar, fresh citrus, and abundant crushed ice.",signals:/nut|dried fruit|raisin|fig|cedar|aged|vintage|afternoon/i,body:"Medium"},
 {name:"Rum Old Fashioned",style:"Aged rum, bitters, and minimal sweetener",why:"Oak and molasses notes can meet cocoa, coffee, caramel, and baking spice while the simple build avoids excess acidity.",service:"Stir to full dilution and serve over one large cube with restrained sweetener.",signals:/coffee|cocoa|caramel|molasses|brown sugar|baking spice/i,body:"Full"},
];
function rankedBeverages(profiles:BeverageProfile[],body:"Mild"|"Medium"|"Full",signals:string,limit=2){return profiles.map((profile,index)=>({profile,score:(profile.body===body?3:profile.body==="Any"?1:0)+(profile.signals.test(signals)?4:0)-index/100})).sort((a,b)=>b.score-a.score).slice(0,limit).map(({profile})=>fallbackPairing(profile.name,profile.style,profile.why,profile.service))}
export function knowledgeBasedSpirits(body:"Mild"|"Medium"|"Full",signals:string,limit=2){return rankedBeverages(spiritProfiles,body,signals,limit)}
export function knowledgeBasedCocktails(body:"Mild"|"Medium"|"Full",signals:string,limit=2){return rankedBeverages(cocktailProfiles,body,signals,limit)}
export function buildCigarSommFallback(input:z.infer<typeof CigarSommQuestionSchema>,inventory:InventoryItem[],smokes:SmokingLog[],catalog:CatalogCigar[]=[]):CigarSommAnswer{
 const reverse=input.pairingDirection==="occasion-to-cigar",selected=input.inventoryId?inventory.find(item=>item.inventoryId===input.inventoryId):undefined;
 const constraints=reverse?parseSommCandidateConstraints(`${input.question} ${input.pairingContext||""} ${input.occasion||""}`):{};
 const candidates=reverse?strictSommCandidates(inventory,catalog,constraints).slice(0,3):[];
 if(reverse&&!candidates.length)throw new Error("No available Vault cigar matches the requested evidence filters. Try broadening one filter.");
 const identity=selected?`${selected.brand} ${selected.line} ${selected.vitola}`.replace(/\s+/g," ").trim():input.cigarName||(candidates[0]?`${candidates[0].brand} ${candidates[0].line} ${candidates[0].vitola}`.replace(/\s+/g," ").trim():"Selected cigar");
 const exact=selected?exactCatalogMatch(selected,catalog):candidates[0]?exactCatalogMatch(candidates[0],catalog):undefined;
 const tastings=selected?smokes.filter(smoke=>smoke.inventoryId===selected.inventoryId).slice(-5):[];
 const notes=uniqueSommItems(tastings.flatMap(smoke=>String(smoke.tastingNotes||"").split(/[,;·]/)).map(value=>value.trim()).filter(Boolean)).slice(0,6);
 const strength=exact?.strength||tastings.map(smoke=>smoke.strength).find(Boolean)||"Not yet documented";
 const body=/full/i.test(String(strength))?"Full":/mild/i.test(String(strength))?"Mild":"Medium";
 const coffee=fallbackPairing(body==="Full"?"Espresso or moka coffee":"Medium-roast coffee",body==="Full"?"Concentrated, low-acid":"Balanced roast","A measured coffee pairing supports the cigar without inventing exact flavor claims.","Serve unsweetened first; add milk only if the cigar feels sharper than expected.");
 const nonAlcoholic=fallbackPairing("Sparkling mineral water","Cold, neutral palate reset","Carbonation refreshes the palate without competing with an uncertain cigar profile.","Serve well chilled in a clean glass.");
 const pairingSignals=`${notes.join(" ")} ${strength} ${input.question} ${input.occasion||""} ${input.pairingContext||""}`;
 const spirits=input.includeAlcohol?knowledgeBasedSpirits(body,pairingSignals).map(spirit=>({...spirit,producer:"Style recommendation",label:spirit.name,verificationUrl:null})):[];
 const cocktails=input.includeAlcohol?knowledgeBasedCocktails(body,pairingSignals):[];
 const cigarRecommendations=candidates.map(item=>({inventoryId:item.inventoryId,cigarName:`${item.brand} ${item.line} ${item.vitola}`.replace(/\s+/g," ").trim(),why:`Available in your Vault${constraints.country?` with exact ${constraints.country} catalog evidence`:""}${constraints.strength?` and ${constraints.strength} strength evidence`:""}.`,serviceMoment:input.pairingContext||input.occasion||"Your stated occasion"}));
 return CigarSommAnswerSchema.parse({
  answer:reverse?`${cigarRecommendations[0].cigarName} is the strongest evidence-matched choice currently available in your Vault. This quick recommendation preserves your requested filters while deeper synthesis is temporarily unavailable.`:`${identity} can still be paired confidently at the style level while deeper synthesis is temporarily unavailable. These recommendations are intentionally conservative and avoid unsupported product or flavor claims.`,
  cigarContext:reverse?cigarRecommendations[0].cigarName:identity,cigarRecommendations,confidence:"Developing",
  personalization:{used:Boolean(selected||candidates.length),signals:[selected?"Selected from your Vault":"Available Vault inventory"],explanation:"This recovery answer uses only the selected or eligible Vault record and documented catalog evidence."},
  tastingProfile:{body,strength:String(strength),coreNotes:notes.length?notes:["Exact tasting notes not yet documented"],development:["Reassess the cigar after the opening third","Adjust the pairing only if the cigar gains strength or sweetness"],evidence:notes.length?"Based on your recorded tasting notes; broader profile synthesis was unavailable.":"Conservative expectation only; no exact tasting evidence was asserted."},
  basis:["Intensity balance","Evidence-safe recovery guidance"],coffee:[coffee],spirits,cocktails,nonAlcoholic:[nonAlcoholic],sources:[],cautions:["Cigar Somm used its immediate recovery path because full synthesis did not complete.","Pairing remains subjective; begin with a small serving."]
 });
}

export async function askCigarSomm(input:z.infer<typeof CigarSommQuestionSchema>,inventory:InventoryItem[],smokes:SmokingLog[],collectorContext?:CigarSommCollectorContext,catalog:CatalogCigar[]=[]){const apiKey=process.env.OPENAI_API_KEY?.trim();if(!apiKey)throw new Error("Cigar Somm is not configured");const reverse=input.pairingDirection==="occasion-to-cigar";const item=input.inventoryId?inventory.find(value=>value.inventoryId===input.inventoryId):undefined;if(input.inventoryId&&!item)throw new Error("The selected inventory cigar was not found");const collectionSiblings=item?.collectionId?inventory.filter(value=>value.collectionId===item.collectionId&&value.inventoryId!==item.inventoryId):[];if(collectionSiblings.length&&!input.collectionChoiceConfirmed)throw new Error("This collection contains multiple cigars. Confirm the exact cigar before Cigar Somm can continue.");const tastings=item?smokes.filter(value=>value.inventoryId===item.inventoryId).slice(-5):[];const collectionCompanions=collectionSiblings.map(value=>({brand:value.brand,line:value.line,vitola:value.vitola}));const constraints=reverse?parseSommCandidateConstraints(`${input.question} ${input.pairingContext||""} ${input.occasion||""}`):{};const eligibleCandidates=reverse?strictSommCandidates(inventory,catalog,constraints):[];if(reverse&&(constraints.country||constraints.strength)&&!eligibleCandidates.length)throw new Error(`No available Vault cigar has exact catalog evidence for ${[constraints.strength,constraints.country].filter(Boolean).join(" · ")}. Hojavía will not substitute cigars from another origin or intensity.`);const ownedCandidates=eligibleCandidates.slice(0,150).map(value=>{const evidence=exactCatalogMatch(value,catalog);return{inventoryId:value.inventoryId,brand:value.brand,line:value.line,vitola:value.vitola,vintage:value.vintage,quantity:value.currentQty,score:value.score,notes:value.notes,country:evidence?.country,strength:evidence?.strength,evidenceSourceUrl:evidence?.sourceUrl}});const context=reverse?{source:"reverse pairing",pairingContext:input.pairingContext,strictConstraints:constraints,ownedCandidates}:item?{source:"owned inventory",inventoryId:item.inventoryId,exactIdentity:{makerOrBrand:item.brand,line:item.line,physicalVitola:item.vitola,vintage:item.vintage},collectionCompanions,quantity:item.currentQty,status:item.status,personalScore:item.score,notes:item.notes,tastings:tastings.map(value=>({overall:value.overall,strength:value.strength,sweetness:value.sweetness,flavor:value.flavor,constructionQuality:value.construction,burn:value.burn,notes:value.tastingNotes,buyAgain:value.buyAgain}))}:{source:"manual entry",cigarName:input.cigarName};const cigarIdentity=item?`${item.brand} ${item.line} ${item.vitola}`:input.cigarName||input.pairingContext||"";const knowledge=await Promise.race([loadKnowledge("approved"),new Promise<Awaited<ReturnType<typeof loadKnowledge>>>(resolve=>setTimeout(()=>resolve([]),2_000))]);const library=relevantKnowledge(`${input.question} ${cigarIdentity}`,knowledge);const prompt=`You are Cigar Somm, a premium cigar advisor. Answer the collector's question using their supplied inventory, tasting context, and founder-approved Master Somm Library when available. Be refined, concise, useful, and candid about uncertainty.

PERSONALIZATION AND PRIVACY:
- The collector profile below is a private, account-scoped summary. Use it only to improve this collector's answer. Never expose internal IDs, imply it is public, or treat it as an external research source.
- Personalize only from signals actually present. Prefer established taste history over weak patterns. Do not infer health, wealth, identity, or other sensitive traits.
- Set personalization.used true only when at least one supplied collector signal materially changes the answer. Name those signals plainly and explain their influence without overstating certainty.
- Exact cigar facts and reliable sources take precedence over personal preference. Valuation and climate data are context, not proof of flavor or authenticity.

PAIRING KNOWLEDGE STANDARD:
- Use a Michelin-caliber hospitality mindset without claiming Michelin affiliation: begin with the guest's stated preference and occasion, make one confident lead recommendation, offer a meaningfully different alternative, and make service feel precise, gracious, and unforced.
- Treat preparation as part of the recommendation. Give practical guidance for pour size, temperature, dilution, glassware, ice, garnish, sequence, and pacing when those choices materially affect the pairing. Never turn refinement into ceremony for its own sake.
- Anticipate guest comfort. Explain how to soften intensity, reduce sweetness, omit alcohol, or pivot when the cigar changes across its thirds. Avoid snobbery, absolute taste claims, and prestige-based recommendations.
- The requested direction is ${input.pairingDirection}. For occasion-to-cigar, begin with the supplied drink, meal, time of day, mood, or occasion and recommend up to three exact owned cigars from ownedCandidates. Never invent ownership. Put those choices in cigarRecommendations with their real inventoryId, identify a best first choice in cigarContext, and explain why each fits now. For cigar-to-beverage, cigarRecommendations must be an empty array.
- For occasion-to-cigar, strictConstraints are mandatory filters, not preferences. Recommend only ownedCandidates already admitted by exact catalog evidence. Never broaden country, origin, strength, or body wording to fill the list; fewer pure results are better than mixed results.
- Reverse pairing must work in every direction: beverage to cigar, meal to cigar, time of day to cigar, and occasion to cigar. Respect the collector's stated context rather than forcing a generic after-dinner answer.
- For reverse pairing, tastingProfile describes the first recommended cigar and must clearly label conservative inference when exact evidence is limited.
- IDENTITY LOCK: Analyze only exactIdentity. Repeat its maker or brand, line, and physical vitola in cigarContext. collectionCompanions are shown only to prevent confusion; never merge their maker, construction, blend, review evidence, or tasting notes into the selected cigar.
- A collaboration or presentation set may contain distinct cigars made by different companies. Match every tasting source to the selected maker, named cigar, and physical shape. If only collection-level evidence exists, say exact tasting evidence is unavailable and give conservative guidance rather than borrowing notes from a companion cigar.
- The answer field is only a polished two-sentence executive recommendation. Use plain text, no headings, bullets, Markdown, URLs, citations, or repeated tasting/pairing details; those belong exclusively in the structured fields below.
- Never repeat cigarContext as a basis item. Every basis item must name a distinct reason the recommendation fits, such as intensity, flavor bridge, contrast, occasion, or a recorded collector preference.
- For a selected cigar, provide a dedicated tastingProfile: body, nicotine strength, concise core notes, and likely beginning/middle/final-third development. Ground it in exact-product sources or the collector's tasting history; otherwise label it as a conservative expectation rather than a fact.
- Do not confuse body with nicotine strength. Do not copy one reviewer's subjective notes as universal experience.
- Treat constructionQuality and burn as separate physical performance observations. They may qualify confidence in a past tasting, but they are never flavor or nicotine-strength evidence and missing values must remain unknown.
- This request uses Hojavía's reviewed knowledge path and does not perform live web research. Treat only the supplied exact inventory, catalog, collector context, and Founder-approved Master Somm Library as evidence. Do not present model memory as researched fact.
- Include a research source only when its URL appears exactly in the supplied Founder-approved Master Somm Library. Otherwise leave sources empty and label tasting or pairing guidance as a conservative application of general principles.
- Separate product facts from pairing judgment. Never copy marketing language as objective tasting fact.
- Cite only direct pages actually used and state what each supports. If reliable exact-product evidence is unavailable, lower confidence and say so.
- Match beverage intensity to cigar body first; then use flavor bridges or deliberate contrast.
- Coffee: consider roast level, origin/process, acidity, milk, extraction, temperature, and sweetness. Avoid claiming one origin is universally correct.
- Spirits: consider proof, oak, sweetness, smoke, fruit, oxidation, and serving dilution. Bourbon/rye, aged rum, Scotch, Irish whiskey, Cognac/Armagnac, brandy, tequila/mezcal, and fortified-wine styles may fit, but recommend only what serves the cigar.
- When includeAlcohol is true, recommend a named producer and exact bottling only when the supplied approved library directly supports it; use that exact approved URL as verificationUrl. Otherwise recommend a precise spirit style, set producer to "Style recommendation," use the specific style as label and name, and set verificationUrl to null. Never invent a bottle or URL.
- Do not invent a label, age statement, proof, tasting note, or availability claim. A generic spirit style is not a completed spirit recommendation. If no specific label can be verified, return no alcoholic pairing rather than disguising a category as a bottle; the application will transparently ask the collector to retry.
- Specific bottles are independent editorial pairing suggestions, never paid placement or an implication that the producer endorses the platform.
- Act as both a cigar sommelier and a spirits sommelier. Evaluate whiskey, rum, grape brandy, agave spirits, malt whisky, fortified wine, and other relevant categories by production character, proof, oak, sweetness, smoke, fruit, oxidation, texture, and service dilution before choosing. Explain the sensory mechanism; prestige and price are never pairing reasons.
- Cocktails are separate from neat spirits. Evaluate at least six genuinely different families before choosing: spirit-forward/aromatic, sour, highball, low-ABV fortified-wine, bittered, and tropical or swizzle. Consider base spirit, modifiers, sugar, bitterness, acidity, dilution, ice, garnish, and aromatic intensity.
- Return up to three structurally distinct cocktails when evidence supports them. Do not default to an Old Fashioned, and never return more than one Old Fashioned variation. Name the flavor bridge or deliberate contrast and explain why the chosen structure fits this cigar.
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
const allowedSourceUrls=new Set(library.map(record=>record.sourceUrl).filter(Boolean));
const model=process.env.OPENAI_SOMM_MODEL?.trim()||"gpt-4.1-mini";
try{const response=await fetch("https://api.openai.com/v1/responses",{
 method:"POST",
 headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},
 body:JSON.stringify({
  model,
  store:false,
  max_output_tokens:1800,
  input:prompt,
  text:{format:{type:"json_schema",name:"cigar_somm_answer",strict:true,schema:cigarSommJsonSchemaFor(input.includeAlcohol)}},
 }),
 signal:AbortSignal.timeout(25_000),
});
 const payload=await response.json();
 if(!response.ok)throw new Error((payload as{error?:{message?:string}}).error?.message||`OpenAI request failed (${response.status})`);
 const text=responseOutputText(payload);
 if(!text)throw new Error("Cigar Somm returned no answer");
 const parsed=JSON.parse(text) as Record<string,unknown>;
 if(typeof parsed.answer==="string"&&parsed.answer.length>600) parsed.answer=parsed.answer.slice(0,597).trimEnd()+"…";
 if(Array.isArray(parsed.sources))parsed.sources=parsed.sources.filter(value=>Boolean(value&&typeof value==="object"&&allowedSourceUrls.has(String((value as{url?:unknown}).url||""))));
 if(Array.isArray(parsed.spirits))parsed.spirits=parsed.spirits.map(value=>{if(!value||typeof value!=="object")return value;const spirit={...value} as Record<string,unknown>;if(!allowedSourceUrls.has(String(spirit.verificationUrl||"")))spirit.verificationUrl=null;return spirit});
 const answer=requireCompletePairings(CigarSommAnswerSchema.parse(parsed),input.includeAlcohol);
 return reverse?enforceSommRecommendationPurity(answer,new Set(eligibleCandidates.map(candidate=>candidate.inventoryId)),constraints):answer
}catch(error){console.warn("Cigar Somm synthesis failed; using recovery response",{reason:error instanceof Error?error.name:"Unknown error"});return buildCigarSommFallback(input,inventory,smokes,catalog)}}
