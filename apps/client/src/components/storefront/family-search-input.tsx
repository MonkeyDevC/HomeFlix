"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function FamilySearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  return (
    <form
      className="sf-search-form"
      role="search"
      onSubmit={(ev) => {
        ev.preventDefault();
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }}
    >
      <label className="sf-sr-only" htmlFor="family-search-q">
        Buscar en catálogo Family
      </label>
      <span aria-hidden="true" className="sf-search-icon">
        🔎
      </span>
      <input
        id="family-search-q"
        className="sf-search-input"
        name="q"
        onChange={(ev) => setQuery(ev.target.value)}
        placeholder="Películas, series o personajes..."
        value={query}
      />
    </form>
  );
}

