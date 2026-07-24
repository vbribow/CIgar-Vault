import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TrustMark } from "@/components/trust-mark";
import { loadPublicIndustry } from "@/lib/industry-public";
import { publicationTypeLabel } from "@/lib/industry-hub";
import { publicPageMetadata } from "@/lib/seo";
import "../industry.css";

export const dynamic="force-dynamic";

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const{slug}=await params,{profiles}=await loadPublicIndustry(),profile=profiles.find(item=>item.slug===slug);
  return profile
    ? publicPageMetadata(profile.payload.displayName,profile.payload.summary,`/industry/${profile.slug}`)
    : {title:"Industry profile",robots:{index:false,follow:false}};
}

export default async function IndustryProfilePage({params}:{params:Promise<{slug:string}>}){
  const{slug}=await params,{profiles,publications,revisions}=await loadPublicIndustry(),profile=profiles.find(item=>item.slug===slug);
  if(!profile)notFound();
  const items=publications.filter(item=>item.partnerId===profile.partnerId);
  const profileRevisions=revisions.filter(item=>item.entityId===profile.id);
  return <main className="shell wideShell industryProfilePage"><a className="textLink" href="/industry">← Industry Hub</a><section className="officialProfileHero">{profile.payload.heroImageUrl&&<img src={profile.payload.heroImageUrl} alt=""/>}<div>{profile.payload.logoUrl&&<img className="officialLogo" src={profile.payload.logoUrl} alt={`${profile.payload.displayName} logo`}/>}<TrustMark kind="Official"/><div className="eyebrow">Verified organization profile</div><h1>{profile.payload.displayName}</h1><p className="lede">{profile.payload.summary}</p><div className="officialProfileLinks">{profile.payload.websiteUrl&&<a className="button" href={profile.payload.websiteUrl} target="_blank" rel="noreferrer">Official website ↗</a>}{profile.payload.publicContactUrl&&<a className="button secondary" href={profile.payload.publicContactUrl} target="_blank" rel="noreferrer">Official contact ↗</a>}</div></div></section>
    <section className="officialFacts"><article><span>Founded</span><strong>{profile.payload.foundedYear||"Not stated"}</strong></article><article><span>Headquarters</span><strong>{profile.payload.headquarters||"Not stated"}</strong></article><article><span>Source</span><strong>Authorized organization</strong></article><article><span>Published</span><strong>{new Date(profile.publishedAt).toLocaleDateString()}</strong></article></section>
    <section className="officialHistory"><div><div className="eyebrow">Company history</div><h2>A story preserved in the official record.</h2></div><p>{profile.payload.history}</p></section>
    <section className="officialPeopleFactories"><article><div className="eyebrow">Factories</div><h2>Where the work happens</h2><p>{profile.payload.factories||"No official factory statement has been published."}</p></article><article><div className="eyebrow">Master blenders</div><h2>The people shaping the blends</h2><p>{profile.payload.masterBlenders||"No official master blender statement has been published."}</p></article></section>
    <section className="officialNews"><div className="sectionHead"><div><div className="eyebrow">Official newsroom</div><h2>Published by {profile.payload.displayName}</h2></div><span>{items.length} records</span></div>{items.map(item=><article id={`publication-${item.id}`} key={item.id}>{item.payload.heroImageUrl&&<img src={item.payload.heroImageUrl} alt=""/>}<div><TrustMark kind="Official" compact/><small>{publicationTypeLabel(item.type)} · Published {new Date(item.publishedAt).toLocaleDateString()}</small><h3>{item.payload.title}</h3><p className="officialSummary">{item.payload.summary}</p><div className="officialBody">{item.payload.body}</div>{item.payload.effectiveDate&&<small>Effective {item.payload.effectiveDate}</small>}{item.payload.canonicalSourceUrl&&<a className="textLink" href={item.payload.canonicalSourceUrl} target="_blank" rel="noreferrer">Open canonical organization source ↗</a>}</div></article>)}{!items.length&&<div className="industryEmpty">No official newsroom items have been published.</div>}</section>
    <section className="officialCorrections"><div><div className="eyebrow">Revision and correction history</div><h2>The record does not disappear.</h2><p>Published changes, suspensions, and archival decisions remain part of Cedriva’s governance record.</p></div><div>{profileRevisions.map(item=><article key={item.id}><strong>{item.action.replaceAll("."," ")}</strong><span>{item.source}</span><time>{new Date(item.createdAt).toLocaleString()}</time></article>)}{!profileRevisions.length&&<p>No post-publication changes recorded.</p>}</div></section>
  </main>;
}
