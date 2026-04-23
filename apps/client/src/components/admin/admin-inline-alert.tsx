export function AdminInlineAlert({
  tone,
  text
}: Readonly<{
  tone: "error" | "success" | "info";
  text: string;
}>) {
  const cls =
    tone === "error"
      ? "hf-admin-form-msg hf-admin-form-msg--error"
      : tone === "success"
        ? "hf-admin-form-msg hf-admin-form-msg--success"
        : "hf-admin-info-hint";

  return (
    <p role={tone === "error" ? "alert" : "status"} className={cls}>
      {text}
    </p>
  );
}
