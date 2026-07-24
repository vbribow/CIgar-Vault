export default function LoadingCollections() {
  return (
    <main className="shell" aria-busy="true" aria-label="Loading collections">
      <section className="valueHero">
        <div>
          <div className="eyebrow">Curated sets</div>
          <h1>Collections worth more together.</h1>
          <p className="lede">
            Gathering your collection records, component matches, and current
            value evidence.
          </p>
        </div>
        <div className="valueHeroCard">
          <span>Collection intelligence</span>
          <strong>Whole + parts</strong>
          <small>Preparing your collection workspace</small>
        </div>
      </section>
      <section className="collectionLoadingGrid">
        {[1, 2, 3].map(item => (
          <article className="skeleton collectionLoadingCard" key={item} />
        ))}
      </section>
    </main>
  );
}
