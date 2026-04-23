export default function StorefrontLoading() {
  return (
    <div aria-hidden="true" className="sf-home">
      <section className="sf-home-hero sf-home-hero-loading">
        <div className="sf-home-hero-overlay" />
        <div className="sf-home-hero-inner">
          <div className="sf-home-hero-copy">
            <span className="sf-home-loading-line sf-home-loading-line-short" />
            <span className="sf-home-loading-line sf-home-loading-line-title" />
            <span className="sf-home-loading-line sf-home-loading-line-wide" />
            <span className="sf-home-loading-line sf-home-loading-line-medium" />
            <div className="sf-home-loading-cta-row">
              <span className="sf-home-loading-block sf-home-loading-block-cta" />
              <span className="sf-home-loading-block sf-home-loading-block-cta" />
            </div>
          </div>
        </div>
      </section>

      <div className="sf-home-body">
        {[0, 1].map((rowIndex) => (
          <section className="sf-home-section" key={rowIndex}>
            <div className="sf-home-section-head">
              <span className="sf-home-loading-line sf-home-loading-line-title" />
            </div>
            <div className="sf-home-row-shell">
              <div className="sf-home-row-viewport">
                <div className="sf-home-row-track">
                  {[0, 1, 2, 3, 4, 5].map((cardIndex) => (
                    <span className="sf-home-loading-card" key={cardIndex} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
