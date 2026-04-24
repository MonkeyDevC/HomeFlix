export function FileReplaceButton({
  busy,
  busyLabel = "Subiendo…",
  disabled = false,
  label = "Subir / reemplazar"
}: Readonly<{
  busy: boolean;
  /** Texto del botón mientras `busy` (p. ej. video con XHR: "Enviando…"). */
  busyLabel?: string;
  disabled?: boolean;
  label?: string;
}>) {
  return (
    <button className="hf-admin-primary-action" disabled={busy || disabled} type="submit">
      {busy ? busyLabel : label}
    </button>
  );
}
