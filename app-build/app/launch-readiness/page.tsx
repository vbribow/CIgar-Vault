import { launchBaseline, launchGates, launchReadinessSummary } from "@/lib/launch-readiness";
import { immediateIncidentActions, incidentSeverityStandard } from "@/lib/incident-response";
import { currentStabilityCandidate, launchStabilityObservations } from "@/data/launch-stability";
import { assessStabilityWindow } from "@/lib/stability-window";
import "./launch-readiness.css";

export const dynamic = "force-dynamic";

export default function LaunchReadinessPage() {
  const summary = launchReadinessSummary();
  const stability = assessStabilityWindow({ currentCandidate: currentStabilityCandidate, observations: launchStabilityObservations, asOf: new Date().toISOString().slice(0, 10) });
  return <main className="shell wideShell launchReadiness">
    <section className="launchHero">
      <div>
        <div className="eyebrow">Founder launch control</div>
        <h1>Launch when the evidence is ready.</h1>
        <p className="lede">One plain-language view of the current baseline, the work in motion, and the decisions intentionally deferred. A clean build is necessary; it does not replace real-device acceptance.</p>
      </div>
      <aside className={summary.decision === "READY" ? "ready" : "attention"}>
        <strong>{summary.decision}</strong>
        <span>launch decision</span>
        <small>{summary.blockingGates} active gates · {summary.blockingDefects} critical defects</small>
      </aside>
    </section>

    <section className="launchMetrics">
      <article><span>Production build</span><strong>{launchBaseline.build}</strong><small>baseline {launchBaseline.recordedAt}</small></article>
      <article><span>Automated tests</span><strong>{launchBaseline.automatedTests.passed}/{launchBaseline.automatedTests.passed + launchBaseline.automatedTests.failed}</strong><small>{launchBaseline.automatedTests.failed} failing</small></article>
      <article><span>Gates passed</span><strong>{summary.passed}/{launchGates.length}</strong><small>all required before READY</small></article>
      <article><span>Active gates</span><strong>{summary.blockingGates}</strong><small>launch remains on hold</small></article>
      <article><span>Deferred decisions</span><strong>{summary.deferred}</strong><small>not launch work today</small></article>
    </section>

    <section className="card stabilityWindow" aria-labelledby="stability-window-title">
      <header>
        <div><div className="eyebrow">Seven-day stability</div><h2 id="stability-window-title">{stability.daysCompleted}/{stability.daysRequired} verified days</h2></div>
        <span className={stability.ready ? "passed" : "hold"}>{stability.ready ? "Passed" : "Hold"}</span>
      </header>
      <div className="stabilityDayTrack" aria-label={`${stability.daysCompleted} of ${stability.daysRequired} stability days verified`}>
        {Array.from({ length: stability.daysRequired }, (_, index) => <i className={index < stability.daysCompleted ? "complete" : ""} key={index} aria-hidden="true" />)}
      </div>
      <p>{stability.windowStart ? `Current candidate window: ${stability.windowStart} through ${stability.windowEnd}.` : "The stability clock has not started. Freeze the release candidate before recording day one."}</p>
      <ul>{stability.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
      {stability.nextRequiredDate && <small>Next required daily evidence: {stability.nextRequiredDate}</small>}
    </section>

    <section className="card launchBoundary">
      <div className="eyebrow">Current priority</div>
      <h2>Keep the candidate private while both product and clearance evidence mature.</h2>
      <p>Hojavía remains a confidential, reversible presentation—not a cleared or commercially adopted public brand. Cross-device synchronization, photo completion, safe import/recovery, private-beta safeguards, and collection truth remain active product gates. Confidential linguistic evidence, attorney-grade trademark review, owner-and-state registry work, refreshed digital checks, residual-risk acceptance, and a dated founder adoption decision remain controlling brand gates.</p>
      <div className="launchBoundaryActions">
        <a className="button secondary" href="/founder-onboarding">Open Founder Beta gate</a>
        <small>Credential required. Enter the Founder key only in the protected screen; opening the queue sends no invitation, discloses no candidate to a participant, and changes no cohort record.</small>
      </div>
    </section>

    <section className="acceptanceWorkspace" aria-labelledby="founder-acceptance-title">
      <header>
        <div><div className="eyebrow">Founder acceptance</div><h2 id="founder-acceptance-title">Three live product sessions remain.</h2></div>
        <p>Use a founder-controlled test account in the private production-like environment. Start with a complete Vault export, record device and browser details, and treat any missing observation as not run.</p>
      </header>
      <div>
        <article>
          <span>Session 1 · Two devices · Partial pass</span>
          <h3>Quantity synchronization and stale-save protection passed.</h3>
          <p className="acceptancePassed">✓ A1 and A2 passed on July 30. The phone saved quantity 3, the stale desktop overwrite was rejected, and INV-0007 was restored to 1.</p>
          <ol>
            <li>Add and verify one unmistakable story sentence.</li>
            <li>Verify one storage move and one collection-component quantity on both devices.</li>
            <li>Restore every remaining test field and confirm no duplicate record exists.</li>
          </ol>
          <a className="button secondary" href="/inventory#inventory-records">Open the Vault</a>
        </article>
        <article>
          <span>Session 2 · Physical phone · Not run</span>
          <h3>Complete the real photo journey.</h3>
          <ol>
            <li>Capture, review, and save a supported photo from the phone.</li>
            <li>Replace it, exercise one recoverable interruption, and retry from the saved record.</li>
            <li>Confirm the final image on the second device, then remove the test attachment.</li>
          </ol>
          <a className="button secondary" href="/inventory#mobile-intake">Open mobile intake</a>
        </article>
        <article>
          <span>Session 3 · Founder files · Partial pass</span>
          <h3>Parsing safeguards passed; live file journey remains.</h3>
          <p className="acceptancePassed">✓ Synthetic CSV and XLSX classification passed: 2 valid, 2 invalid, and 1 duplicate in each format. Nothing was committed.</p>
          <ol>
            <li>Preview representative founder-format CSV and XLSX copies in the protected UI.</li>
            <li>Commit one disposable subset twice and confirm idempotency.</li>
            <li>Edit one result, preview recovery, verify the conflict, then clean up.</li>
          </ol>
          <a className="button secondary" href="/account">Open import and recovery</a>
        </article>
      </div>
      <footer><strong>Evidence required for each session</strong><span>Date · environment · account · device and browser · record IDs · before/after screenshots · recovery point · cleanup result · PASS, FAIL, or NOT RUN</span></footer>
    </section>

    <section className="incidentCommand" aria-labelledby="incident-command-title">
      <header>
        <div><div className="eyebrow">Incident command</div><h2 id="incident-command-title">Classify, contain, recover, then reopen.</h2></div>
        <p>Opening an incident form changes nothing and sends nothing. Review the prefilled severity and evidence prompts before creating the private record.</p>
      </header>
      <div className="incidentSeverityGrid">
        {incidentSeverityStandard.map(item => <article key={item.severity}>
          <span>Severity {item.severity}</span>
          <h3>{item.label}</h3>
          <p>{item.definition}</p>
          <small>{item.launchEffect}</small>
          <a className="textLink" href={`/feedback?incident=severity-${item.severity}`}>Prepare Severity {item.severity} record →</a>
        </article>)}
      </div>
      <ol>{immediateIncidentActions.map(action => <li key={action}>{action}</li>)}</ol>
      <footer><strong>Reopen only with complete evidence.</strong><span>Containment · root cause · verified correction · regression coverage · recovery proof · reconciled records · resolved incident · reassessed gates · accountable-owner approval</span></footer>
    </section>

    <section className="launchGateBoard">
      {(["Now", "Next", "Later"] as const).map(priority => <section key={priority}>
        <header><div className="eyebrow">{priority}</div><h2>{priority === "Now" ? "Acceptance in motion" : priority === "Next" ? "Following gates" : "Intentionally deferred"}</h2></header>
        <div>{launchGates.filter(gate => gate.priority === priority).map(gate => <article className={gate.status.toLowerCase().replace(" ", "-")} key={gate.id}>
          <div><span>{gate.status}</span><h3>{gate.title}</h3></div>
          <p>{gate.detail}</p>
          <small>{gate.evidence}</small>
        </article>)}</div>
      </section>)}
    </section>
  </main>;
}
