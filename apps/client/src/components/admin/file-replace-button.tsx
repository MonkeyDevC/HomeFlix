export function FileReplaceButton({
  busy,
  label = "Subir / reemplazar"
}: Readonly<{ busy: boolean; label?: string }>) {
  return (
    <button className="hf-admin-primary-action" disabled={busy} type="submit">
      {busy ? "Subiendo…" : label}
    </button>
  );
}
