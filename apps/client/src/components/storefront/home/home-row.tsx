"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { HomeSection } from "./home-section";

export function HomeRow({
  eyebrow,
  title,
  description,
  children,
  emptyState
}: Readonly<{
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  emptyState?: ReactNode;
}>) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const itemCount = Array.isArray(children) ? children.length : children ? 1 : 0;

  const refreshScrollState = useCallback(() => {
    const viewport = viewportRef.current;

    if (viewport === null) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    setCanScrollPrev(viewport.scrollLeft > 12);
    setCanScrollNext(viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 12);
  }, []);

  useEffect(() => {
    refreshScrollState();

    const viewport = viewportRef.current;
    if (viewport === null) {
      return undefined;
    }

    const onScroll = () => refreshScrollState();
    viewport.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => refreshScrollState();
    window.addEventListener("resize", onResize);

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            refreshScrollState();
          });

    observer?.observe(viewport);

    return () => {
      viewport.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
    };
  }, [refreshScrollState]);

  function scrollByDirection(direction: 1 | -1) {
    const viewport = viewportRef.current;
    if (viewport === null) {
      return;
    }

    viewport.scrollBy({
      behavior: "smooth",
      left: Math.max(260, Math.floor(viewport.clientWidth * 0.88)) * direction
    });
  }

  const actions =
    itemCount > 0 ? (
      <div className="sf-home-row-controls" aria-label={`Controles del carrusel ${title}`}>
        <button
          aria-label={`Desplazar ${title} hacia la izquierda`}
          className="sf-home-row-button"
          disabled={!canScrollPrev}
          onClick={() => scrollByDirection(-1)}
          type="button"
        >
          {"<"}
        </button>
        <button
          aria-label={`Desplazar ${title} hacia la derecha`}
          className="sf-home-row-button"
          disabled={!canScrollNext}
          onClick={() => scrollByDirection(1)}
          type="button"
        >
          {">"}
        </button>
      </div>
    ) : null;

  return (
    <HomeSection actions={actions} description={description} eyebrow={eyebrow} title={title}>
      {itemCount === 0 ? (
        emptyState ?? null
      ) : (
        <div className="sf-home-row-shell">
          <div className="sf-home-row-viewport" ref={viewportRef}>
            <div className="sf-home-row-track">{children}</div>
          </div>
        </div>
      )}
    </HomeSection>
  );
}
