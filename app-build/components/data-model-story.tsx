const layers = [
  { number: "01", title: "Identity", body: "Brand, line, blend, and vitola establish what the cigar is." },
  { number: "02", title: "Release", body: "Time, factory, market, edition, band, and packaging place it in history." },
  { number: "03", title: "Ownership", body: "A private lot records what you acquired, where it rests, and how it changes." },
  { number: "04", title: "Experience", body: "Smoking sessions, journals, reviews, and pairings preserve what the cigar became to you." },
  { number: "05", title: "Evidence", body: "Sources, trust levels, dates, confidence, and corrections show why a claim deserves belief." },
  { number: "06", title: "Legacy", body: "Collections, provenance, milestones, and instructions preserve the story beyond today." },
] as const;

export function DataModelStory() {
  return (
    <section className="dataModelStory" aria-labelledby="data-model-story-heading">
      <div className="dataModelStoryIntro">
        <div>
          <div className="eyebrow">The knowledge beneath Cedriva</div>
          <h2 id="data-model-story-heading">Every cigar is more than a name.</h2>
        </div>
        <div>
          <p>Cedriva connects the cigar in your hand to the people, tobacco, factory, release, evidence, and collector history behind it.</p>
          <a className="textLink" href="/data-model">See how Cedriva understands a cigar →</a>
        </div>
      </div>
      <div className="dataModelStoryGrid">
        {layers.map((layer) => (
          <article key={layer.number}>
            <span>{layer.number}</span>
            <h3>{layer.title}</h3>
            <p>{layer.body}</p>
          </article>
        ))}
      </div>
      <footer>
        <strong>One shared identity.</strong>
        <span>Private collection context.</span>
        <span>Visible evidence and uncertainty.</span>
        <span>History that is never silently overwritten.</span>
      </footer>
    </section>
  );
}
