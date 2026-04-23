import Link from "next/link";
import { FamilyPageHeader, FamilySectionLayout } from "../../../../components/family-ui";

export default function AuthForbiddenPage() {
  return (
    <FamilySectionLayout>
      <FamilyPageHeader
        description="Solo cuentas con rol admin pueden abrir el panel /admin."
        title="Acceso denegado"
      />
      <p style={{ color: "var(--hf-muted, #94a3b8)", fontSize: "0.9rem", lineHeight: 1.5, margin: 0 }}>
        Si crees que es un error, cierra sesión y vuelve a entrar con una cuenta administradora.
      </p>
      <p style={{ marginTop: "1rem" }}>
        <Link href="/" style={{ color: "#93c5fd" }}>
          Volver al inicio
        </Link>
        {" · "}
        <Link href="/auth/login" style={{ color: "#93c5fd" }}>
          Otra cuenta
        </Link>
      </p>
    </FamilySectionLayout>
  );
}
