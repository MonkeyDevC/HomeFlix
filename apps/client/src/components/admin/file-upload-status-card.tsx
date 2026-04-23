export function FileUploadStatusCard({
  title,
  pathValue,
  mimeType,
  sizeBytes,
  status,
  width,
  height,
  frameRate,
  durationSeconds
}: Readonly<{
  title: string;
  pathValue: string | null;
  mimeType?: string | null;
  sizeBytes?: string | null;
  status?: string | null;
  width?: number | null;
  height?: number | null;
  frameRate?: number | null;
  durationSeconds?: number | null;
}>) {
  const qualityLabel = buildQualityLabel({ width, height, frameRate, durationSeconds });

  return (
    <div className="hf-admin-asset-card">
      <p className="hf-admin-asset-card-title">{title}</p>
      {pathValue === null ? (
        <p className="hf-admin-asset-card-empty">Sin archivo cargado.</p>
      ) : (
        <>
          <p className="hf-admin-asset-card-path">
            <code>{pathValue}</code>
          </p>
          {qualityLabel !== null ? (
            <p className="hf-admin-asset-card-meta">
              Calidad: <strong>{qualityLabel}</strong>
            </p>
          ) : null}
          {mimeType !== undefined && mimeType !== null ? (
            <p className="hf-admin-asset-card-meta">
              MIME: <code>{mimeType}</code>
            </p>
          ) : null}
          {sizeBytes !== undefined && sizeBytes !== null ? (
            <p className="hf-admin-asset-card-meta">
              Tamaño: {Math.round((Number(sizeBytes) / (1024 * 1024)) * 10) / 10} MiB
            </p>
          ) : null}
          {status !== undefined && status !== null ? (
            <p className="hf-admin-asset-card-meta">Estado: {status}</p>
          ) : null}
        </>
      )}
    </div>
  );
}

function buildQualityLabel(meta: {
  width?: number | null | undefined;
  height?: number | null | undefined;
  frameRate?: number | null | undefined;
  durationSeconds?: number | null | undefined;
}): string | null {
  const parts: string[] = [];
  if (meta.height !== undefined && meta.height !== null && meta.height > 0) {
    parts.push(`${meta.height}p`);
  } else if (meta.width !== undefined && meta.width !== null && meta.width > 0) {
    parts.push(`${meta.width}w`);
  }
  if (meta.frameRate !== undefined && meta.frameRate !== null && meta.frameRate > 0) {
    const display = Math.round(meta.frameRate * 100) / 100;
    parts.push(`${display} fps`);
  }
  if (meta.durationSeconds !== undefined && meta.durationSeconds !== null && meta.durationSeconds > 0) {
    const totalMin = Math.floor(meta.durationSeconds / 60);
    const sec = Math.floor(meta.durationSeconds % 60);
    parts.push(`${totalMin}:${sec.toString().padStart(2, "0")}`);
  }
  return parts.length === 0 ? null : parts.join(" · ");
}
