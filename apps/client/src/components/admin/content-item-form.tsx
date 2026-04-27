"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type {
  AdminCollectionLinkDto,
  AdminContentItemDetailDto,
  AdminContentItemListDto
} from "../../lib/family/admin-contracts";
import { adminParseJson } from "../../lib/family/admin-json";
import { AdminInfoHint } from "./admin-info-hint";
import { ContentKindSelector } from "./content-kind-selector";
import { ContentPlacementSelector } from "./content-placement-selector";
import { GallerySeriesPlacementSection } from "./gallery-series-placement-section";
import { ReleaseScopeSection } from "./release-scope-section";
import { SlugPreviewField } from "./slug-preview-field";

export type ContentItemFormInitial = Readonly<{
  slug: string;
  title: string;
  synopsis: string;
  editorialStatus: string;
  releaseScope: string;
  visibility: string;
  type: string;
  thumbnailPath: string;
  posterPath: string;
  categoryId: string;
  releaseYear: string;
  maturityRating: string;
  seasonNumber: string;
  episodeNumber: string;
}>;

type ContentPreset = Readonly<{
  kind?: string;
  collectionId?: string;
}>;

const STATUS_OPTIONS = [
  { value: "draft", label: "Borrador" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Archivado" }
] as const;

const VISIBILITY_OPTIONS = [
  { value: "private", label: "Privado", hint: "Solo aparece si se invita a un perfil." },
  { value: "household", label: "Hogar", hint: "Pensado para la familia." },
  { value: "public_internal", label: "Abierto", hint: "Visible para cualquier perfil autorizado." }
] as const;

const MATURITY_OPTIONS = ["G", "7+", "13+", "18+"] as const;

export function ContentItemForm({
  mode,
  contentId,
  initial,
  categories,
  collections,
  initialCollectionIds,
  initialGalleryLinkPosition,
  preset
}: Readonly<{
  mode: "create" | "edit";
  contentId?: string;
  initial?: ContentItemFormInitial;
  categories: ReadonlyArray<{ id: string; name: string }>;
  collections: ReadonlyArray<{ id: string; name: string }>;
  initialCollectionIds?: readonly string[];
  /** Posición en la serie si hay un solo enlace (p. ej. galería en una sola collection). */
  initialGalleryLinkPosition?: string;
  preset?: ContentPreset;
}>) {
  const router = useRouter();

  const startingType = initial?.type ?? preset?.kind ?? "movie";
  const startingCollections: readonly string[] =
    initialCollectionIds ??
    (preset?.collectionId !== undefined && preset.collectionId !== "" ? [preset.collectionId] : []);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [synopsis, setSynopsis] = useState(initial?.synopsis ?? "");
  const [type, setType] = useState(startingType);
  const [editorialStatus, setEditorialStatus] = useState(initial?.editorialStatus ?? "draft");
  const [releaseScope, setReleaseScope] = useState<"admin_only" | "public_catalog">(
    initial?.releaseScope === "admin_only" ? "admin_only" : "public_catalog"
  );
  const [visibility, setVisibility] = useState(initial?.visibility ?? "household");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<readonly string[]>(startingCollections);
  const [slugOverride, setSlugOverride] = useState("");
  const [releaseYear, setReleaseYear] = useState(initial?.releaseYear ?? "");
  const [maturityRating, setMaturityRating] = useState(initial?.maturityRating ?? "");
  const [seasonNumber, setSeasonNumber] = useState(initial?.seasonNumber ?? "");
  const [episodeNumber, setEpisodeNumber] = useState(initial?.episodeNumber ?? "");
  const [gallerySeriesPosition, setGallerySeriesPosition] = useState(
    initialGalleryLinkPosition ?? "0"
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleCollection = (id: string) => {
    setSelectedCollectionIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  };

  const showEpisodeWarning = useMemo(
    () => type === "episode" && selectedCollectionIds.length === 0,
    [type, selectedCollectionIds]
  );

  function buildCollectionLinks(): Array<{ collectionId: string; position: number }> {
    if (selectedCollectionIds.length === 0) {
      return [];
    }
    if (type === "photo_gallery" && selectedCollectionIds.length === 1) {
      const pos = Math.max(0, Number.parseInt(gallerySeriesPosition, 10) || 0);
      return [{ collectionId: selectedCollectionIds[0]!, position: pos }];
    }
    return selectedCollectionIds.map((cid, idx) => ({ collectionId: cid, position: idx }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    const payload: Record<string, unknown> = {
      title,
      synopsis: synopsis.trim() === "" ? null : synopsis,
      editorialStatus,
      releaseScope,
      visibility,
      type,
      categoryId: categoryId.trim() === "" ? null : categoryId,
      releaseYear:
        releaseYear.trim() === ""
          ? null
          : Number.parseInt(releaseYear, 10),
      maturityRating: maturityRating === "" ? null : maturityRating,
      seasonNumber:
        type === "episode" && seasonNumber.trim() !== ""
          ? Number.parseInt(seasonNumber, 10)
          : null,
      episodeNumber:
        type === "episode" && episodeNumber.trim() !== ""
          ? Number.parseInt(episodeNumber, 10)
          : null
    };
    if (slugOverride.trim() !== "") {
      payload.slug = slugOverride.trim();
    }

    if (mode === "create") {
      const res = await fetch("/api/family/admin/content", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const parsed = await adminParseJson<{ item: AdminContentItemListDto }>(res);
      if (!parsed.ok) {
        setBusy(false);
        setError(parsed.message);
        return;
      }

      const newId = parsed.data.item.id;

      if (selectedCollectionIds.length > 0) {
        const linkRes = await fetch(`/api/family/admin/content/${newId}/collections`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            links: buildCollectionLinks()
          })
        });
        const linkParsed = await adminParseJson<{ links: AdminCollectionLinkDto[] }>(linkRes);
        if (!linkParsed.ok) {
          setBusy(false);
          setError(`Se creó el contenido, pero no se pudo vincular la serie: ${linkParsed.message}`);
          router.push(`/admin/content/${newId}`);
          router.refresh();
          return;
        }
      }

      setBusy(false);
      router.push(`/admin/content/${newId}`);
      router.refresh();
      return;
    }

    const res = await fetch(`/api/family/admin/content/${contentId ?? ""}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const parsed = await adminParseJson<{ item: AdminContentItemDetailDto }>(res);
    if (!parsed.ok) {
      setBusy(false);
      setError(parsed.message);
      return;
    }

    const linkRes = await fetch(`/api/family/admin/content/${contentId ?? ""}/collections`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        links: buildCollectionLinks()
      })
    });
    const linkParsed = await adminParseJson<{ links: AdminCollectionLinkDto[] }>(linkRes);
    setBusy(false);
    if (!linkParsed.ok) {
      setError(`Datos guardados, pero fallaron las series: ${linkParsed.message}`);
      return;
    }
    setMessage("Cambios guardados.");
    router.refresh();
  }

  return (
    <form className="hf-admin-form" onSubmit={(ev) => void onSubmit(ev)}>
      <AdminInfoHint>
        Rellena el título y elige si es película o episodio. El slug se genera automáticamente. Luego podrás subir el video y el poster.
      </AdminInfoHint>

      {error !== null ? <p className="hf-admin-form-msg hf-admin-form-msg--error" role="alert">{error}</p> : null}
      {message !== null ? <p className="hf-admin-form-msg hf-admin-form-msg--success" role="status">{message}</p> : null}

      <div className="hf-admin-field">
        <label className="hf-admin-field-label" htmlFor="ci-title">Título</label>
        <input
          id="ci-title"
          className="hf-admin-input"
          value={title}
          onChange={(ev) => setTitle(ev.target.value)}
          required
          autoComplete="off"
          placeholder="Ej. Aventura en la playa"
        />
      </div>

      <div className="hf-admin-field">
        <span className="hf-admin-field-label">¿Qué estás creando?</span>
        <ContentKindSelector value={type} onChange={setType} />
      </div>

      <div className="hf-admin-field">
        <label className="hf-admin-field-label" htmlFor="ci-synopsis">Sinopsis</label>
        <textarea
          id="ci-synopsis"
          className="hf-admin-textarea"
          value={synopsis}
          onChange={(ev) => setSynopsis(ev.target.value)}
          rows={4}
          placeholder="Una descripción corta y cálida para la familia."
        />
      </div>

      <ContentPlacementSelector
        categories={categories}
        categoryId={categoryId}
        collections={collections}
        onCategoryChange={setCategoryId}
        onToggleCollection={toggleCollection}
        selectedCollectionIds={selectedCollectionIds}
        type={type}
      />

      {type === "photo_gallery" && selectedCollectionIds.length === 1 ? (
        <GallerySeriesPlacementSection
          onChange={setGallerySeriesPosition}
          value={gallerySeriesPosition}
        />
      ) : null}

      {showEpisodeWarning ? (
        <p className="hf-admin-form-msg hf-admin-form-msg--error" role="status">
          Un episodio debería pertenecer al menos a una serie. Marca una en la lista para que aparezca bien agrupado.
        </p>
      ) : null}

      <div className="hf-admin-field-grid">
        <div className="hf-admin-field">
          <label className="hf-admin-field-label" htmlFor="ci-release-year">Año</label>
          <input
            id="ci-release-year"
            className="hf-admin-input"
            type="number"
            min={1888}
            max={2100}
            step={1}
            value={releaseYear}
            onChange={(ev) => setReleaseYear(ev.target.value)}
            placeholder="2024"
          />
        </div>
        <div className="hf-admin-field">
          <span className="hf-admin-field-label">Clasificación</span>
          <div className="hf-admin-chip-row" role="group" aria-label="Clasificación por edad">
            {MATURITY_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                className={`hf-admin-chip${maturityRating === m ? " is-active" : ""}`}
                onClick={() => setMaturityRating(maturityRating === m ? "" : m)}
                aria-pressed={maturityRating === m}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {type === "episode" ? (
        <div className="hf-admin-field-grid">
          <div className="hf-admin-field">
            <label className="hf-admin-field-label" htmlFor="ci-season">Temporada</label>
            <input
              id="ci-season"
              className="hf-admin-input"
              type="number"
              min={1}
              max={999}
              value={seasonNumber}
              onChange={(ev) => setSeasonNumber(ev.target.value)}
              placeholder="1"
            />
            <p className="hf-admin-field-hint">
              Usado para agrupar y ordenar los episodios dentro de la serie.
            </p>
          </div>
          <div className="hf-admin-field">
            <label className="hf-admin-field-label" htmlFor="ci-episode">Número de episodio</label>
            <input
              id="ci-episode"
              className="hf-admin-input"
              type="number"
              min={1}
              max={9999}
              value={episodeNumber}
              onChange={(ev) => setEpisodeNumber(ev.target.value)}
              placeholder="3"
            />
            <p className="hf-admin-field-hint">
              Determina el orden de reproducción y qué episodio sigue al terminar uno.
            </p>
          </div>
        </div>
      ) : null}

      <div className="hf-admin-field">
        <span className="hf-admin-field-label">Estado</span>
        <div className="hf-admin-segment" role="group" aria-label="Estado editorial">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setEditorialStatus(opt.value)}
              className={opt.value === editorialStatus ? "is-active" : ""}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="hf-admin-field-hint">
          El estado editorial describe el ciclo de vida del contenido; el alcance define si ya va al catálogo
          familiar o sigue en vista previa interna.
        </p>
      </div>

      <ReleaseScopeSection onChange={setReleaseScope} value={releaseScope} />

      <div className="hf-admin-field">
        <span className="hf-admin-field-label">Visibilidad</span>
        <div className="hf-admin-segment" role="group" aria-label="Visibilidad editorial">
          {VISIBILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setVisibility(opt.value)}
              className={opt.value === visibility ? "is-active" : ""}
              title={opt.hint}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="hf-admin-field-hint">
          {VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.hint ?? ""}
        </p>
      </div>

      <SlugPreviewField
        currentSlug={initial?.slug ?? ""}
        onSlugChange={setSlugOverride}
        overrideValue={slugOverride}
        sourceLabel="el título"
        sourceValue={title}
      />

      <div className="hf-admin-actions-row">
        <button className="hf-admin-primary-action" disabled={busy} type="submit">
          {busy ? "Guardando…" : mode === "create" ? "Crear contenido" : "Guardar cambios"}
        </button>
        <Link href={mode === "edit" ? "/admin/content" : "/admin/content"} className="hf-admin-secondary-action">
          Volver al listado
        </Link>
      </div>
    </form>
  );
}
