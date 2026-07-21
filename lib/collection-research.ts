export type WebCollectionResult = {
  title: string;
  url: string;
  summary: string;
};

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
    .map((match) => ({
      title: tag(match[1], "title"),
      url: tag(match[1], "link"),
      summary: tag(match[1], "description").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    }))
    .filter((item) => item.title && /^https?:\/\//.test(item.url))
    .slice(0, 6);
}

export function collectionSearchUrl(query: string) {
  const terms = `${query.trim()} cigar collection contents box set`;
  return `https://www.bing.com/search?format=rss&q=${encodeURIComponent(terms)}`;
}
