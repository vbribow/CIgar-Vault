"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { CommunityPost, CommunityRanking } from "@/lib/community";
import type { CommunityRatingInventoryOption } from "@/lib/community-rating-options";
import { TrustMark } from "@/components/trust-mark";

type CommunityData = { posts: CommunityPost[]; top25: CommunityRanking[]; ratingCount: number };
const empty: CommunityData = { posts: [], top25: [], ratingCount: 0 };
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
  const brands = useMemo(() => [...new Set(inventoryOptions.map(item => item.brand))], [inventoryOptions]);
  const lines = useMemo(() => [...new Set(inventoryOptions.filter(item => item.brand === rating.brand).map(item => item.line))], [inventoryOptions, rating.brand]);
  const vitolas = useMemo(() => [...new Set(inventoryOptions.filter(item => item.brand === rating.brand && item.line === rating.line).map(item => item.vitola))], [inventoryOptions, rating.brand, rating.line]);
  const vintages = useMemo(() => [...new Set(inventoryOptions.filter(item => item.brand === rating.brand && item.line === rating.line && item.vitola === rating.vitola).map(item => item.vintage).filter((value): value is string => Boolean(value)))], [inventoryOptions, rating.brand, rating.line, rating.vitola]);

  function chooseMode(mode: "vault" | "manual") {
    setEntryMode(mode);
    setRating(current => ({ ...blankRating, displayName: current.displayName, score: current.score, review: current.review }));
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
    if (submitting) return;
    setSubmitting("post");
    try {
      await submit("post", post);
      setPost(current => ({ ...current, title: "", body: "" }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setSubmitting("");
    }
  }
  async function submitRating(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting("rating");
    try {
      await submit("rating", { ...rating, score: Number(rating.score), vintage: rating.vintage || undefined, review: rating.review || undefined });
      setRating(current => ({ ...blankRating, displayName: current.displayName }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setSubmitting("");
    }
  }

  const identityFields = entryMode === "vault" ? <>
    <label>Brand<select value={rating.brand} onChange={event => setRating({ ...rating, brand: event.target.value, line: "", vitola: "", vintage: "" })} required><option value="">Choose a brand</option>{brands.map(brand => <option key={brand}>{brand}</option>)}</select></label>
    <label>Line or blend<select value={rating.line} disabled={!rating.brand} onChange={event => setRating({ ...rating, line: event.target.value, vitola: "", vintage: "" })} required><option value="">{rating.brand ? "Choose a line or blend" : "Choose a brand first"}</option>{lines.map(line => <option key={line}>{line}</option>)}</select></label>
    <label>Vitola<select value={rating.vitola} disabled={!rating.line} onChange={event => setRating({ ...rating, vitola: event.target.value, vintage: "" })} required><option value="">{rating.line ? "Choose a vitola" : "Choose a line first"}</option>{vitolas.map(vitola => <option key={vitola}>{vitola}</option>)}</select></label>
    {vintages.length ? <label>Vintage or release year<select value={rating.vintage} onChange={event => setRating({ ...rating, vintage: event.target.value })}><option value="">Not specified</option>{vintages.map(vintage => <option key={vintage}>{vintage}</option>)}</select></label> : null}
  </> : <>
    <label>Brand<input value={rating.brand} onChange={event => setRating({ ...rating, brand: event.target.value })} required /></label>
    <label>Line or blend<input value={rating.line} onChange={event => setRating({ ...rating, line: event.target.value })} required /></label>
    <label>Vitola<input value={rating.vitola} onChange={event => setRating({ ...rating, vitola: event.target.value })} required /></label>
    <label>Vintage or release year<input value={rating.vintage} onChange={event => setRating({ ...rating, vintage: event.target.value })} /></label>
  </>;

  return <>
    <section className="communityMetrics"><article><strong>{data.posts.length}</strong><span>recent discussions</span></article><article><strong>{data.ratingCount}</strong><span>collector ratings</span></article><article><strong>{data.top25.length}</strong><span>ranked cigars</span></article></section>
    <section className="communityTabs"><button className={tab === "board" ? "active" : ""} onClick={() => setTab("board")}>Message board</button><button className={tab === "ratings" ? "active" : ""} onClick={() => setTab("ratings")}>Top 25 cigars</button></section>
    {message && <output className="communityMessage">{message}{message.includes("administrator review") && <small>Your contribution is private while it waits in the <a href="/ai-administrator">AI Administrator review queue</a>.</small>}</output>}
    <aside className="communityTrust"><TrustMark kind="Community" compact/><span>Posts, reviews, and Top 25 scores reflect collector experience—not official product facts.</span><a href="/trust">How Cedriva labels trust →</a></aside>
    {tab === "board" ? <div className="communityLayout">
      <section><div className="sectionHead"><div><div className="eyebrow">Collector conversation</div><h2>Community board</h2></div></div>{loading ? <div className="emptyState">Loading community…</div> : data.posts.map(item => <article className="communityPost" key={item.id}><span>{item.category}</span><h3>{item.title}</h3><p>{item.body}</p><small>{item.displayName} · {new Date(item.createdAt).toLocaleDateString()}</small></article>)}{!loading && !data.posts.length && <div className="emptyState">No discussions yet. Start the first thoughtful conversation.</div>}</section>
      <form className="communityForm" onSubmit={submitPost}><div className="eyebrow">New discussion</div><h2>Share with collectors</h2><label>Display name<input value={post.displayName} onChange={event => setPost({ ...post, displayName: event.target.value })} required minLength={2} /></label><label>Category<select value={post.category} onChange={event => setPost({ ...post, category: event.target.value })}><option>General</option><option>Cigar discussion</option><option>Collection care</option><option>Humidors</option><option>Events</option></select></label><label>Title<input value={post.title} onChange={event => setPost({ ...post, title: event.target.value })} required minLength={4} /></label><label>Message<textarea value={post.body} onChange={event => setPost({ ...post, body: event.target.value })} required minLength={10} rows={7} /></label><button className="button" disabled={Boolean(submitting)}>{submitting==="post"?"Publishing…":"Submit discussion"}</button><small>AI Administrator screens submissions. No sales, trades, personal contact details, or illegal activity.</small></form>
    </div> : <div className="communityLayout">
      <section><div className="sectionHead"><div><div className="eyebrow">Community consensus</div><h2>Top 25 cigars</h2><p>Ranked by average collector score, then number of ratings.</p></div></div><div className="rankingList">{data.top25.map(item => <article key={item.cigarKey}><strong>#{item.rank}</strong><div><h3>{item.brand} {item.line}</h3><span>{item.vitola}{item.vintage ? ` · ${item.vintage}` : ""}</span></div><b>{item.averageScore}</b><small>{item.ratingCount} rating{item.ratingCount === 1 ? "" : "s"}</small></article>)}</div>{!data.top25.length && <div className="emptyState">The Top 25 begins with the first collector rating.</div>}</section>
      <form className="communityForm" onSubmit={submitRating}><div className="eyebrow">Rate a cigar</div><h2>Add your score</h2><div className="ratingEntryMode" role="group" aria-label="Choose cigar entry method"><button type="button" className={entryMode === "vault" ? "active" : ""} disabled={!inventoryOptions.length} onClick={() => chooseMode("vault")}>Choose from my Vault</button><button type="button" className={entryMode === "manual" ? "active" : ""} onClick={() => chooseMode("manual")}>Enter manually</button></div><label>Display name<input value={rating.displayName} onChange={event => setRating({ ...rating, displayName: event.target.value })} required /></label>{identityFields}<label>Score (1–100)<input type="number" min="1" max="100" value={rating.score} onChange={event => setRating({ ...rating, score: event.target.value })} required /></label><label>Short review<textarea rows={4} value={rating.review} onChange={event => setRating({ ...rating, review: event.target.value })} /></label><button className="button" disabled={Boolean(submitting)}>{submitting==="rating"?"Publishing…":"Submit rating"}</button><small>{entryMode === "vault" ? "Cigar identity comes directly from your private Vault. Only the rating is shared." : "Use manual entry for a cigar that is not in your Vault."}</small></form>
    </div>}
  </>;
}
