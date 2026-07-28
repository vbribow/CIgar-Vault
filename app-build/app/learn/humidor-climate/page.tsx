import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/seo";
import { brand } from "@/lib/brand";
import "./humidor-climate.css";

export const metadata: Metadata = publicPageMetadata(
  "Humidor Temperature & Humidity",
  "Learn practical temperature and relative-humidity ranges for New World cigars and Habanos, how climate changes a cigar over time, and how to correct problems safely.",
  "/learn/humidor-climate",
);

const humidityBands = [
  ["Below 60% RH", "Drying risk", "Tobacco loses moisture, wrappers become brittle, and cigars may burn faster, hotter, and harsher. Prolonged severe dryness can permanently diminish aroma."],
  ["60–64% RH", "Dry side", "Some collectors prefer the easier combustion and firmer feel. The margin for a leaky humidor or winter heating is smaller, so watch the trend."],
  ["65–69% RH", "Balanced starting range", "A practical range for most premium cigars. It usually supports wrapper flexibility, dependable combustion, and long-term storage without pushing moisture unnecessarily high."],
  ["70–72% RH", "Moist side", "Some cigars and less-sealed wooden humidors may perform well here, but swelling, tight draws, repeated relights, and mold risk become more important to watch."],
  ["Above 72% RH", "Sustained-risk zone", "Do not panic over one brief reading. Repeated or prolonged exposure calls for inspection, sensor verification, and gradual correction."],
] as const;

const temperatureBands = [
  ["Below 60°F · 16°C", "Cool storage", "Not automatically damaging, but cold rooms and refrigeration can make moisture control difficult. Moving a cold cigar into warm, humid air can also create condensation."],
  ["61–64°F · 16–18°C", "Official Habanos range", "Habanos publishes this temperature range with 65–70% RH for storage and aging. It is cooler than the familiar 70/70 rule."],
  ["65–70°F · 18–21°C", "Practical New World range", "A conservative starting window for most non-Cuban premium cigars. Boveda publishes this range for aging, paired with 65–69% RH."],
  ["Above 70°F · 21°C", "Watch duration and humidity", "Warmth increases biological activity. Cigarette beetles develop well in warm, humid environments, so repeated heat deserves attention—especially when RH is also high."],
  ["Above 75°F · 24°C", "Act on a sustained trend", "Verify the sensor, move the humidor away from heat and sunlight, and lower the room temperature. Do not shock the cigars with a refrigerator or abrupt climate change."],
] as const;

const timeEffects = [
  ["Minutes to hours", "A door opening, a new box, or the HVAC cycling can move the reading. The cigar’s center changes more slowly than the air. Close the humidor and watch recovery before intervening."],
  ["One to three days", "A persistent drift may reveal a failing seal, exhausted humidification, a poor sensor location, direct sunlight, or a room-temperature problem."],
  ["Weeks", "Tobacco begins equilibrating with the environment. Dry conditions can produce brittle wrappers and fast combustion; excessive moisture can produce swelling, difficult draws, and repeated relights."],
  ["Months to years", "Stable conditions make aging interpretable. Repeated swings stress wrappers and make flavor development, combustion, and condition less predictable."],
] as const;

const climateCombinations = [
  ["Warm + humid", "Highest concern", "Inspect promptly for musty aroma, fuzzy growth, swelling, and beetle holes. Reduce room heat first and correct humidity gradually."],
  ["Warm + dry", "Fast moisture loss", "Wrappers can become fragile while the cigar burns hot and quickly. Improve the seal and climate without flooding the humidor with moisture."],
  ["Cool + humid", "Misleading comfort", "A high RH reading is still high RH. Avoid cold exterior walls and rapid warming that can create surface condensation."],
  ["Cool + dry", "Slow dehydration", "The damage may be less obvious day to day, but long exposure can still flatten aroma and weaken wrappers."],
] as const;

