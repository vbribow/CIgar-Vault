"use client";

import { brand } from "@/lib/brand";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="shell">
      <section className="section card" role="alert" aria-labelledby="app-error-title">
        <div className="eyebrow">Your private records remain protected</div>
        <h1 id="app-error-title">Something interrupted this view.</h1>
        <p className="lede">
          {brand.name} could not safely finish loading this workspace. Nothing has
          been classified as missing, deleted, or complete because of this interruption.
        </p>
        <div className="ctaRow">
          <button className="button" type="button" onClick={reset}>Try this view again</button>
          <a className="button secondary" href="/">Return to my collection home</a>
        </div>
      </section>
    </main>
  );
}
