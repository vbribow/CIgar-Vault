import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cigar Foundations",
  description: "A welcoming, plain-language introduction to choosing, preparing, enjoying, and caring for a first premium cigar.",
};

const lessons = [
  {
    number: "01",
    title: "Choose with confidence",
    promise: "Find a comfortable first cigar without memorizing brands.",
    points: [
      ["Start with time", "Choose a smaller cigar when you have 30–45 minutes and a larger one only when you can be unhurried."],
      ["Ask for approachable strength", "Tell a tobacconist you are new and want mild-to-medium nicotine strength. Strength and flavor are not the same thing."],
      ["Buy one or two", "Your first purchase is an experiment, not a commitment to a box."],
    ],
  },
  {
    number: "02",
    title: "Know what you are holding",
    promise: "Learn five words that make the rest easier.",
    points: [
      ["Wrapper", "The outer leaf. It contributes to appearance and flavor, but it does not tell the whole story."],
      ["Binder and filler", "Leaves beneath the wrapper that provide structure, combustion, body, and much of the blend’s character."],
      ["Vitola", "The cigar’s size and shape. It can change how a blend feels and develops."],
      ["Head and foot", "The head goes in your mouth; the open foot is the end you light."],
      ["Body and strength", "Body describes flavor weight and texture. Strength describes nicotine impact."],
    ],
  },
  {
    number: "03",
    title: "Cut only what you need",
    promise: "Create an open draw without damaging the cigar.",
    points: [
      ["Find the cap", "Look for the small circular leaf at the head of the cigar."],
      ["Use a sharp cutter", "A straight cut is the simplest place to begin."],
      ["Take a little", "Remove only the cap above the shoulder. Cutting too deeply can unravel the wrapper."],
    ],
  },
  {
    number: "04",
    title: "Light patiently",
    promise: "Build an even ember without scorching the tobacco.",
    points: [
      ["Toast the foot", "Hold the flame just off the tobacco and rotate the cigar until the edge begins to glow."],
      ["Finish gently", "Take slow draws while continuing to rotate. Avoid burying the foot in the flame."],
      ["Check the burn", "A small correction is normal. Constant touching-up usually means you are smoking too quickly or the cigar needs attention."],
    ],
  },
  {
    number: "05",
    title: "Slow down and notice",
    promise: "Enjoy the cigar without turning it into a test.",
    points: [
      ["Sip, do not inhale", "Premium cigar smoke is tasted in the mouth and released. It is not inhaled."],
      ["Pause between draws", "Roughly a draw every minute is a useful starting rhythm. If it becomes hot or bitter, rest it longer."],
      ["Notice simple changes", "Start with broad impressions: creamy or dry, sweet or earthy, gentle or peppery. Your words are valid."],
      ["Let it end naturally", "Place the cigar in the ashtray when finished. It will go out on its own."],
    ],
  },
  {
    number: "06",
    title: "Store what remains",
    promise: "Keep a few cigars healthy without buying a cabinet.",
    points: [
      ["Use a sealed container", "A clean airtight food-safe container with a purpose-made humidity pack is enough for a small starter collection."],
      ["Aim for stability", "Avoid heat, sunlight, refrigerators, and frequent swings. Stable conditions matter more than chasing a perfect number."],
      ["Separate strong odors", "Tobacco absorbs surrounding aromas. Keep cigars away from food, cleaners, and scented materials."],
    ],
  },
] as const;

const firstVisit = [
  "Tell the tobacconist you are new—there is no knowledge test.",
  "Share how much time you have and whether you prefer gentler or fuller experiences.",
  "Ask them to show you the head, foot, and cap before you leave.",
  "Choose one or two cigars and a simple straight cutter.",
  "Ask where you may legally and comfortably enjoy them.",
] as const;

export default function FoundationsPage() {
  return <main className="shell foundationsPage">
    <section className="foundationsHero">
      <div>
        <div className="eyebrow">Cedriva Foundations · The Curious</div>
        <h1>Your first cigar should feel welcoming.</h1>
        <p className="lede">No posturing. No vocabulary test. Learn only what helps you choose thoughtfully, enjoy comfortably, and ask your next question with confidence.</p>
        <div className="ctaRow"><a className="button" href="#lesson-1">Start the first lesson</a><a className="button secondary" href="#first-visit">Prepare for a shop visit</a></div>
      </div>
      <aside><span>Your starting point</span><strong>6 short lessons</strong><small>About 15 minutes to build the foundations. Return whenever you need a reminder.</small></aside>
    </section>

    <section className="foundationPromise">
      <div><span>Remember</span><strong>You do not need to identify every flavor.</strong></div>
      <div><span>Remember</span><strong>Expensive does not automatically mean better for you.</strong></div>
      <div><span>Remember</span><strong>Questions are part of the culture.</strong></div>
    </section>

    <section className="foundationLessons" aria-label="Beginner cigar lessons">
      {lessons.map((lesson, index) => <article id={`lesson-${index + 1}`} key={lesson.number}>
        <header><span>{lesson.number}</span><div><small>Foundation lesson</small><h2>{lesson.title}</h2><p>{lesson.promise}</p></div></header>
        <div>{lesson.points.map(([title, explanation]) => <section key={title}><strong>{title}</strong><p>{explanation}</p></section>)}</div>
        {index < lessons.length - 1 && <a href={`#lesson-${index + 2}`}>Continue to lesson {index + 2} ↓</a>}
      </article>)}
    </section>

    <section className="firstVisit" id="first-visit">
      <div><div className="eyebrow">Your first tobacconist visit</div><h2>A simple five-step plan.</h2><p>A good tobacconist wants to help you find a comfortable starting point—not prove how much they know.</p></div>
      <ol>{firstVisit.map(item => <li key={item}>{item}</li>)}</ol>
    </section>

    <section className="foundationNext">
      <div><div className="eyebrow">You have the foundations</div><h2>Curiosity is the next lesson.</h2><p>Explore documented cigars when you feel ready, or ask Cedriva AI a plain-language question without embarrassment.</p></div>
      <div><Link className="button" href="/catalog">Explore the cigar reference</Link><Link className="button secondary" href="/cigar-somm">Ask Cedriva AI</Link><Link className="textLink" href="/learn">Return to all learning pathways →</Link></div>
    </section>

    <p className="foundationsDisclosure">Premium cigars contain tobacco and nicotine and are intended only for adults of legal age. Cedriva provides cultural and educational information, not medical advice.</p>
  </main>;
}