export default function HumidorClimatePage() {
  return (
    <main className="shell climateLesson">
      <section className="climateLessonHero">
        <div>
          <div className="eyebrow">{brand.name} Learn · Collection Care</div>
          <h1>Climate is not a number. It is a pattern.</h1>
          <p className="lede">
            Temperature and relative humidity work together. The goal is not
            to force every cigar to 70/70—it is to create a stable environment
            that protects construction, combustion, aroma, and the story you
            are preserving.
          </p>
          <div className="ctaRow">
            <a className="button" href="#starting-ranges">Choose a starting range</a>
            <a className="button secondary" href="#diagnose">Diagnose a reading</a>
          </div>
        </div>
        <aside>
          <span>The collector’s rule</span>
          <strong>Trend before reaction.</strong>
          <p>One reading is a moment. Repeated readings reveal the environment your cigars are actually experiencing.</p>
        </aside>
      </section>

      <section className="rangeStandard" id="starting-ranges">
        <header>
          <div><div className="eyebrow">Useful starting points</div><h2>“Perfect” depends on the cigar and the purpose.</h2></div>
          <p>These ranges begin the decision; they do not replace manufacturer guidance, a calibrated sensor, or your experience at the match.</p>
        </header>
        <div className="rangeCards">
          <article>
            <span>Most New World cigars</span>
            <strong>65–70°F</strong>
            <b>65–69% RH</b>
            <p>A conservative storage and aging starting point for cigars made outside Cuba. Individual manufacturers, blends, containers, and collector preferences may differ.</p>
            <small>Published aging guidance · Boveda</small>
          </article>
          <article>
            <span>Habanos</span>
            <strong>61–64°F</strong>
            <b>65–70% RH</b>
            <p>This is the official Habanos storage and aging range. Habanos emphasizes constant temperature and identifies humidity as the most crucial variable.</p>
            <small>Official standard · Habanos, S.A.</small>
          </article>
          <article>
            <span>Mixed collection</span>
            <strong>Mid-to-upper 60s°F</strong>
            <b>65–69% RH</b>
            <p>A practical {brand.name} starting compromise when one humidor contains both groups—not an official Habanos specification. Serious long-term collectors may choose separate environments.</p>
            <small>{brand.name} guidance · clearly identified inference</small>
          </article>
        </div>
        <blockquote>
          Stability inside a thoughtful range is usually safer than repeatedly
          chasing a perfect-looking number.
        </blockquote>
      </section>

      <section className="climateScience">
        <div>
          <div className="eyebrow">Understand the reading</div>
          <h2>Relative humidity is relative to temperature.</h2>
          <p>RH describes how saturated the air is at its current temperature; it is not a direct reading of water inside the cigar. If air warms without gaining moisture, RH tends to fall. If it cools without losing moisture, RH tends to rise. Tobacco, wood, humidification media, airflow, and the seal all buffer that movement over time.</p>
        </div>
        <div className="scienceRules">
          <article><span>01</span><strong>Measure both</strong><p>A humidity number without temperature and time can be misleading.</p></article>
          <article><span>02</span><strong>Calibrate</strong><p>Compare or calibrate hygrometers before making a collection-wide correction.</p></article>
          <article><span>03</span><strong>Place wisely</strong><p>Keep sensors away from direct contact with a humidifier, cooling vent, door, or exterior wall.</p></article>
          <article><span>04</span><strong>Follow recovery</strong><p>After opening the humidor, judge how smoothly it returns to range—not the temporary spike.</p></article>
        </div>
      </section>

      <section className="climateBands">
        <header><div className="eyebrow">Humidity and the smoking experience</div><h2>What RH can do over time.</h2></header>
        <div>{humidityBands.map(([range, title, body]) => <article key={range}><span>{range}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div>
      </section>

      <section className="climateBands temperatureBands">
        <header><div className="eyebrow">Temperature and collection risk</div><h2>Heat changes the risk—not just the reading.</h2></header>
        <div>{temperatureBands.map(([range, title, body]) => <article key={range}><span>{range}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div>
      </section>

      <section className="timeSection">
        <div><div className="eyebrow">Duration changes the meaning</div><h2>A spike is not a season.</h2><p>Severity, duration, repetition, and cigar condition determine the response. {brand.name} should help collectors see trends rather than manufacture panic.</p></div>
        <div className="timeEffects">{timeEffects.map(([time, body]) => <article key={time}><span>{time}</span><p>{body}</p></article>)}</div>
      </section>

      <section className="combinationSection" id="diagnose">
        <header><div className="eyebrow">Read temperature and RH together</div><h2>Four climates. Four different problems.</h2></header>
        <div>{climateCombinations.map(([climate, title, body]) => <article key={climate}><span>{climate}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>

      <section className="correctionProtocol">
        <div><div className="eyebrow">When a reading is outside range</div><h2>Correct the cause, not just the display.</h2></div>
        <ol>
          <li><b>01</b><div><strong>Confirm</strong><p>Check a second calibrated sensor and determine whether the reading is brief, repeated, or sustained.</p></div></li>
          <li><b>02</b><div><strong>Inspect</strong><p>Look, smell, and gently feel for dryness, swelling, cracks, mustiness, fuzzy growth, or round beetle exit holes.</p></div></li>
          <li><b>03</b><div><strong>Find the cause</strong><p>Check the room, sunlight, seal, humidification media, airflow, sensor position, and recent additions.</p></div></li>
          <li><b>04</b><div><strong>Adjust gradually</strong><p>Move the environment toward the target without soaking dry cigars, refrigerating warm cigars, or making repeated large corrections.</p></div></li>
          <li><b>05</b><div><strong>Document recovery</strong><p>Watch the trend for several days and record what changed. A stable recovery teaches more than an isolated number.</p></div></li>
        </ol>
      </section>

      <section className="climateMyths">
        <div><div className="eyebrow">Rules worth retiring</div><h2>Replace folklore with observation.</h2></div>
        <div>
          <article><strong>“Every cigar belongs at 70/70.”</strong><p>No. It is a familiar shorthand, not a universal law. Habanos itself publishes a cooler temperature range.</p></article>
          <article><strong>“Higher RH keeps cigars fresher.”</strong><p>More moisture is not automatically better. Excess moisture can hurt draw and combustion and increase mold risk.</p></article>
          <article><strong>“One bad reading ruined the box.”</strong><p>Usually not. Confirm the measurement, inspect the cigars, and evaluate duration before reacting.</p></article>
          <article><strong>“A humidor ages cigars by itself.”</strong><p>A box is only the enclosure. Stable climate, time, identity, and periodic tasting make aging meaningful.</p></article>
        </div>
      </section>

      <section className="climateSources">
        <div><div className="eyebrow">Evidence behind the guidance</div><h2>Know whose standard you are following.</h2></div>
        <div>
          <a href="https://www.habanos.com/en/keeping-habanos/" target="_blank" rel="noreferrer"><span>Official · Habanos</span><strong>Storage conditions, acclimatization, dryness, excess moisture, and beetles ↗</strong></a>
          <a href="https://www.habanos.com/en/ageing-finished-cigars/" target="_blank" rel="noreferrer"><span>Official · Habanos</span><strong>Temperature and humidity for aging finished Habanos ↗</strong></a>
          <a href="https://bovedainc.com/the-art-of-aging-cigars/" target="_blank" rel="noreferrer"><span>Manufacturer guidance · Boveda</span><strong>65–70°F and 65–69% RH aging guidance ↗</strong></a>
          <a href="https://bovedainc.com/question/what-boveda-rh-do-i-need/" target="_blank" rel="noreferrer"><span>Manufacturer guidance · Boveda</span><strong>How storage type and smoking preference affect RH selection ↗</strong></a>
          <a href="https://urbanentomology.tamu.edu/stored-product-pests/cigarette-beetles/" target="_blank" rel="noreferrer"><span>Academic extension · Texas A&amp;M</span><strong>Temperature, humidity, and cigarette-beetle development ↗</strong></a>
        </div>
        <small>This educational material is intended only for adults of legal age. Suggested ranges are starting guidance, not guarantees of condition, flavor, safety, or value.</small>
      </section>

      <section className="climateLessonClosing">
        <div><div className="eyebrow">Put the lesson to work</div><h2>Protect the trend. Preserve the cigar.</h2></div>
        <div><p>Set a range that matches the collection, record temperature and humidity together, and let {brand.name} show whether the environment is truly stable over time.</p><div className="ctaRow"><a className="button" href="/humidors">Review my humidors</a><a className="button secondary" href="/sensors">Connect climate readings</a><a className="button secondary" href="/learn/resting-and-aging">Continue to resting and aging</a></div></div>
      </section>
    </main>
  );
}
