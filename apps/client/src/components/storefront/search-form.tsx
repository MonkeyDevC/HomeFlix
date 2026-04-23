"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function SearchFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initial);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  return (
    <form
      className="sf-search-form"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const next = query.trim();
        router.push(`/search?q=${encodeURIComponent(next)}`);
      }}
    >
      <label className="sf-sr-only" htmlFor="sf-search-q">
        Buscar en el catálogo
      </label>
      <input
        id="sf-search-q"
        className="sf-search-input"
        name="q"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
        placeholder="Título, slug o sinopsis…"
        autoComplete="off"
      />
      <button className="sf-btn sf-btn-primary" type="submit">
        Buscar
      </button>
    </form>
  );
}

export function SearchForm() {
  return (
    <Suspense fallback={<p className="sf-muted">Cargando buscador…</p>}>
      <SearchFormInner />
    </Suspense>
  );
}
