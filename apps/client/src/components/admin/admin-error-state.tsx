import { FamilyErrorState } from "../family-ui/family-error-state";

/** Estado de error reutilizable del panel admin (delega en family-ui). */
export function AdminErrorState({ message, title }: Readonly<{ title: string; message: string }>) {
  return <FamilyErrorState message={message} title={title} />;
}
