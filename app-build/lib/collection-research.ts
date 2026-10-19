export type WebCollectionResult = {
  title: string;
  url: string;
  summary: string;
  inferred: InferredCollectionDetails;
};

export type InferredCollectionDetails = {
  releaseYear?: number;
  expectedCigars?: number;
  marketValue?: number;
  maker?: string;
  confidence: "High" | "Medium" | "Low";
};

const collectionStopWords=new Set(["a","an","and","box","cigar","cigars","collection","contents","edition","from","house","of","set","the","with","year"]);
const tobaccoContext=/\b(cigar|cigars|tobacco|humidor|sampler|vitola|perfecto|robusto|toro|lancero|churchill|opusx|fuente|padron|padr[oó]n|cohiba|davidoff|habanos)\b/i;
const unrelatedHospitality=/\b(restaurant|restaurants|menu|dining|cuisine|pizzeria|pizza|reservations?|hotel|resort|vacation|tripadvisor|yelp|opentable)\b/i;

const searchableWords=(value:string)=>value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().match(/[a-z0-9]+/g)||[];
const comparableWord=(word:string)=>word.length>4&&word.endsWith("s")&&!word.endsWith("ss")?word.slice(0,-1):word;

export function collectionResultIsRelevant(result:Pick<WebCollectionResult,"title"|"url"|"summary">,query:string){
  const text=`${result.title} ${result.summary} ${result.url}`;
  if(unrelatedHospitality.test(text))return false;
  if(!tobaccoContext.test(text))return false;
  const required=[...new Set(searchableWords(query).filter(word=>word.length>2&&!collectionStopWords.has(word)).map(comparableWord))];
  const haystack=new Set(searchableWords(text).map(comparableWord));
  return required.length===0||required.every(word=>haystack.has(word));
}

const knownMakers = ["Arturo Fuente", "Padrón", "Cohiba", "Davidoff", "La Aurora", "My Father", "Joya de Nicaragua", "H. Upmann", "Hoyo de Monterrey", "Romeo y Julieta", "Partagás", "Trinidad", "Bolívar", "Montecristo", "Plasencia", "Oliva", "Ashton", "A.J. Fernandez", "Drew Estate", "Tatuaje", "Rocky Patel", "Perdomo"];

export function inferCollectionDetails(text: string): InferredCollectionDetails {
  const yearMatches = [...text.matchAll(/\b(19\d{2}|20\d{2})\b/g)].map((match) => Number(match[1])).filter((year) => year <= new Date().getFullYear() + 1);
  const countMatch = text.match(/\b(\d{1,3})[\s-]*(?:cigar|stick)(?:s|\s+sampler|\s+collection)?\b/i) || text.match(/(?:contains?|includes?|comprises?)\s+(\d{1,3})\b/i);
  const prices = [...text.matchAll(/\$\s?([\d,]+(?:\.\d{2})?)/g)].map((match) => Number(match[1].replace(/,/g, ""))).filter((value) => value > 0);
  const maker = knownMakers.find((name) => text.toLowerCase().includes(name.toLowerCase()));
  const inferred: Omit<InferredCollectionDetails, "confidence"> = {};
  if (yearMatches[0]) inferred.releaseYear = yearMatches[0];
  if (countMatch) inferred.expectedCigars = Number(countMatch[1]);
  if (prices[0]) inferred.marketValue = prices[0];
  if (maker) inferred.maker = maker;
  const evidenceCount = Object.keys(inferred).length;
  return { ...inferred, confidence: evidenceCount >= 3 ? "High" : evidenceCount >= 1 ? "Medium" : "Low" };
}

const decodeXml = (value: string) => value
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">");

const tag = (item: string, name: string) => {
  const match = item.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`, "i"));
  return decodeXml(match?.[1]?.trim() || "");
};

export function parseCollectionSearchRss(xml: string,query?:string): WebCollectionResult[] {
  const results=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .map((match) => {
      const title = tag(match[1], "title");
      const url = tag(match[1], "link");
      const summary = tag(match[1], "description").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      return { title, url, summary, inferred: inferCollectionDetails(`${title} ${summary}`) };
    })
    .filter((item) => item.title && /^https?:\/\//.test(item.url));
  return results.filter(item=>!query||collectionResultIsRelevant(item,query)).slice(0,6);
}

export function collectionSearchUrl(query: string) {
  const terms = `${query.trim()} cigar collection contents box set`;
  return `https://www.bing.com/search?format=rss&q=${encodeURIComponent(terms)}`;
}

export function collectionVerificationSearchUrls(query:string){
  const exact=query.trim();
  return[
    collectionSearchUrl(exact),
    `https://www.bing.com/search?format=rss&q=${encodeURIComponent(`${exact} site:foxcigar.com cigar collection contents price`)}`,
  ];
}
