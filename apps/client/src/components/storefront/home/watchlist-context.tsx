"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { FamilyHomeCardDto } from "../../../lib/family/storefront-contracts";

type CardKind = FamilyHomeCardDto["kind"];

type WatchlistContextValue = Readonly<{
  /**
   * `true` si el perfil tiene este card en Mi lista.
   * El API guarda ContentItems; para cards standalone el id coincide, para series
   * resuelve internamente el episodio representativo. En cliente marcamos por
   * (kind,id) para evitar una segunda resolución.
   */
  isInWatchlist: (card: Readonly<{ kind: CardKind; id: string }>) => boolean;
  /** Alterna la pertenencia. Optimista con rollback si falla la red. */
  toggle: (card: Readonly<{ kind: CardKind; id: string }>) => Promise<void>;
  /** Flag general por si queremos deshabilitar botones mientras el servidor procesa. */
  isPending: (card: Readonly<{ kind: CardKind; id: string }>) => boolean;
}>;

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

function cardKey(card: Readonly<{ kind: CardKind; id: string }>): string {
  return `${card.kind}:${card.id}`;
}

export function WatchlistProvider({
  initialKeys,
  children
}: Readonly<{
  /** Keys "kind:id" ya presentes en la watchlist del perfil. */
  initialKeys: readonly string[];
  children: ReactNode;
}>) {
  const [keys, setKeys] = useState<ReadonlySet<string>>(() => new Set(initialKeys));
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    setKeys(new Set(initialKeys));
  }, [initialKeys]);

  const isInWatchlist = useCallback<WatchlistContextValue["isInWatchlist"]>(
    (card) => keys.has(cardKey(card)),
    [keys]
  );

  const isPending = useCallback<WatchlistContextValue["isPending"]>(
    (card) => pending.has(cardKey(card)),
    [pending]
  );

  const toggle = useCallback<WatchlistContextValue["toggle"]>(
    async (card) => {
      const key = cardKey(card);
      const wasIn = keys.has(key);
      const action: "add" | "remove" = wasIn ? "remove" : "add";

      // Optimismo
      setPending((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
      setKeys((prev) => {
        const next = new Set(prev);
        if (wasIn) next.delete(key);
        else next.add(key);
        return next;
      });

      try {
        const response = await fetch("/api/family/watchlist/resolve", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind: card.kind, id: card.id, action })
        });
        if (!response.ok) {
          throw new Error(`watchlist_api_${response.status}`);
        }
      } catch (error) {
        console.warn("watchlist toggle failed, rolling back", error);
        setKeys((prev) => {
          const next = new Set(prev);
          if (wasIn) next.add(key);
          else next.delete(key);
          return next;
        });
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [keys]
  );

  const value = useMemo<WatchlistContextValue>(
    () => ({ isInWatchlist, toggle, isPending }),
    [isInWatchlist, toggle, isPending]
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (ctx === null) {
    // Fallback idempotente: si un componente se renderiza fuera del provider
    // (por ejemplo en páginas donde aún no montamos el contexto), evitamos un
    // crash y exponemos una API no-op. El botón quedará visible pero inerte.
    return {
      isInWatchlist: () => false,
      toggle: async () => {
        /* no-op fallback */
      },
      isPending: () => false
    };
  }
  return ctx;
}
