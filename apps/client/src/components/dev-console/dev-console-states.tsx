import type { ReactNode } from "react";

export function EmptyStateEnterprise({
  title,
  description,
  action
}: Readonly<{
  title: string;
  description: string;
  action?: ReactNode;
}>) {
  return (
    <div className="hdc-card" role="status">
      <p className="hdc-card-title" style={{ marginBottom: 8 }}>
        {title}
      </p>
      <p className="hdc-muted">{description}</p>
      {action !== undefined ? <div style={{ marginTop: 14 }}>{action}</div> : null}
    </div>
  );
}

export function ErrorStateEnterprise({
  title,
  message
}: Readonly<{
  title: string;
  message: string;
}>) {
  return (
    <div className="hdc-card" role="alert" style={{ borderColor: "rgba(239, 68, 68, 0.35)" }}>
      <p className="hdc-card-title" style={{ marginBottom: 8, color: "#fca5a5" }}>
        {title}
      </p>
      <p className="hdc-muted">{message}</p>
    </div>
  );
}
