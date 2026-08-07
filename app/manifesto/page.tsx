import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/seo";
import { brand } from "@/lib/brand";
import "./manifesto.css";

export const metadata:Metadata=publicPageMetadata(
  `The ${brand.name} Manifesto`,
  "A declaration for everyone who believes premium cigars are a culture worth preserving.",
  "/manifesto",
);

const declarations=[
  ["We believe the cigar is only the beginning.","Behind every leaf is a farmer. Behind every blend is a point of view. Behind every box is the work of hands, families, factories, and generations."],
  ["We believe every collection is alive.","It holds first discoveries and final celebrations. Friends remembered. Journeys taken. Patience rewarded. Its value cannot be reduced to a number."],
  ["We believe knowledge should open doors.","No collector should be made to feel like an outsider. Curiosity is not inexperience to hide—it is the beginning of stewardship."],
  ["We believe expertise should have a greater voice.","Technology must not flatten hard-earned judgment. It should preserve it, connect it, credit it, and help it travel farther."],
  ["We believe the relationship is part of the experience.","A cigar may pass through many hands before it is enjoyed. The lasting culture is built when growers, makers, retailers, lounges, and collectors remain connected—and when the people and memories surrounding a cigar are treated as meaningful knowledge."],
  ["We believe truth deserves discipline.","A source is stronger than a claim. Visible uncertainty is stronger than false confidence. A correction is stronger than a quiet mistake."],
  ["We believe the industry is one ecosystem.","When growers, blenders, retailers, lounges, writers, educators, and collectors grow stronger together, the culture endures."],
] as const;

export default function ManifestoPage(){return <main className="manifestoPage"><section className="manifestoOpening"><a className="manifestoWordmark" href="/">{brand.name.toLocaleUpperCase("es")}</a><div className="eyebrow">The {brand.name} Manifesto</div><h1>More than a cigar.<br/><em>A living tradition.</em></h1><p>We are building a home for the knowledge, stories, craftsmanship, and people that make premium cigar culture extraordinary.</p><a className="button" href="#declaration">Read the declaration</a></section><figure className="manifestoVisualIntro"><img src={"/editorial/cigar-roller-hojavia.jpg"} width="1540" height="1021" alt={`A warm ${brand.name} workshop scene with tobacco leaves, hand tools, and archival craft.`} fetchPriority="high" decoding="async"/><figcaption><span>Preserve · Honor · Grow</span><p>The culture lives in the hands, knowledge, and stories behind every cigar.</p></figcaption></figure><section className="manifestoDeclaration" id="declaration"><div className="manifestoLead"><span>01</span><h2>We refuse to let a great tradition become disconnected from its story.</h2></div>{declarations.map(([title,body],index)=><article key={title}><span>{String(index+2).padStart(2,"0")}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</section><section className="manifestoFuture"><div className="eyebrow">What we are here to do</div><h2>Preserve what came before.<br/>Honor those shaping it now.<br/>Grow what comes next.</h2><p>{brand.name} will help collectors care for what they own, understand what they experience, remember why it mattered, and share what they learn. We will create tools worthy of exceptional collections—and a welcome worthy of the newest collector.</p></section><section className="manifestoInvitation"><div><div className="eyebrow">This belongs to all of us</div><h2>Bring your knowledge.<br/>Bring your questions.<br/>Bring your story.</h2></div><div><p>If you believe craftsmanship deserves recognition, expertise deserves respect, beginners deserve encouragement, and premium cigar culture deserves a future—there is a place for you here.</p><strong>Help us preserve the tradition.<br/>Help us grow the culture.</strong><div className="ctaRow"><a className="button" href="/login?mode=signup">Join {brand.name}</a><a className="button secondary" href="/constitution">Read our Constitution</a></div></div></section><footer className="manifestoFooter"><span>{brand.name.toLocaleUpperCase("es")}</span><small>A tradition worth preserving. A culture worth growing.</small></footer></main>}
