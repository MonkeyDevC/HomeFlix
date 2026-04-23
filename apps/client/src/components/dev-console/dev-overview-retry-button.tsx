"use client";

import { useRouter } from "next/navigation";

export function DevOverviewRetryButton() {
  const router = useRouter();

  return (
    <button
      className="hdc-btn-retry"
      onClick={() => {
        router.refresh();
      }}
      type="button"
    >
      Re-ejecutar chequeo
    </button>
  );
}
