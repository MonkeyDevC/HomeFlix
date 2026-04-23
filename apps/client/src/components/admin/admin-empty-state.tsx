import { FamilyEmptyState } from "../family-ui/family-empty-state";

/** Estado vacío reutilizable del panel admin (delega en family-ui). */
export function AdminEmptyState({ message, title }: Readonly<{ title: string; message: string }>) {
  return <FamilyEmptyState message={message} title={title} />;
}
