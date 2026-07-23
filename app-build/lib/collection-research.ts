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

export function parseCollectionSearchRss(xml: string): WebCollectionResult[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .map((match) => {
      const title = tag(match[1], "title");
      const url = tag(match[1], "link");
      const summary = tag(match[1], "description").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      return { title, url, summary, inferred: inferCollectionDetails(`${title} ${summary}`) };
    })
    .filter((item) => item.title && /^https?:\/\//.test(item.url))
    .slice(0, 6);
}

export function collectionSearchUrl(query: string) {
  const terms = `${query.trim()} cigar collection contents box set`;
  return `https://www.bing.com/search?format=rss&q=${encodeURIComponent(terms)}`;
}
