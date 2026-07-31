import { BetaFeedbackForm } from "@/components/beta-feedback-form";
import { AccountDataRequestKind, LaunchIncidentSeverity } from "@/lib/beta-feedback";
import "./feedback.css";

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ request?: string; incident?: string }> }) {
  const params = await searchParams;
  const parsedRequest = AccountDataRequestKind.safeParse(params.request);
  const parsedIncident = LaunchIncidentSeverity.safeParse(params.incident);
  return <main className="shell wideShell feedbackPage">
    <section className="feedbackHero"><div><div className="eyebrow">Private beta</div><h1>Help us make trust visible.</h1><p className="lede">Report anything inaccurate, confusing, unreliable, or needlessly difficult. Every report becomes part of the launch record.</p></div><a className="button secondary" href="/account">Account & recovery</a></section>
    <BetaFeedbackForm
      initialRequest={parsedRequest.success ? parsedRequest.data : undefined}
      initialIncident={!parsedRequest.success && parsedIncident.success ? parsedIncident.data : undefined}
    />
  </main>;
}
