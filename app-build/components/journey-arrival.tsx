"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const stages={
  curious:["The Curious","A welcoming place to build confidence and learn the essentials."],
  explorer:["The Explorer","A focused place to remember experiences and discover personal preferences."],
  enthusiast:["The Enthusiast","Practical tools for building and caring for a collection with intention."],
  collector:["The Collector","Advanced stewardship, evidence, value, and protection for a serious collection."],
  connoisseur:["The Connoisseur","A place to contribute experience and help other collectors grow."],
  legacy:["The Legacy Collector","A private record for preserving chronology, provenance, meaning, and continuity."],
} as const;

export function JourneyArrival(){
  const id=useSearchParams().get("journey") as keyof typeof stages|null;
  const stage=id?stages[id]:undefined;
  if(!stage)return null;
  return <aside className="journeyArrival"><div><span>Your Cedriva journey</span><strong>{stage[0]}</strong><small>{stage[1]}</small></div><Link href="/#collector-journey-heading">Change journey</Link></aside>;
}
