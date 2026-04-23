import { DevAdminGate } from "../../components/dev-admin-gate";
import { DevConsoleShell } from "../../components/dev-console/dev-console-shell";
import "./dev-console.css";

export default function DevLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="hdc-root">
      <div
        role="note"
        style={{
          background: "rgba(251, 191, 36, 0.12)",
          borderBottom: "1px solid rgba(251, 191, 36, 0.35)",
          color: "#fcd34d",
          fontSize: "0.78rem",
          lineHeight: 1.45,
          padding: "8px 14px",
          textAlign: "center"
        }}
      >
        <strong>Legado V2:</strong> esta consola técnica no forma parte de{" "}
        <strong>HomeFlix Family V1</strong>. SSOT del producto nuevo:{" "}
        <code style={{ color: "#fef3c7" }}>docs/family-v1/</code>
      </div>
      <DevAdminGate>
        <DevConsoleShell>{children}</DevConsoleShell>
      </DevAdminGate>
    </div>
  );
}
