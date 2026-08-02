import type { Metadata } from "next";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Tasting vocabulary and calibration | ${brand.name}`,
  description: "A guided method for recording cigar descriptors, intensity, sequence, conditions, confidence, preference, and quality without false objectivity.",
};

const recordLayers = [
  ["Observation", "Sense or sensation group, descriptor, intensity under an anchored scale, and confidence such as tentative, clear, or repeated."],
  ["Sequence", "When the observation appeared, peaked, faded, or returned—without forcing every cigar into identical thirds."],
  ["Conditions", "Exact cigar, storage and rest, cut, light, pace, environment, food, drink, competing aromas, and observer condition."],
  ["Judgment", "Preference, construction, balance, and overall quality recorded separately from descriptor intensity."],
  ["Comparison", "What was concealed in a blind comparison, sample order, references used, earlier notes preserved, and identity reveal time."],
] as const;

export default function TastingVocabularyCalibrationPage() {
  return <main className="shell learnPage">
      <nav className="nav"><a className="brand" href="/">{brand.name}</a><div className="navLinks"><a href="/learn">Learn</a><a href="/records">Tasting records</a><a href="/cigar-somm">Cigar Somm</a></div></nav>
    <section className="learnHero"><div><div className="eyebrow">Sensory practice</div><h1>Describe what you notice. Preserve how you noticed it.</h1><p className="lede">A tasting note is a structured personal observation—not a performance or universal product truth. Define the vocabulary, conditions, intensity, sequence, and uncertainty so the note remains useful later.</p><div className="ctaRow"><a className="button" href="/records">Begin a tasting record</a><a className="button secondary" href="/learn/cigar-strength-body-nicotine">Review strength and body</a></div></div><aside><span>The collector rule</span><blockquote>A descriptor records resemblance in perception—not an added ingredient.</blockquote><small>“Cocoa or roasted coffee, tentative” can be more valuable than forced certainty.</small></aside></section>
    <section className="section"><div className="sectionHead"><div><div className="eyebrow">Private record method</div><h2>Make every observation traceable.</h2><p>Repeatable language grows through defined scales, references, preserved earlier notes, and honest differences—not through copying another reviewer’s vocabulary.</p></div></div><div className="learningPathways">{recordLayers.map(([title,body],index)=><article key={title}><span>{String(index+1).padStart(2,"0")}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>
    <section className="section card"><div className="eyebrow">Calibration boundary</div><h2>Train language without increasing exposure.</h2><p>Use safe aroma references, consistent definitions, familiar comparisons, and thoughtful pacing. Never inhale more deeply, continue through discomfort, or increase tobacco use for sensory practice.</p></section>
  </main>;
}
