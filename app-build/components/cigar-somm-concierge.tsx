"use client";

import { useMemo, useState } from "react";
import type { InventoryItem, SmokingLog } from "@/lib/types";
import { buildConciergeCandidates, recommendForTime, recommendGuestFlight, type ConciergeCandidate } from "@/lib/cigar-somm-concierge";

type Path = "now" | "guests" | "compare" | "time" | "";
const identity = (candidate: ConciergeCandidate) => `${candidate.item.brand} ${candidate.item.line} · ${candidate.item.vitola}${candidate.item.vintage ? ` · ${candidate.item.vintage}` : ""}`;

export function CigarSommConcierge({ inventory, smokes }: { inventory: InventoryItem[]; smokes: SmokingLog[] }) {
  const candidates = useMemo(() => buildConciergeCandidates(inventory, smokes), [inventory, smokes]);
  const [path, setPath] = useState<Path>("");
  const [minutes, setMinutes] = useState(60);
  const [guests, setGuests] = useState(2);
  const [firstId, setFirstId] = useState("");
  const [secondId, setSecondId] = useState("");
  const timed = useMemo(() => recommendForTime(candidates, minutes), [candidates, minutes]);
  const flight = useMemo(() => recommendGuestFlight(candidates, guests), [candidates, guests]);
  const first = candidates.find((candidate) => candidate.item.inventoryId === firstId);
  const second = candidates.find((candidate) => candidate.item.inventoryId === secondId);

  return <section className="sommConcierge" aria-labelledby="somm-concierge-title">
    <header><div><div className="eyebrow">Private Vault concierge · no AI research charge</div><h2 id="somm-concierge-title">Start with the decision you need to make.</h2><p>These quick paths use only the inventory and smoking history already loaded in your private session. No Vault notes are sent to an outside research service.</p></div></header>
    <div className="sommConciergePaths">
      <button type="button" aria-pressed={path === "now"} onClick={() => setPath("now")}><strong>What should I smoke now?</strong><span>Match your available time to cigars you own.</span></button>
      <button type="button" aria-pressed={path === "guests"} onClick={() => setPath("guests")}><strong>Plan for guests or a flight</strong><span>Favor sufficient quantities and protect collection pieces.</span></button>
      <button type="button" aria-pressed={path === "compare"} onClick={() => setPath("compare")}><strong>Compare two cigars</strong><span>See exact-lot history and differences side by side.</span></button>
      <button type="button" aria-pressed={path === "time"} onClick={() => setPath("time")}><strong>Choose by available time</strong><span>Find a practical vitola for the time you have.</span></button>
    </div>
    {(path === "now" || path === "time") && <div className="sommConciergeWorkspace"><label><span>How much time do you have?</span><select value={minutes} onChange={(event) => setMinutes(Number(event.target.value))}><option value="30">About 30 minutes</option><option value="45">About 45 minutes</option><option value="60">About 1 hour</option><option value="90">About 90 minutes</option><option value="120">2 hours or more</option></select></label><CandidateList candidates={timed} empty="No available Vault cigar fits that planning window yet." /></div>}
    {path === "guests" && <div className="sommConciergeWorkspace"><label><span>How many people are smoking?</span><input type="number" min="1" max="20" value={guests} onChange={(event) => setGuests(Math.max(1, Number(event.target.value) || 1))}/></label><p className="small">Hojavía first favors standalone lots with enough cigars for the group. One-of-one collection pieces are not recommended automatically.</p><CandidateList candidates={flight} empty="No standalone lot has enough available cigars. Choose individual cigars manually before using a collection component." /></div>}
    {path === "compare" && <div className="sommConciergeWorkspace"><div className="sommCompareSelectors"><label><span>First cigar</span><select value={firstId} onChange={(event) => setFirstId(event.target.value)}><option value="">Choose from your Vault</option>{candidates.map((candidate) => <option value={candidate.item.inventoryId} key={candidate.item.inventoryId}>{identity(candidate)}</option>)}</select></label><label><span>Second cigar</span><select value={secondId} onChange={(event) => setSecondId(event.target.value)}><option value="">Choose a different cigar</option>{candidates.filter((candidate) => candidate.item.inventoryId !== firstId).map((candidate) => <option value={candidate.item.inventoryId} key={candidate.item.inventoryId}>{identity(candidate)}</option>)}</select></label></div>{first && second ? <div className="sommComparison"><CandidateCard candidate={first}/><CandidateCard candidate={second}/></div> : <p className="emptyState">Choose two different available cigars for an evidence-led comparison.</p>}</div>}
  </section>;
}
function CandidateList({ candidates, empty }: { candidates: ConciergeCandidate[]; empty: string }) {
  return candidates.length ? <div className="sommConciergeResults">{candidates.map((candidate, index) => <CandidateCard candidate={candidate} rank={index + 1} key={candidate.item.inventoryId}/>)}</div> : <p className="emptyState">{empty}</p>;
}

function CandidateCard({ candidate, rank }: { candidate: ConciergeCandidate; rank?: number }) {
  return <article><span>{rank ? rank === 1 ? "Best-supported fit" : `Option ${rank}` : "Exact Vault record"}</span><strong>{identity(candidate)}</strong><small>{candidate.item.currentQty ?? 0} available{candidate.item.collectionId ? " · collection component" : " · standalone lot"}</small><dl><div><dt>Your score</dt><dd>{candidate.averageScore === undefined ? "Not yet rated" : `${candidate.averageScore.toFixed(1)} from ${candidate.experienceCount || "record"}${candidate.experienceCount === 1 ? " experience" : candidate.experienceCount ? " experiences" : ""}`}</dd></div><div><dt>Strength</dt><dd>{candidate.strength ?? "Not yet recorded"}</dd></div><div><dt>Common flavor</dt><dd>{candidate.flavor ?? "Not yet recorded"}</dd></div><div><dt>Planning time</dt><dd>About {candidate.estimatedMinutes} minutes <small>{candidate.durationBasis}</small></dd></div></dl><a href={`/inventory/${encodeURIComponent(candidate.item.inventoryId)}`}>Open cigar record →</a></article>;
}
