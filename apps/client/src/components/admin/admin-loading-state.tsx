import { FamilyLoadingState } from "../family-ui/family-loading-state";

export function AdminLoadingState({ label = "Cargando…" }: Readonly<{ label?: string }>) {
  return <FamilyLoadingState label={label} />;
}
