"use client";

import { useMemo, useState } from "react";
import type { CatalogCigar } from "@/lib/types";
import { discoveryMatches, type DiscoveryGoal, type StrengthPreference } from "@/lib/discovery-guide";
import { canonicalCatalogHref } from "@/lib/canonical-cigar-record";

const goals: { value: DiscoveryGoal; title: string; body: string }[] = [
  { value: "Begin comfortably", title: "Build confidence", body: "Start with documented, approachable profiles and learn what to notice." },
  { value: "Expand my palate", title: "Leave the familiar", body: "Prioritize makers and leaf details beyond what is already in your vault." },
  { value: "Study origin and craft", title: "Follow the craft", body: "Explore factories, blenders, tobacco, and the people behind the cigar." },
  { value: "Find a collectible", title: "Find significance", body: "Look for documented editions, release years, packaging, and discontinued cigars." },
];
const strengths: StrengthPreference[] = ["Any strength", "Mild", "Medium", "Full"];
const sommHref = (cigar: CatalogCigar) => `/cigar-somm?${new URLSearchParams({ cigarName: `${cigar.brand} ${cigar.line} ${cigar.vitola}`, question: "Help me explore this cigar. Explain what is documented, what makes it distinct, likely strength and profile, the people and place behind it, and thoughtful coffee, spirit, cocktail, and nonalcoholic pairings. State uncertainty clearly." })}`;

export function GuidedCigarExplorer({ catalog, ownedBrands }: { catalog: CatalogCigar[]; ownedBrands: string[] }) {
  const [goal, setGoal] = useState<DiscoveryGoal>();
  const [strength, setStrength] = useState<StrengthPreference>("Any strength");
  const [origin, setOrigin] = useState("Any origin");
  const origins = useMemo(() => ["Any origin", ...new Set(catalog.map((cigar) => cigar.country).filter((value): value is string => Boolean(value)))].sort((a, b) => a === "Any origin" ? -1 : b === "Any origin" ? 1 : a.localeCompare(b)), [catalog]);
  const matches = useMemo(() => goal ? discoveryMatches(catalog, ownedBrands, { goal, strength, origin }) : [], [catalog, goal, origin, ownedBrands, strength]);

  return <section className="guidedExplorer section" id="guided-explorer">
    <div className="guidedExplorerIntro"><div><div className="eyebrow">Guided cigar exploration</div><h2>Let’s find a direction—not just a name.</h2></div><p>Choose what you want from the experience. Cedriva compares that intent with documented cigar identities and explains why each result belongs. This is independent guidance, never paid placement.</p></div>
    <div className="explorerProgress" aria-label="Exploration progress"><span className="active">1 · Intention</span><span className={goal ? "active" : ""}>2 · Preferences</span><span className={goal ? "active" : ""}>3 · Explore</span></div>
    <div className="explorerQuestion"><span>Step 1</span><h3>What would make this cigar meaningful?</h3><div className="explorerChoices goalChoices">{goals.map((item) => <button type="button" className={goal === item.value ? "selected" : ""} aria-pressed={goal === item.value} onClick={() => setGoal(item.value)} key={item.value}><strong>{item.title}</strong><small>{item.body}</small></button>)}</div></div>
    {goal && <div className="explorerQuestion preferenceQuestion"><span>Step 2</span><h3>Shape the direction.</h3><div className="explorerPreferences"><label><span>Preferred strength</span><select value={strength} onChange={(event) => setStrength(event.target.value as StrengthPreference)}>{strengths.map((value) => <option key={value}>{value}</option>)}</select><small>Manufacturer positioning when documented—not a guarantee of perceived strength.</small></label><label><span>Origin to explore</span><select value={origin} onChange={(event) => setOrigin(event.target.value)}>{origins.map((value) => <option key={value}>{value}</option>)}</select><small>Choose any origin for a broader comparison.</small></label></div></div>}
    {goal && <div className="explorerResults"><div className="sectionHead"><div><div className="eyebrow">Your exploration</div><h2>{matches.length ? `${matches.length} thoughtful places to begin` : "No documented match yet"}</h2><p className="small">These are starting points from Cedriva’s documented catalog. Open the record before deciding; source gaps remain visible.</p></div><button type="button" className="button secondary" onClick={() => { setGoal(undefined); setStrength("Any strength"); setOrigin("Any origin"); }}>Start over</button></div>
      {matches.length ? <div className="explorerMatchGrid">{matches.map(({ cigar, reasons }) => <article key={cigar.catalogId}><header><span>{cigar.country || "Origin under review"}</span>{cigar.strength && <b>{cigar.strength}</b>}</header><h3>{cigar.brand}</h3><strong>{cigar.line}</strong><p className="explorerVitola">{cigar.vitola}</p><div className="matchReasons">{reasons.map((reason) => <p key={reason}>✓ {reason}</p>)}</div><dl><div><dt>Wrapper</dt><dd>{cigar.wrapper || "Research pending"}</dd></div><div><dt>Factory</dt><dd>{cigar.factory || "Research pending"}</dd></div></dl><footer><a className="button" href={canonicalCatalogHref(cigar.catalogId)}>Explore its story</a><a className="textLink" href={sommHref(cigar)}>Ask Cigar Somm →</a></footer></article>)}</div> : <div className="emptyState">Cedriva does not yet have a sufficiently documented cigar for these preferences. Broaden the strength or origin, or explore the complete reference.</div>}
    </div>}
  </section>;
}
