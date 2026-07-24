export type ProductDomainId = "discover"|"vault"|"review"|"market"|"verify"|"community"|"learn"|"ai"|"reserve";
export type ProductDomainLink = { href:string; label:string; description:string };
export type ProductDomain = { id:ProductDomainId; label:string; promise:string; href:string; links:ProductDomainLink[] };

export const productDomains:ProductDomain[]=[
  {id:"discover",label:"Discover",promise:"Find the next meaningful cigar and understand why it matters.",href:"/discover",links:[
    {href:"/discover",label:"Discover Cedriva",description:"Explore cigars through stories, goals, and trusted guidance"},
    {href:"/catalog",label:"Cigar catalog",description:"Browse documented brands, lines, and vitolas"},
    {href:"/collection-catalog",label:"Collection catalog",description:"Explore researched heritage sets"},
    {href:"/wishlist",label:"Wish list",description:"Remember cigars and collections worth pursuing"},
  ]},
  {id:"vault",label:"Vault",promise:"Document, care for, understand, and preserve your collection.",href:"/inventory",links:[
    {href:"/inventory",label:"My collection",description:"Document every box, set, and individual cigar"},
    {href:"/collections",label:"Curated collections",description:"Preserve special releases as complete presentations"},
    {href:"/inventory-count",label:"Confirm quantities",description:"Reconcile boxes and individual cigars"},
    {href:"/storage",label:"Storage",description:"Know where every cigar is cared for"},
    {href:"/humidors",label:"Humidors",description:"Protect condition, climate, and aging intent"},
    {href:"/activity",label:"Collection timeline",description:"Remember purchases, smokes, gifts, moves, and corrections"},
    {href:"/inventory-integrity",label:"Record protection",description:"Back up, compare, and safely restore private records"},
  ]},
  {id:"review",label:"Review",promise:"Learn from trustworthy experience—your own and others'.",href:"/records",links:[
    {href:"/records",label:"Smoking journal",description:"Remember tasting experiences and how cigars develop"},
    {href:"/ratings",label:"Published reviews",description:"Compare attributable professional scores"},
    {href:"/cigar-somm",label:"Cigar Somm",description:"Explore tasting profiles and coffee, spirit, cocktail, and nonalcoholic pairings"},
  ]},
  {id:"market",label:"Market",promise:"Understand value without reducing the culture to speculation.",href:"/valuations",links:[
    {href:"/valuations",label:"Collection values",description:"Research retail replacement and market evidence"},
    {href:"/value-history",label:"Value history",description:"Follow documented movement over time"},
    {href:"/auction-market",label:"Auction results",description:"Review verified completed-sale evidence"},
    {href:"/decision-center",label:"Decision center",description:"Use the purchase advisor with collection context"},
    {href:"/reports",label:"Protection report",description:"Create an evidence-backed property schedule"},
  ]},
  {id:"verify",label:"Verify",promise:"Protect authenticity, provenance, and collector confidence.",href:"/verification",links:[
    {href:"/verification",label:"Authenticity evidence",description:"Preserve box codes, seals, and supporting photographs"},
    {href:"/box-formats",label:"Packaging archive",description:"Review sourced box formats and known configurations"},
    {href:"/collection-health",label:"Documentation health",description:"Find identity, provenance, and evidence gaps"},
  ]},
  {id:"community",label:"Community",promise:"Belong, contribute, and help premium cigar culture grow.",href:"/community",links:[
    {href:"/community",label:"Collector community",description:"Ask, teach, share, and discover community favorites"},
  ]},
  {id:"learn",label:"Learn",promise:"Make expertise approachable and lifelong.",href:"/learn",links:[
    {href:"/learn",label:"Learning paths",description:"Build confidence through contextual education"},
    {href:"/learn/seed-to-smoke",label:"Seed to Smoke",description:"Follow tobacco, people, and craft from the field to the collector"},
    {href:"/learn/vitolas",label:"Understanding Vitolas",description:"Compare cigar dimensions, shapes, construction, and smoking relationships"},
    {href:"/learn/blending",label:"Blending & Master Blenders",description:"Understand blend architecture and study documented blender careers"},
    {href:"/learn/manufacturing-truth",label:"Manufacturing Truth",description:"Find the brand owner, blender, actual factory, tobacco regions, and supporting evidence"},
    {href:"/catalog",label:"Cigar reference",description:"Learn through documented cigar identities"},
    {href:"/data-model",label:"How Cedriva understands a cigar",description:"Follow identity, release, provenance, evidence, and collector history"},
    {href:"/sommelier-library",label:"Curated knowledge",description:"Review the evidence library behind Cedriva AI"},
  ]},
  {id:"ai",label:"Cigar Somm",promise:"Elevate collector judgment with trusted, personal guidance powered by Cedriva AI.",href:"/cigar-somm",links:[
    {href:"/cigar-somm",label:"Open Cigar Somm",description:"Choose one cigar for its profile, readiness, and complete pairing plan"},
    {href:"/intelligence",label:"Collection intelligence",description:"Understand patterns, priorities, and evidence gaps"},
    {href:"/acquisitions",label:"Collection goals",description:"See documented pieces that would complete a set"},
  ]},
  {id:"reserve",label:"Reserve",promise:"The deepest level of intelligence, service, and stewardship.",href:"/pricing",links:[
    {href:"/pricing",label:"Cedriva plans",description:"Choose the depth of service that fits your collection"},
    {href:"/account",label:"Account and privacy",description:"Control your plan, preferences, exports, and data"},
  ]},
];

export const productDomain=(id:ProductDomainId)=>productDomains.find(domain=>domain.id===id)!;
