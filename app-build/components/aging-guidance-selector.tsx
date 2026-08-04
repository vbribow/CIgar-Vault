"use client";

import { useState } from "react";
import { brand } from "@/lib/brand";

type GuidanceId = "new-world" | "habanos" | "mixed";

type GuidanceSource = {
  label: string;
  title: string;
  href: string;
  scope: string;
};

type Guidance = {
  id: GuidanceId;
  label: string;
  authority: string;
  temperature: string;
  humidity: string;
  summary: string;
  limitation: string;
  sources: GuidanceSource[];
};

const guidance: Guidance[] = [
  {
    id: "new-world",
    label: "New World",
    authority: "Published practical guidance",
    temperature: "65–70°F · 18–21°C",
    humidity: "65–69% RH",
    summary: "A conservative starting range for most premium cigars made outside Cuba. Stability and the cigar’s observed condition matter more than chasing one exact number.",
    limitation: "No single organization governs every New World producer. Follow documented maker guidance when it exists, and treat every aging timeline as blend-specific.",
    sources: [
      {
        label: "Commercial technical guidance · Boveda",
        title: "Stable aging conditions and the 65–69% RH range",
        href: "https://bovedainc.com/the-art-of-aging-cigars/",
        scope: `Supports the practical storage range. Boveda sells humidity-control products, so ${brand.name} discloses the commercial interest.`,
      },
      {
        label: "Official maker evidence · Perdomo",
        title: "Finished-cigar aging in controlled factory rooms",
        href: "https://www.perdomocigars.com/the-perdomo-way",
        scope: "Documents Perdomo’s six-to-eight-month factory aging process. It is maker-specific evidence, not a universal home-cellaring rule.",
      },
      {
        label: "Technical method · CORESTA",
        title: "Moisture equilibrium and cigar conditioning",
        href: "/learn/resting-and-aging/coresta-method",
        scope: "Explains controlled conditioning for laboratory testing. Its test atmosphere is not presented as a collector storage target.",
      },
    ],
  },
  {
    id: "habanos",
    label: "Habanos",
    authority: "Official Habanos standard",
    temperature: "61–64°F · 16–18°C",
    humidity: "65–70% RH",
    summary: "The official Habanos storage and finished-cigar aging range. Habanos emphasizes constant temperature and treats humidity as the most important variable.",
    limitation: "This standard applies to Habanos. It should not be silently extended to every cigar made in another country or under another producer’s process.",
    sources: [
      {
        label: "Official · Habanos",
        title: "Keeping Habanos and acclimatizing arrivals",
        href: "https://www.habanos.com/en/keeping-habanos/",
        scope: "Supports storage conditions, gradual acclimatization, and the risks of dryness, excess moisture, and beetles.",
      },
      {
        label: "Official · Habanos",
        title: "Ageing finished Habanos",
        href: "https://www.habanos.com/en/ageing-finished-cigars/",
        scope: "Supports the official temperature and humidity range for aging finished Habanos.",
      },
      {
        label: "Official · Habanos",
        title: "The five-year Vintage standard",
        href: "https://www.habanos.com/en/news/habanos-vintage-2/",
        scope: "Supports Habanos’ own Vintage classification. Five years is not a universal guarantee that every cigar improves.",
      },
    ],
  },
  {
    id: "mixed",
    label: "Mixed Collection",
    authority: `${brand.name} synthesis`,
    temperature: "Mid-to-upper 60s°F",
    humidity: "65–69% RH",
    summary: "A practical shared starting environment when Habanos and New World cigars must live together. It favors stability while avoiding the upper edge of either range.",
    limitation: "This is a transparent compromise, not an official manufacturer standard. Separate environments are preferable when serious long-term aging goals conflict.",
    sources: [
      {
        label: "Official standard · Habanos",
        title: "Habanos storage and aging conditions",
        href: "https://www.habanos.com/en/ageing-finished-cigars/",
        scope: "Defines one side of the compromise: the cooler official range for finished Habanos.",
      },
      {
        label: "Commercial technical guidance · Boveda",
        title: "New World practical aging range",
        href: "https://bovedainc.com/the-art-of-aging-cigars/",
        scope: "Defines the practical New World side of the compromise, with commercial influence disclosed.",
      },
      {
        label: `${brand.name} learning`,
        title: "Understand temperature and humidity together",
        href: "/learn/humidor-climate",
        scope: "Explains why the mixed profile is an inference and when separate storage may better protect a collection.",
      },
    ],
  },
];

export function AgingGuidanceSelector() {
  const [selectedId, setSelectedId] = useState<GuidanceId>("new-world");
  const selected = guidance.find((item) => item.id === selectedId) ?? guidance[0];

  return (
    <section className="agingGuidance" id="guidance">
      <header>
        <div>
          <div className="eyebrow">Choose the tradition you are storing</div>
          <h2>One tobacco family. Different published guidance.</h2>
        </div>
        <p>Select the profile that best matches the cigars in this environment. {brand.name} shows the source, its authority, and what it cannot prove.</p>
      </header>

      <div className="agingGuidanceTabs" role="tablist" aria-label="Aging guidance profile">
        {guidance.map((item) => (
          <button
            type="button"
            role="tab"
            aria-selected={selected.id === item.id}
            aria-controls={`aging-guidance-${item.id}`}
            id={`aging-guidance-tab-${item.id}`}
            key={item.id}
            onClick={() => setSelectedId(item.id)}
          >
            <strong>{item.label}</strong>
            <span>{item.authority}</span>
          </button>
        ))}
      </div>

      <div
        className="agingGuidancePanel"
        role="tabpanel"
        id={`aging-guidance-${selected.id}`}
        aria-labelledby={`aging-guidance-tab-${selected.id}`}
      >
        <div className="agingGuidanceStandard">
          <div>
            <span>Temperature</span>
            <strong>{selected.temperature}</strong>
          </div>
          <div>
            <span>Relative humidity</span>
            <strong>{selected.humidity}</strong>
          </div>
          <p>{selected.summary}</p>
          <small>{selected.limitation}</small>
        </div>

        <div className="agingGuidanceSources">
          <div className="eyebrow">Evidence shown for {selected.label}</div>
          {selected.sources.map((source) => (
            <a href={source.href} target={source.href.startsWith("http") ? "_blank" : undefined} rel={source.href.startsWith("http") ? "noreferrer" : undefined} key={source.href}>
              <span>{source.label}</span>
              <strong>{source.title} ↗</strong>
              <small>{source.scope}</small>
            </a>
          ))}
        </div>
      </div>

      <ul className="agingGuidanceRules">
        <li><strong>Track temperature and humidity together.</strong> Relative humidity changes with temperature.</li>
        <li><strong>Protect slowly.</strong> Correct dryness or excess moisture gradually; never shock the wrapper.</li>
        <li><strong>Retain identity.</strong> Boxes, bands, dates, receipts, and provenance make aging interpretable.</li>
        <li><strong>Sample, then decide.</strong> A planned tasting interval is more useful than a universal deadline.</li>
      </ul>
    </section>
  );
}
