export type IndustryMediaSource={name:string;homeUrl:string;newsUrl:string;creditRule:string};

export const industryMediaSources:IndustryMediaSource[]=[
  {
    name:"Cigar Press",
    homeUrl:"https://cigarpress.com/",
    newsUrl:"https://cigarpress.com/cigar-news/",
    creditRule:"Credit Cigar Press by name, preserve the named author when the article supplies one, link to the direct article, and use an original summary rather than copied article text.",
  },
  {
    name:"The Late Smoke",
    homeUrl:"https://www.thelatesmoke.com/",
    newsUrl:"https://www.thelatesmoke.com/",
    creditRule:"Credit The Late Smoke and the named author, link to the direct article or review, distinguish reported fact from commentary or tasting opinion, and publish an original summary without copying its prose or images.",
  },
  {
    name:"halfwheel",
    homeUrl:"https://halfwheel.com/",
    newsUrl:"https://halfwheel.com/",
    creditRule:"Credit halfwheel and the named author, link to the canonical direct article, distinguish reporting from reviews or commentary, and publish an original summary without copying its prose or images.",
  },
  {
    name:"Cigar Aficionado",
    homeUrl:"https://www.cigaraficionado.com/",
    newsUrl:"https://www.cigaraficionado.com/news",
    creditRule:"Credit Cigar Aficionado and the named author, link to the canonical direct article, respect subscription boundaries, distinguish reporting from ratings or opinion, and publish an original summary without copying its prose or images.",
  },
];

export function requiredIndustryMediaChecks(){return industryMediaSources.map(source=>`Required media check: review ${source.newsUrl} for qualified recent articles. ${source.creditRule}`).join("\n")}
