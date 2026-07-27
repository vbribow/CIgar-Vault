"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { communityStatusLabel, type CommunityPost, type CommunityRanking, type CommunityRating } from "@/lib/community";
import type { CommunityRatingInventoryOption } from "@/lib/community-rating-options";
import { TrustMark } from "@/components/trust-mark";
import { brand } from "@/lib/brand";
import { useMutationGuard } from "@/components/use-mutation-guard";

type CommunityData = { posts: CommunityPost[]; top25: CommunityRanking[]; myTop10:CommunityRanking[]; ratingCount: number; myContributions:{posts:CommunityPost[];ratings:CommunityRating[]} };
const empty: CommunityData = { posts: [], top25: [], myTop10:[], ratingCount: 0, myContributions:{posts:[],ratings:[]} };
const blankRating = { displayName: "", brand: "", line: "", vitola: "", vintage: "", score: "", review: "" };

export function CommunityHub({ inventoryOptions = [], initialTab = "board" }: { inventoryOptions?: CommunityRatingInventoryOption[]; initialTab?: "board" | "ratings" }) {
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<"post" | "rating" | "">("");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"board" | "ratings">(initialTab);
  const [entryMode, setEntryMode] = useState<"vault" | "manual">(inventoryOptions.length ? "vault" : "manual");
  const [post, setPost] = useState({ displayName: "", category: "General", title: "", body: "" });
  const [rating, setRating] = useState(blankRating);
  const postMutation = useMutationGuard();
  const ratingMutation = useMutationGuard();
  const brands = useMemo(() => [...new Set(inventoryOptions.map(item => item.brand))], [inventoryOptions]);
  const lines = useMemo(() => [...new Set(inventoryOptions.filter(item => item.brand === rating.brand).map(item => item.line))], [inventoryOptions, rating.brand]);
  const vitolas = useMemo(() => [...new Set(inventoryOptions.filter(item => item.brand === rating.brand && item.line === rating.line).map(item => item.vitola))], [inventoryOptions, rating.brand, rating.line]);
  const vintages = useMemo(() => [...new Set(inventoryOptions.filter(item => item.brand === rating.brand && item.line === rating.line && item.vitola === rating.vitola).map(item => item.vintage).filter((value): value is string => Boolean(value)))], [inventoryOptions, rating.brand, rating.line, rating.vitola]);

  function chooseMode(mode: "vault" | "manual") {
    setEntryMode(mode);
    setRating(current => ({ ...blankRating, displayName: current.displayName, score: current.score, review: current.review }));
  }
  function showTab(next:"board"|"ratings"){
    setTab(next);
    window.requestAnimationFrame(()=>document.querySelector(".communityTabs")?.scrollIntoView({behavior:"smooth",block:"start"}));
  }
  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/community", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Community unavailable");
      setData(result.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Community unavailable");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);
  async function submit(type: "post" | "rating", value: unknown) {
    setMessage("");
    const response = await fetch("/api/community", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type, data: value }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Submission failed");
    setMessage(result.message);
    await load();
  }
  async function submitPost(event: FormEvent) {
    event.preventDefault();
    if (submitting || !postMutation.begin()) return;
    setSubmitting("post");
    try {
      await submit("post", post);
      setPost(current => ({ ...current, title: "", body: "" }));
      postMutation.succeed();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Submission failed");
      postMutation.fail();
    } finally {
      setSubmitting("");
    }
  }
  async function submitRating(event: FormEvent) {
    event.preventDefault();
    if (submitting || !ratingMutation.begin()) return;
    setSubmitting("rating");
    try {
      await submit("rating", { ...rating, score: Number(rating.score), vintage: rating.vintage || undefined, review: rating.review || undefined });
      setRating(current => ({ ...blankRating, displayName: current.displayName }));
      ratingMutation.succeed();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Submission failed");
      ratingMutation.fail();
    } finally {
      setSubmitting("");
    }
  }

  const identityFields = entryMode === "vault" ? <>
    <label>Brand<select value={rating.brand} onChange={event => setRating({ ...rating, brand: event.target.value, line: "", vitola: "", vintage: "" })} required>
<option value="">Choose a brand</option>{brands.map(brand => <option key={brand}>{brand}</option>)}</select>
</label>
    <label>Line or blend<select value={rating.line} disabled={!rating.brand} onChange={event => setRating({ ...rating, line: event.target.value, vitola: "", vintage: "" })} required>
<option value="">{rating.brand ? "Choose a line or blend" : "Choose a brand first"}</option>{lines.map(line => <option key={line}>{line}</option>)}</select>
</label>
    <label>Vitola<select value={rating.vitola} disabled={!rating.line} onChange={event => setRating({ ...rating, vitola: event.target.value, vintage: "" })} required>
<option value="">{rating.line ? "Choose a vitola" : "Choose a line first"}</option>{vitolas.map(vitola => <option key={vitola}>{vitola}</option>)}</select>
</label>
    {vintages.length ? <label>Vintage or release year<select value={rating.vintage} onChange={event => setRating({ ...rating, vintage: event.target.value })}>
<option value="">Not specified</option>{vintages.map(vintage => <option key={vintage}>{vintage}</option>)}</select>
</label> : null}
  </> : <>
    <label>Brand<input value={rating.brand} onChange={event => setRating({ ...rating, brand: event.target.value })} required />
</label>
    <label>Line or blend<input value={rating.line} onChange={event => setRating({ ...rating, line: event.target.value })} required />
</label>
    <label>Vitola<input value={rating.vitola} onChange={event => setRating({ ...rating, vitola: event.target.value })} required />
</label>
    <label>Vintage or release year<input value={rating.vintage} onChange={event => setRating({ ...rating, vintage: event.target.value })} />
</label>
  </>;

  return <>
    <section className="communityMetrics" aria-label="Community activity">
<Link href="/community?tab=board#recent-discussions" onClick={()=>setTab("board")} aria-label={`View ${data.posts.length} recent discussions`}>
<strong>{data.posts.length}</strong>
<span>recent discussions</span>
<small>Read collector conversations →</small>
</Link>
<Link href="/community?tab=ratings#rate-a-cigar" onClick={()=>setTab("ratings")} aria-label={`View ${data.ratingCount} collector ratings`}>
<strong>{data.ratingCount}</strong>
<span>collector ratings</span>
<small>Rate from your Vault →</small>
</Link>
</section>
    <section className="communityTabs">
<button type="button" className={tab === "board" ? "active" : ""} aria-pressed={tab==="board"} onClick={() => showTab("board")}>Message board</button>
</section>
    {message && <output className="communityMessage" aria-live="polite">{message}{message.includes("administrator review") && <small>Your contribution is private while it waits in the <a href="/ai-administrator">AI Administrator review queue</a>.</small>}</output>}
    <aside className="communityTrust">
<TrustMark kind="Community" compact/>
<span>Posts, reviews, and Cedriva 25 scores reflect collector experience—not official product facts.</span>
<a href="/trust">How Cedriva labels trust →</a>
</aside>
    {(data.myContributions.posts.length>0||data.myContributions.ratings.length>0)&&<section className="contributionTracker">
<div className="sectionHead">
<div>
<div className="eyebrow">Your contributions</div>
<h2>Publication status</h2>
<p>Track each submission from review through publication. Founder notes appear here when a correction is needed.</p>
</div>
<a className="button secondary" href="/ai-administrator">Founder review</a>
</div>
<div>{[...data.myContributions.posts.map(item=>({id:item.id,kind:"Discussion",label:item.title,status:item.status,reason:item.moderationReason,createdAt:item.createdAt})),...data.myContributions.ratings.map(item=>({id:item.id,kind:"Rating",label:`${item.brand} ${item.line} ${item.vitola} · ${item.score}`,status:item.status,reason:item.moderationReason,createdAt:item.createdAt}))].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(item=>
<article key={`${item.kind}-${item.id}`}>
<div>
<span>{item.kind}</span>
<strong>{item.label}</strong>
<small>{new Date(item.createdAt).toLocaleString()}</small>
</div>
<b data-status={item.status}>{communityStatusLabel(item.status)}</b>{item.status==="changes"&&item.reason&&<p>{item.reason}</p>}</article>)}</div>
</section>}
    {tab === "board" ? <div className="communityLayout">
      <section id="recent-discussions">
<aside className="communityAgeNotice"><strong>21+ collector community</strong><span>Education and discussion only. Marketplace transactions are not permitted.</span></aside>
<div className="sectionHead">
<div>
<div className="eyebrow">Collector conversation</div>
<h2>Recent discussions</h2>
<p>Questions, experience, stewardship, and cultural knowledge shared by Cedriva collectors.</p>
</div>
</div>{loading ? <div className="emptyState">Loading community…</div> : data.posts.map(item => <article className="communityPost" key={item.id}>
<span>{item.category}</span>
<h3>{item.title}</h3>
<p>{item.body}</p>
<small>{item.displayName} · {new Date(item.createdAt).toLocaleDateString()}</small>
</article>)}{!loading && !data.posts.length && <div className="emptyState">
<strong>The table is ready for its first conversation.</strong>
<p>Ask a thoughtful question about a cigar, collection care, history, craftsmanship, or a memorable experience.</p>
</div>}</section>
      <form className="communityForm" onSubmit={submitPost} aria-busy={postMutation.pending}>
<div className="eyebrow">New discussion</div>
<h2>Share with collectors</h2>
<label>Display name<input value={post.displayName} onChange={event => setPost({ ...post, displayName: event.target.value })} required minLength={2} />
</label>
<label>Category<select value={post.category} onChange={event => setPost({ ...post, category: event.target.value })}>
<option>General</option>
<option>Cigar discussion</option>
<option>Collection care</option>
<option>Humidors</option>
<option>Events</option>
</select>
</label>
<label>Title<input value={post.title} onChange={event => setPost({ ...post, title: event.target.value })} required minLength={4} />
</label>
<label>Message<textarea value={post.body} onChange={event => setPost({ ...post, body: event.target.value })} required minLength={10} rows={7} />
</label>
<button className="button" disabled={Boolean(submitting)||postMutation.complete}>{submitting==="post"?"Publishing…":postMutation.complete?"Discussion submitted":"Submit discussion"}</button>
{postMutation.complete&&<button type="button" className="button secondary" onClick={()=>{postMutation.reset();setMessage("")}}>Start another discussion</button>}
<small>AI Administrator screens submissions. No sales, trades, personal contact details, or illegal activity.</small>
</form>
    </div> : <div className="communityRatingsWorkspace">
      <section id="my-top-10">
<div className="sectionHead">
<div>
<div className="eyebrow">Your palate</div>
<h2>My Top 10</h2>
<p>Your ten highest published scores, ordered by your ratings. This personal list contributes a preference signal to the Cedriva 25.</p>
</div>
</div>
<div className="rankingList personalRanking">{data.myTop10.map(item => <article key={item.cigarKey}>
<strong>#{item.rank}</strong>
<div>
<h3>{item.brand} {item.line}</h3>
<span>{item.vitola}{item.vintage ? ` · ${item.vintage}` : ""}</span>
</div>
<b>{item.averageScore}</b>
<small>your score</small>
</article>)}</div>{!data.myTop10.length && <div className="emptyState"><strong>Your Top 10 is ready to take shape.</strong><p>Publish your first cigar rating, then keep scoring the cigars you experience. Your list will update automatically.</p></div>}</section>
      <div className="communityLayout">
      <section id="top-25">
<div className="sectionHead">
<div>
<div className="eyebrow">Community consensus</div>
<h2>The Cedriva 25</h2>
<p>Each collector contributes one current score per cigar. A mature personal Top 10 can contribute up to 20% preference context; early lists receive proportionally less weight. Cedriva also adjusts small samples toward the community average so one rating cannot imply broad consensus. Only published ratings count.</p>
</div>
</div>
<div className="rankingList">{data.top25.map(item => <article key={item.cigarKey}>
<strong>#{item.rank}</strong>
<div>
<h3>{item.brand} {item.line}</h3>
<span>{item.vitola}{item.vintage ? ` · ${item.vintage}` : ""}</span>
</div>
<b>{item.weightedScore}</b>
<small>{brand.name} score · {item.averageScore} average · {item.ratingCount} rating{item.ratingCount === 1 ? "" : "s"} · {item.confidence}</small>
</article>)}</div>{!data.top25.length && <div className="emptyState"><strong>The ranking is waiting for credible experience.</strong><p>Published collector ratings will establish the {brand.labels.communityRanking} without invented scores or promotional placement.</p></div>}</section>
      <form id="rate-a-cigar" className="communityForm" onSubmit={submitRating} aria-busy={ratingMutation.pending}>
<div className="eyebrow">Rate a cigar</div>
<h2>Document your experience</h2>
<p>Choose the exact cigar from your Vault or identify it manually. Your score enters the ranking only after publication.</p>
<div className="ratingEntryMode" role="group" aria-label="Choose cigar entry method">
<button type="button" className={entryMode === "vault" ? "active" : ""} disabled={!inventoryOptions.length} onClick={() => chooseMode("vault")}>Choose from my Vault</button>
<button type="button" className={entryMode === "manual" ? "active" : ""} onClick={() => chooseMode("manual")}>Enter manually</button>
</div>
<label>Display name<input value={rating.displayName} onChange={event => setRating({ ...rating, displayName: event.target.value })} required />
</label>{identityFields}<label>Score (1–100)<input type="number" min="1" max="100" value={rating.score} onChange={event => setRating({ ...rating, score: event.target.value })} required />
</label>
<label>Short review<textarea rows={4} value={rating.review} onChange={event => setRating({ ...rating, review: event.target.value })} />
</label>
<button className="button" disabled={Boolean(submitting)||ratingMutation.complete}>{submitting==="rating"?"Publishing…":ratingMutation.complete?"Rating submitted":"Submit rating"}</button>
{ratingMutation.complete&&<button type="button" className="button secondary" onClick={()=>{ratingMutation.reset();setMessage("")}}>Rate another cigar</button>}
<small>{entryMode === "vault" ? "Cigar identity comes directly from your private Vault. Only the rating is shared." : "Use manual entry for a cigar that is not in your Vault."}</small>
</form>
      </div>
    </div>}
  </>;
}
