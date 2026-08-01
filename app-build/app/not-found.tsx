import { brand } from "@/lib/brand";

export default function NotFound() {
  return (
    <main className="shell">
      <section className="section card" aria-labelledby="not-found-title">
        <div className="eyebrow">Record not found</div>
        <h1 id="not-found-title">This destination is not available.</h1>
        <p className="lede">
          The link may be outdated, or the private record may no longer be available
          to this account. {brand.name} has not inferred anything about your collection
          from the missing destination.
        </p>
        <div className="ctaRow">
          <a className="button" href="/inventory">Open my collection</a>
          <a className="button secondary" href="/">Return home</a>
        </div>
      </section>
    </main>
  );
}
