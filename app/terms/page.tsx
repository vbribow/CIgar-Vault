import "../legal.css";
import { brand } from "@/lib/brand";

export default function TermsPage() {
  return <main className="shell legalPage"><div className="eyebrow">Effective July 24, 2026 · Beta version 1.0</div><h1>{brand.name} Terms of Use</h1><p className="lede">{brand.name} is an educational and collection-stewardship platform. It is not a tobacco seller, medical advisor, insurer, appraiser, or investment advisor.</p>
    <section><h2>Eligibility</h2><p>You must be of legal age to access tobacco-related content where you live and at least 21 years old. The private beta is invitation-only and invitations may not be transferred.</p></section>
    <section><h2>Collector responsibility</h2><p>You are responsible for the accuracy of records you enter, protecting your credentials, maintaining appropriate backups, and independently confirming decisions involving purchases, insurance, value, storage, authenticity, or regulated activity.</p></section>
    <section><h2>Trust labels</h2><p>Official, verified historical, expert, community, and AI-assisted information are different evidence classes. {brand.name} will label those sources, but no database is complete or error-free.</p></section>
    <section><h2>Acceptable use</h2><p>Do not misuse another person’s account, scrape private records, introduce malicious code, impersonate an industry participant, submit unlawful content, or use {brand.name} to facilitate prohibited tobacco transactions.</p></section>
    <section><h2>Beta availability</h2><p>Features may change, pause, or be withdrawn during testing. {brand.name} may suspend access to protect users, data, the industry, or the integrity of the beta.</p></section>
  </main>;
}
