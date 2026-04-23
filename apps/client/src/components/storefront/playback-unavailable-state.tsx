export function PlaybackUnavailableState({
  title,
  message
}: Readonly<{
  title: string;
  message: string;
}>) {
  return (
    <section className="sf-playback" aria-label="Reproductor no disponible">
      <div className="sf-player-fallback" role="status">
        <h2 className="sf-player-fallback-title">{title}</h2>
        <p>{message}</p>
      </div>
    </section>
  );
}

