"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminReadErrorMessage } from "../../lib/family/admin-json";
import { IconSpinner, IconTrash } from "./admin-nav-icons";

export function AdminDeleteButton({
  apiPath,
  confirmMessage = "¿Eliminar este registro?",
  label = "Eliminar"
}: Readonly<{
  apiPath: string;
  confirmMessage?: string;
  label?: string;
}>) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (!window.confirm(confirmMessage)) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(apiPath, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        window.alert(await adminReadErrorMessage(res));
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      className="hf-admin-row-action hf-admin-row-action--danger"
      disabled={busy}
      aria-busy={busy}
      onClick={() => void onClick()}
      type="button"
      title={label}
    >
      {busy ? (
        <IconSpinner className="hf-admin-row-action__spinner" />
      ) : (
        <IconTrash />
      )}
      <span>{label}</span>
    </button>
  );
}
