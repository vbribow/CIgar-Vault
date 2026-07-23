import type { OnboardingStep } from "@/lib/onboarding";
import { onboardingSummary } from "@/lib/onboarding";

export function OnboardingDashboard({ steps }: { steps: OnboardingStep[] }) {
  const summary = onboardingSummary(steps);
  return <section className="onboardingDashboard" aria-labelledby="setup-title">
    <div className="onboardingHead"><div><div className="eyebrow">Vault readiness</div><h2 id="setup-title">{summary.percent === 100 ? "Your vault foundation is complete." : "Finish setting up the collection."}</h2><p>{summary.completed} of {summary.total} protection steps complete</p></div><div className="readinessRing" style={{"--readiness":`${summary.percent * 3.6}deg`} as React.CSSProperties}><strong>{summary.percent}%</strong><span>ready</span></div></div>
    {summary.next && <a className="nextBestAction" href={summary.next.href}><span>Recommended next</span><strong>{summary.next.title}</strong><small>{summary.next.description}</small><b>{summary.next.action} →</b></a>}
    <div className="onboardingSteps">{steps.map((step,index) => <a href={step.href} className={step.complete?"complete":"pending"} key={step.id}><span className="stepState">{step.complete?"✓":index+1}</span><div><strong>{step.title}</strong><small>{step.detail}</small><i><em style={{width:`${step.progress}%`}} /></i></div><b>{step.complete?"Review":"Continue →"}</b></a>)}</div>
  </section>;
}
