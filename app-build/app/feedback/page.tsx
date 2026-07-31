import { BetaFeedbackForm } from "@/components/beta-feedback-form";
import "./feedback.css";

export default function FeedbackPage() {
  return <main className="shell wideShell feedbackPage">
    <section className="feedbackHero"><div><div className="eyebrow">Private beta</div><h1>Help us make trust visible.</h1><p className="lede">Report anything inaccurate, confusing, unreliable, or needlessly difficult. Every report becomes part of the launch record.</p></div><a className="button secondary" href="/account">Account & recovery</a></section>
    <BetaFeedbackForm/>
  </main>;
}
