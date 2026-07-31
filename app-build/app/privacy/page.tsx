import "../legal.css";
import { brand } from "@/lib/brand";

export default function PrivacyPage() {
  return <main className="shell legalPage"><div className="eyebrow">Effective July 24, 2026 · Beta version 1.0</div><h1>{brand.name} Privacy Notice</h1><p className="lede">Your collection is private by default. {brand.name} should earn insight without taking ownership of your story.</p>
    <section><h2>What we collect</h2><p>Account information, the collection records you intentionally create, product-usage events you permit, feedback you submit, and technical information needed to secure and operate the service.</p></section>
    <section><h2>Why we use it</h2><p>To provide collection, humidor, valuation, learning, recovery, and personalized guidance; protect the service; respond to feedback; and improve {brand.name} through privacy-safe analysis.</p></section>
    <section><h2>What remains private</h2><p>Your inventory, valuations, smoking history, preferences, and collection story are not public unless you deliberately choose to publish or share a specific item. Industry partners do not receive private collector records.</p></section>
    <section><h2>Control and recovery</h2><p>You may export your complete vault from Account, restore it through the recovery workflow, change privacy preferences, and request account or data deletion through {brand.name} support.</p></section>
    <section><h2>Beta operation</h2><p>Private beta activity may be reviewed to identify failures and usability problems. Founder dashboards use aggregate milestones by default; collection contents are not displayed.</p></section>
    <section><h2>Contact</h2><p>Questions, access requests, corrections, and deletion requests should be sent through the private beta feedback channel or directly to {brand.name}’s founder.</p></section>
  </main>;
}
