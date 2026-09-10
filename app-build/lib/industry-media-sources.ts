export type IndustryMediaSource={name:string;homeUrl:string;newsUrl:string;creditRule:string};

export const industryMediaSources:IndustryMediaSource[]=[
  {
    name:"Cigar Press",
    homeUrl:"https://cigarpress.com/",
    newsUrl:"https://cigarpress.com/cigar-news/",
    creditRule:"Credit Cigar Press by name, preserve the named author when the article supplies one, link to the direct article, and use an original summary rather than copied article text.",
  },
];

export function requiredIndustryMediaChecks(){return industryMediaSources.map(source=>`Required media check: review ${source.newsUrl} for qualified recent articles. ${source.creditRule}`).join("\n")}
