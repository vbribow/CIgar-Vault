"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type EvidenceState = "Official result recorded" | "Partially supported" | "Conflicting" | "Tool unavailable" | "Unresolved";

const steps = [
  ["Identity", "Document what the object claims to be"],
  ["Acquisition", "Preserve the offer and transaction context"],
  ["Package", "Connect photographs, codes, and seals"],
  ["Official check", "Record the dated producer-tool result"],
  ["Conclusion", "Say only what the records support"],
  ["Export", "Carry the record forward without exposing private data"],
] as const;

const initialEvidence = {
  listing: true,
  receipt: true,
  box: true,
  seal: true,
  code: false,
};

export function CollectorWalkthrough() {
  const [step, setStep] = useState(0);
  const [evidence, setEvidence] = useState(initialEvidence);
  const [result, setResult] = useState<EvidenceState>("Unresolved");
  const [exported, setExported] = useState(false);
  const stageHeading = useRef<HTMLHeadingElement>(null);
  const focusStageAfterChange = useRef(false);
  const evidenceCount = Object.values(evidence).filter(Boolean).length;
  const progress = Math.round(((step + 1) / steps.length) * 100);

  useEffect(() => {
    if (!focusStageAfterChange.current) return;
    stageHeading.current?.focus({ preventScroll: true });
    stageHeading.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }, [step]);

  function goToStep(nextStep: number) {
    focusStageAfterChange.current = true;
    setStep(Math.max(0, Math.min(steps.length - 1, nextStep)));
  }

  function restartWalkthrough() {
    setEvidence(initialEvidence);
    setResult("Unresolved");
    setExported(false);
    goToStep(0);
  }

  const record = useMemo(() => ({
    recordType: "Hojavía synthetic collector walkthrough",
    synthetic: true,
    savedToAccount: false,
    identity: {
      representedBrand: "Montecristo",
      representedLine: "No. 2",
      vitola: "Pirámide",
      packaging: "Synthetic box of 25",
    },
    acquisition: {
      seller: "Synthetic authorized-retail example",
      date: "2026-07-31",
      jurisdiction: "Illustrative non-U.S. market",
      representation: "Seller represented the sealed box as genuine Habanos.",
    },
    packageEvidence: {
      listingPreserved: evidence.listing,
      receiptPreserved: evidence.receipt,
      boxPhotographsPreserved: evidence.box,
      sealPhotographPreserved: evidence.seal,
      boxCodePhotographPreserved: evidence.code,
      representedBoxCode: "SYN DIC 22 — synthetic identifier, not valid for lookup",
    },
    officialCheck: {
      destination: "Habanos official authenticity tool",
      date: "2026-07-31",
      state: result,
      note: "This walkthrough never submits the synthetic identifier to an external service.",
    },
    conclusion: {
      evidenceState: result,
      authenticationClaim: false,
      caution: "The record preserves evidence. It does not authenticate the cigars, seller, custody, condition, or legality.",
    },
    privacy: {
      public: ["educational method", "official source links", "evidence-state definitions"],
      private: ["price", "payment details", "address", "tracking", "correspondence", "ownership and storage location"],
    },
  }), [evidence, result]);

  function downloadRecord() {
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "hojavia-synthetic-evidence-record.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setExported(true);
  }

  return <div className="walkthroughShell">
    <aside className="walkthroughNotice" role="note">
      <strong>Synthetic demonstration only</strong>
      <span>No real collector, seller, payment, location, identifier, photograph, or account record is used or saved.</span>
    </aside>

    <div className="walkthroughProgress" role="progressbar" aria-label="Walkthrough position" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-valuetext={`Stage ${step + 1} of ${steps.length}`}>
      <div><span>Stage {step + 1} of {steps.length}</span><strong>{progress}%</strong></div>
      <i style={{ width: `${progress}%` }} />
    </div>

    <nav className="walkthroughSteps" aria-label="Collector walkthrough steps">
      {steps.map(([title], index) => <button type="button" key={title} className={index === step ? "active" : index < step ? "complete" : undefined} onClick={() => goToStep(index)} aria-current={index === step ? "step" : undefined}><span>{String(index + 1).padStart(2, "0")}</span><strong>{title}</strong></button>)}
    </nav>

    <section className="walkthroughStage" aria-live="polite">
      <header><span>{steps[step][0]}</span><h2 ref={stageHeading} tabIndex={-1}>{steps[step][1]}</h2></header>

      {step === 0 && <div className="walkthroughRecordGrid">
        <article><span>Represented brand</span><strong>Montecristo</strong><small>Seller or package representation—not independently proven.</small></article>
        <article><span>Represented line</span><strong>No. 2</strong><small>Commercial identity recorded as observed.</small></article>
        <article><span>Vitola</span><strong>Pirámide</strong><small>Shape and dimensions remain separate evidence.</small></article>
        <article><span>Packaging</span><strong>Synthetic box of 25</strong><small>No actual box or cigar is involved.</small></article>
      </div>}

      {step === 1 && <div className="walkthroughAcquisition">
        <p className="walkthroughStageIntro">This step records how the cigar was offered and acquired. In a real collector record, you would preserve the seller, purchase location, receipt, and the seller’s exact claim so you can evaluate the source later.</p>
        <dl><div><dt>Seller</dt><dd>Example authorized retailer (synthetic)</dd></div><div><dt>Retailer check</dt><dd>Seller status checked in the producer’s official directory</dd></div><div><dt>Purchase location</dt><dd>Example purchase outside the United States</dd></div><div><dt>What the seller claimed</dt><dd>“Seller described the sealed box as genuine Habanos.”</dd></div></dl>
        <div className="walkthroughCaution"><strong>Why record each detail?</strong><span>A listed retailer, a lawful purchase, matching packaging, documented ownership history, and good condition are separate checks. One positive sign does not prove all the others.</span></div>
      </div>}

      {step === 2 && <fieldset className="walkthroughEvidence">
        <legend>Choose the synthetic evidence preserved with this example</legend>
        {([
          ["listing", "Original listing", "Preserves what was offered before the page changes"],
          ["receipt", "Dated receipt", "Connects the represented seller and transaction date"],
          ["box", "Complete box photographs", "Shows every side without relying on one famous feature"],
          ["seal", "Warranty-seal photograph", "Records the visible seal and barcode area"],
          ["code", "Box-code photograph", "Connects the recorded code to this package"],
        ] as const).map(([key, title, copy]) => <label key={key}><input type="checkbox" checked={evidence[key]} onChange={(event) => setEvidence({ ...evidence, [key]: event.target.checked })}/><span><strong>{title}</strong><small>{copy}</small></span></label>)}
        <output>{evidenceCount} of 5 synthetic evidence items preserved</output>
      </fieldset>}

      {step === 3 && <div className="walkthroughOfficial">
        <div><span>Official destination</span><strong>Habanos authenticity tool</strong><small>This walkthrough does not send its synthetic identifier to the producer.</small></div>
        <label>Choose the recorded tool state<select value={result} onChange={(event) => setResult(event.target.value as EvidenceState)}>{(["Official result recorded", "Partially supported", "Conflicting", "Tool unavailable", "Unresolved"] as EvidenceState[]).map(state => <option key={state}>{state}</option>)}</select></label>
        <p className="walkthroughCaution">Even “Official result recorded” means only that a dated producer-tool response was preserved. It is not a complete authentication.</p>
      </div>}

      {step === 4 && <div className="walkthroughConclusion">
        <div><span>What the records support</span><strong>{result}</strong><small>{evidenceCount} of 5 package and acquisition items connected</small></div>
        <div><span>Authentication claim</span><strong>Not made</strong><small>The conclusion remains narrower than the evidence.</small></div>
        <div><span>Collector action</span><strong>{result === "Official result recorded" && evidenceCount === 5 ? "Preserve and monitor" : "Keep open for review"}</strong><small>Unresolved or conflicting evidence never becomes an invented answer.</small></div>
      </div>}

      {step === 5 && <div className="walkthroughExport">
        <div><span>Portable sample record</span><strong>JSON · synthetic · no account data</strong><p>The export includes identity, acquisition context, evidence presence, tool state, conclusion boundary, and public/private classifications.</p><button type="button" className="button" onClick={downloadRecord}>Download synthetic record</button>{exported && <output>Sample downloaded. Nothing was added to your account.</output>}</div>
        <pre aria-label="Synthetic record preview">{JSON.stringify(record.conclusion, null, 2)}</pre>
      </div>}

      <footer><button type="button" className="button secondary" disabled={step === 0} onClick={() => goToStep(step - 1)}>← Previous</button>{step < steps.length - 1 ? <button type="button" className="button" onClick={() => goToStep(step + 1)}>Continue →</button> : <div className="walkthroughFinishActions"><button type="button" className="button secondary" onClick={restartWalkthrough}>Restart walkthrough</button><a className="button secondary" href="/verification">Return to my evidence ledger</a></div>}</footer>
    </section>
  </div>;
}
