import Link from "next/link";
import { AdminDeleteButton } from "../../../../components/admin/admin-delete-button";
import { AdminEmptyState } from "../../../../components/admin/admin-empty-state";
import { AdminErrorState } from "../../../../components/admin/admin-error-state";
import { AdminInfoHint } from "../../../../components/admin/admin-info-hint";
import { IconPencil } from "../../../../components/admin/admin-nav-icons";
import { AdminPageHeader } from "../../../../components/admin/admin-page-header";
import { AdminTable, AdminTd, AdminTh } from "../../../../components/admin/admin-table";
import { getFamilySession } from "../../../../lib/server/auth/get-family-session";
import { getFamilyPrisma } from "../../../../lib/server/db";

function roleLabel(role: string): string {
  return role === "admin" ? "Administrador" : "Espectador";
}

export default async function AdminUsersPage() {
  const session = await getFamilySession();
  let rows: { id: string; email: string; role: string; profileCount: number }[] = [];
  let adminCount = 0;
  let dbError: string | null = null;

  try {
    const prisma = getFamilyPrisma();
    const [list, admins] = await Promise.all([
      prisma.user.findMany({
        orderBy: { email: "asc" },
        select: {
          id: true,
          email: true,
          role: true,
          _count: { select: { profiles: true } }
        }
      }),
      prisma.user.count({ where: { role: "admin" } })
    ]);
    adminCount = admins;
    rows = list.map((r) => ({
      id: r.id,
      email: r.email,
      role: r.role,
      profileCount: r._count.profiles
    }));
  } catch (e) {
    dbError = e instanceof Error ? e.message : "db_error";
  }

  return (
    <div>
      <AdminPageHeader
        actions={
          <Link className="hf-admin-primary-action" href="/admin/users/new">
            Nuevo usuario
          </Link>
        }
        description="Cuentas con correo y contraseña que pueden iniciar sesión en Family V1."
        title="Usuarios"
      />

      <AdminInfoHint>
        Solo administradores ven esta sección. No se puede eliminar el único usuario con rol admin ni tu propia
        cuenta desde el listado.
      </AdminInfoHint>

      {dbError !== null ? (
        <AdminErrorState message={dbError} title="No se pudo cargar" />
      ) : rows.length === 0 ? (
        <AdminEmptyState
          message="Crea el primer usuario o ejecuta el seed Prisma del client."
          title="Aún no hay usuarios"
        />
      ) : (
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Correo</AdminTh>
              <AdminTh>Rol</AdminTh>
              <AdminTh>Perfiles</AdminTh>
              <AdminTh style={{ width: "220px" }}>Acciones</AdminTh>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isSelf = session?.id === r.id;
              const soleAdminLocked = r.role === "admin" && adminCount <= 1;
              const canDelete = !isSelf && !soleAdminLocked;
              return (
                <tr key={r.id}>
                  <AdminTd>
                    <strong>{r.email}</strong>
                    {isSelf ? (
                      <span className="hf-admin-field-hint" style={{ display: "block", marginTop: "0.25rem" }}>
                        (tú)
                      </span>
                    ) : null}
                  </AdminTd>
                  <AdminTd>{roleLabel(r.role)}</AdminTd>
                  <AdminTd>{r.profileCount}</AdminTd>
                  <AdminTd>
                    <div className="hf-admin-table-actions">
                      <Link
                        className="hf-admin-row-action hf-admin-row-action--edit"
                        href={`/admin/users/${r.id}`}
                        title="Editar usuario"
                      >
                        <IconPencil />
                        <span>Editar</span>
                      </Link>
                      {canDelete ? (
                        <AdminDeleteButton
                          apiPath={`/api/family/admin/users/${r.id}`}
                          confirmMessage={`¿Eliminar al usuario ${r.email}? Se borrarán también sus perfiles y datos ligados.`}
                        />
                      ) : null}
                    </div>
                  </AdminTd>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
