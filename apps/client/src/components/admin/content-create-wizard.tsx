"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AdminCollectionLinkDto,
  AdminContentItemDetailDto,
  AdminContentItemListDto,
  AdminContentMediaSummaryDto,
  AdminProfileAccessDto
} from "../../lib/family/admin-contracts";
import { adminParseJson, adminReadErrorMessage } from "../../lib/family/admin-json";
import { AdminInlineAlert } from "./admin-inline-alert";
import {
  IconFilm,
  IconSeries,
  IconSpinner
} from "./admin-nav-icons";
import { MediaDropzoneCard } from "./media-dropzone-card";
import { ReleaseScopeSection } from "./release-scope-section";

type CategoryOption = Readonly<{ id: string; name: string }>;
type CollectionOption = Readonly<{ id: string; name: string }>;
type ProfileOption = Readonly<{ id: string; displayName: string; userId: string; userEmail: string }>;

type ContentKind = "movie" | "episode" | "clip";
type EditorialStatus = "draft" | "published" | "archived";
type Visibility = "private" | "household" | "public_internal";

type WizardProps = Readonly<{
  categories: ReadonlyArray<CategoryOption>;
  collections: ReadonlyArray<CollectionOption>;
  profiles: ReadonlyArray<ProfileOption>;
  preset?: Readonly<{ kind?: string; collectionId?: string }>;
}>;

type StepId = 1 | 2 | 3 | 4;

const STEPS: ReadonlyArray<{ id: StepId; title: string }> = [
  { id: 1, title: "Detalles Base" },
  { id: 2, title: "Media" },
  { id: 3, title: "Información & Organización" },
  { id: 4, title: "Visibilidad & Acceso" }
];

const KIND_OPTIONS: ReadonlyArray<{ value: ContentKind; label: string; hint: string }> = [
  { value: "movie", label: "Película", hint: "(Una pieza suelta)" },
  { value: "episode", label: "Episodio", hint: "(Parte de una serie)" },
  { value: "clip", label: "Clip", hint: "(Corto o extra)" }
];

const STATUS_OPTIONS: ReadonlyArray<{ value: EditorialStatus; label: string }> = [
  { value: "draft", label: "Borrador" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Archivado" }
];

const VISIBILITY_OPTIONS: ReadonlyArray<{ value: Visibility; label: string; hint: string }> = [
  { value: "private", label: "Privado", hint: "Solo aparece si invitas explícitamente a un perfil." },
  { value: "household", label: "Perfil familiar", hint: "Pensado para perfiles del hogar con acceso." },
  { value: "public_internal", label: "Todos", hint: "Visible para cualquier perfil autorizado." }
];

const MATURITY_OPTIONS = ["G", "7+", "13+", "18+"] as const;

function formatVideoQuality(media: AdminContentMediaSummaryDto | null): string | null {
  const v = media?.videoAsset;
  if (v === null || v === undefined) return null;
  const parts: string[] = [];
  if (v.height !== null && v.height > 0) parts.push(`${v.height}p`);
  if (v.frameRate !== null && v.frameRate > 0) {
    parts.push(`${Math.round(v.frameRate * 100) / 100} fps`);
  }
  if (v.codec !== null && v.codec.trim() !== "") {
    parts.push(v.codec);
  }
  if (v.durationSeconds !== null && v.durationSeconds > 0) {
    const m = Math.floor(v.durationSeconds / 60);
    const s = Math.floor(v.durationSeconds % 60);
    parts.push(`${m}:${s.toString().padStart(2, "0")}`);
  }
  return parts.length === 0 ? null : parts.join(" · ");
}

export function ContentCreateWizard({ categories, collections, profiles, preset }: WizardProps) {
  const router = useRouter();

  const [step, setStep] = useState<StepId>(1);
  const [contentId, setContentId] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const draftInitRef = useRef(false);

  const presetKind = (preset?.kind as ContentKind | undefined) ?? undefined;
  const [type, setType] = useState<ContentKind>(
    presetKind !== undefined && (presetKind === "movie" || presetKind === "episode" || presetKind === "clip")
      ? presetKind
      : "movie"
  );

  const [media, setMedia] = useState<AdminContentMediaSummaryDto | null>(null);
  const [posterMediaGate, setPosterMediaGate] = useState(true);
  const [thumbnailMediaGate, setThumbnailMediaGate] = useState(true);

  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [maturity, setMaturity] = useState<string>("");
  const [categoryId, setCategoryId] = useState("");
  const [collectionId, setCollectionId] = useState<string>(preset?.collectionId ?? "");
  const [seasonNumber, setSeasonNumber] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState("");

  const [editorialStatus, setEditorialStatus] = useState<EditorialStatus>("draft");
  const [releaseScope, setReleaseScope] = useState<"admin_only" | "public_catalog">("admin_only");
  const [visibility, setVisibility] = useState<Visibility>("household");
  const [selectedProfileIds, setSelectedProfileIds] = useState<ReadonlyArray<string>>(
    profiles.map((p) => p.id)
  );

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (draftInitRef.current) return;
    draftInitRef.current = true;

    const run = async () => {
      setBootstrapping(true);
      setDraftError(null);
      try {
        const res = await fetch("/api/family/admin/content", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Borrador sin título",
            type,
            editorialStatus: "draft",
            releaseScope: "admin_only",
            visibility: "private"
          })
        });
        const parsed = await adminParseJson<{ item: AdminContentItemListDto }>(res);
        if (!parsed.ok) {
          setDraftError(parsed.message);
          return;
        }
        setContentId(parsed.data.item.id);
      } catch (err) {
        setDraftError(err instanceof Error ? err.message : "No se pudo crear el borrador.");
      } finally {
        setBootstrapping(false);
      }
    };
    void run();
  }, [type]);

  const videoQualityLabel = useMemo(() => formatVideoQuality(media), [media]);

  useEffect(() => {
    if (media?.posterPath === null || media?.posterPath === undefined) {
      setPosterMediaGate(true);
    }
  }, [media?.posterPath]);

  useEffect(() => {
    if (media?.thumbnailPath === null || media?.thumbnailPath === undefined) {
      setThumbnailMediaGate(true);
    }
  }, [media?.thumbnailPath]);

  function toggleProfile(profileId: string) {
    setSelectedProfileIds((prev) =>
      prev.includes(profileId) ? prev.filter((id) => id !== profileId) : [...prev, profileId]
    );
  }

  function canGoNext(): { ok: true } | { ok: false; message: string } {
    if (step === 1) {
      return { ok: true };
    }
    if (step === 2) {
      const posterPath = media?.posterPath ?? null;
      const thumbPath = media?.thumbnailPath ?? null;
      if (posterPath !== null && !posterMediaGate) {
        return {
          ok: false,
          message:
            "Revisá el poster: corregí una imagen inválida o aceptá las advertencias antes de continuar."
        };
      }
      if (thumbPath !== null && !thumbnailMediaGate) {
        return {
          ok: false,
          message:
            "Revisá el thumbnail: corregí una imagen inválida o aceptá las advertencias antes de continuar."
        };
      }
      return { ok: true };
    }
    if (step === 3) {
      if (title.trim() === "") {
        return { ok: false, message: "El título es obligatorio." };
      }
      if (type === "episode") {
        if (collectionId === "") {
          return { ok: false, message: "Un episodio debe pertenecer a una serie (colección)." };
        }
      }
    }
    return { ok: true };
  }

  function goNext() {
    const check = canGoNext();
    if (!check.ok) {
      setSubmitError(check.message);
      return;
    }
    setSubmitError(null);
    setStep((s) => (s < 4 ? ((s + 1) as StepId) : s));
  }

  function goBack() {
    setSubmitError(null);
    setStep((s) => (s > 1 ? ((s - 1) as StepId) : s));
  }

  async function onCancel() {
    if (contentId !== null) {
      const confirmed = window.confirm(
        "¿Descartar este borrador? Se eliminará el registro y los archivos que hayas subido."
      );
      if (!confirmed) return;
      try {
        await fetch(`/api/family/admin/content/${contentId}`, {
          method: "DELETE",
          credentials: "include"
        });
      } catch {
        /* best effort */
      }
    }
    router.push("/admin/content");
  }

  async function onSubmitFinal() {
    if (contentId === null) {
      setSubmitError("El borrador aún no está listo.");
      return;
    }
    if (title.trim() === "") {
      setStep(3);
      setSubmitError("El título es obligatorio.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const payload: Record<string, unknown> = {
      title: title.trim(),
      synopsis: synopsis.trim() === "" ? null : synopsis.trim(),
      type,
      editorialStatus,
      releaseScope,
      visibility,
      categoryId: categoryId.trim() === "" ? null : categoryId,
      releaseYear: releaseYear.trim() === "" ? null : Number.parseInt(releaseYear, 10),
      maturityRating: maturity === "" ? null : maturity,
      seasonNumber: seasonNumber.trim() === "" ? null : Number.parseInt(seasonNumber, 10),
      episodeNumber: episodeNumber.trim() === "" ? null : Number.parseInt(episodeNumber, 10)
    };

    try {
      const res = await fetch(`/api/family/admin/content/${contentId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const msg = await adminReadErrorMessage(res);
        setSubmitError(msg);
        setSubmitting(false);
        return;
      }
      const parsed = (await res.json()) as { item: AdminContentItemDetailDto };

      if (type === "episode" && collectionId !== "") {
        const linkRes = await fetch(`/api/family/admin/content/${contentId}/collections`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ links: [{ collectionId, position: 0 }] })
        });
        const linkParsed = await adminParseJson<{ links: AdminCollectionLinkDto[] }>(linkRes);
        if (!linkParsed.ok) {
          setSubmitError(`Contenido guardado, pero falló la asignación de serie: ${linkParsed.message}`);
          setSubmitting(false);
          return;
        }
      }

      const accessRes = await fetch(`/api/family/admin/content/${contentId}/profile-access`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileIds: selectedProfileIds })
      });
      const accessParsed = await adminParseJson<{ grants: AdminProfileAccessDto[] }>(accessRes);
      if (!accessParsed.ok) {
        setSubmitError(`Contenido guardado, pero falló el acceso por perfil: ${accessParsed.message}`);
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      router.push(`/admin/content/${parsed.item.id}`);
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error al guardar.");
      setSubmitting(false);
    }
  }

  return (
    <div className="hf-admin-wizard">
      <header className="hf-admin-wizard__header">
        <div className="hf-admin-wizard__titles">
          <h1 className="hf-admin-wizard__title">Crear Nuevo Contenido</h1>
          <p className="hf-admin-wizard__subtitle">
            Paso {step} de 4: {STEPS[step - 1]?.title ?? ""}
          </p>
        </div>
        <ol className="hf-admin-wizard__progress" aria-label="Progreso del wizard">
          {STEPS.map((s) => {
            const state =
              s.id < step ? "done" : s.id === step ? "active" : "upcoming";
            return (
              <li
                key={s.id}
                className={`hf-admin-wizard__progress-segment is-${state}`}
                aria-current={state === "active" ? "step" : undefined}
              >
                <span className="sr-only">{`Paso ${s.id}: ${s.title}`}</span>
              </li>
            );
          })}
        </ol>
      </header>

      {bootstrapping ? (
        <div className="hf-admin-wizard__bootstrapping">
          <IconSpinner className="hf-admin-wizard__bootstrap-spinner" width={24} height={24} />
          <span>Preparando borrador…</span>
        </div>
      ) : null}

      {draftError !== null ? (
        <AdminInlineAlert tone="error" text={`No se pudo crear el borrador: ${draftError}`} />
      ) : null}

      {submitError !== null ? (
        <AdminInlineAlert tone="error" text={submitError} />
      ) : null}

      <div className="hf-admin-wizard__body">
        {step === 1 ? (
          <StepType value={type} onChange={setType} />
        ) : null}

        {step === 2 ? (
          <StepMedia
            contentId={contentId}
            media={media}
            onMediaChange={setMedia}
            onPosterGateChange={setPosterMediaGate}
            onThumbnailGateChange={setThumbnailMediaGate}
            videoQualityLabel={videoQualityLabel}
          />
        ) : null}

        {step === 3 ? (
          <StepInfo
            type={type}
            title={title}
            onTitleChange={setTitle}
            synopsis={synopsis}
            onSynopsisChange={setSynopsis}
            durationLabel={videoQualityLabel ?? "—"}
            releaseYear={releaseYear}
            onReleaseYearChange={setReleaseYear}
            maturity={maturity}
            onMaturityChange={setMaturity}
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
            categories={categories}
            collectionId={collectionId}
            onCollectionChange={setCollectionId}
            collections={collections}
            seasonNumber={seasonNumber}
            onSeasonChange={setSeasonNumber}
            episodeNumber={episodeNumber}
            onEpisodeChange={setEpisodeNumber}
          />
        ) : null}

        {step === 4 ? (
          <StepVisibility
            editorialStatus={editorialStatus}
            onEditorialStatusChange={setEditorialStatus}
            releaseScope={releaseScope}
            onReleaseScopeChange={setReleaseScope}
            visibility={visibility}
            onVisibilityChange={setVisibility}
            profiles={profiles}
            selectedProfileIds={selectedProfileIds}
            onToggleProfile={toggleProfile}
          />
        ) : null}
      </div>

      <footer className="hf-admin-wizard__footer">
        <button
          type="button"
          className="hf-admin-wizard__secondary"
          onClick={() => void onCancel()}
          disabled={submitting}
        >
          [ Cancelar ]
        </button>

        <div className="hf-admin-wizard__footer-nav">
          {step > 1 ? (
            <button
              type="button"
              className="hf-admin-wizard__ghost"
              onClick={goBack}
              disabled={submitting}
            >
              ← Anterior
            </button>
          ) : null}

          {step < 4 ? (
            <button
              type="button"
              className="hf-admin-wizard__primary"
              onClick={goNext}
              disabled={bootstrapping || contentId === null}
            >
              Siguiente →
            </button>
          ) : (
            <button
              type="button"
              className="hf-admin-wizard__primary"
              onClick={() => void onSubmitFinal()}
              disabled={submitting || contentId === null}
            >
              {submitting ? (
                <>
                  <IconSpinner className="hf-admin-row-action__spinner" width={14} height={14} />
                  <span>Guardando…</span>
                </>
              ) : (
                <span>[ Guardar contenido ]</span>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

function StepType({
  value,
  onChange
}: Readonly<{ value: ContentKind; onChange: (v: ContentKind) => void }>) {
  return (
    <section className="hf-admin-wizard__section">
      <h2 className="hf-admin-wizard__section-title">Step 1 - Tipo de Contenido</h2>
      <div className="hf-admin-wizard__kind-grid">
        {KIND_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              className={`hf-admin-kind-card${selected ? " is-selected" : ""}`}
              onClick={() => onChange(opt.value)}
              aria-pressed={selected}
            >
              <span className="hf-admin-kind-card__icon" aria-hidden>
                {opt.value === "movie" ? <IconFilm width={22} height={22} /> : null}
                {opt.value === "episode" ? <IconSeries width={22} height={22} /> : null}
                {opt.value === "clip" ? <IconClipShort /> : null}
              </span>
              <span className="hf-admin-kind-card__copy">
                <span className="hf-admin-kind-card__label">{opt.label}</span>
                <span className="hf-admin-kind-card__hint">{opt.hint}</span>
              </span>
              {selected ? (
                <span className="hf-admin-kind-card__check" aria-hidden>
                  <IconCheck />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function StepMedia({
  contentId,
  media,
  onMediaChange,
  onPosterGateChange,
  onThumbnailGateChange,
  videoQualityLabel
}: Readonly<{
  contentId: string | null;
  media: AdminContentMediaSummaryDto | null;
  onMediaChange: (m: AdminContentMediaSummaryDto) => void;
  onPosterGateChange: (ok: boolean) => void;
  onThumbnailGateChange: (ok: boolean) => void;
  videoQualityLabel: string | null;
}>) {
  const disabledReason = contentId === null ? "Preparando borrador…" : null;
  return (
    <section className="hf-admin-wizard__section">
      <h2 className="hf-admin-wizard__section-title">Step 2 - Media (Primero, no después)</h2>
      <div className="hf-admin-wizard__media-grid">
        <MediaDropzoneCard
          kind="video"
          variant="large"
          contentId={contentId}
          currentPath={media?.videoAsset?.filePath ?? null}
          qualityLabel={videoQualityLabel}
          codec={media?.videoAsset?.codec ?? null}
          onUploaded={onMediaChange}
          disabledReason={disabledReason}
        />
        <div className="hf-admin-wizard__media-row">
          <MediaDropzoneCard
            kind="poster"
            variant="compact"
            contentId={contentId}
            currentPath={media?.posterPath ?? null}
            onUploaded={onMediaChange}
            disabledReason={disabledReason}
            onImageReviewGate={onPosterGateChange}
          />
          <MediaDropzoneCard
            kind="thumbnail"
            variant="compact"
            contentId={contentId}
            currentPath={media?.thumbnailPath ?? null}
            onUploaded={onMediaChange}
            disabledReason={disabledReason}
            onImageReviewGate={onThumbnailGateChange}
          />
        </div>
      </div>
    </section>
  );
}

function StepInfo({
  type,
  title,
  onTitleChange,
  synopsis,
  onSynopsisChange,
  durationLabel,
  releaseYear,
  onReleaseYearChange,
  maturity,
  onMaturityChange,
  categoryId,
  onCategoryChange,
  categories,
  collectionId,
  onCollectionChange,
  collections,
  seasonNumber,
  onSeasonChange,
  episodeNumber,
  onEpisodeChange
}: Readonly<{
  type: ContentKind;
  title: string;
  onTitleChange: (v: string) => void;
  synopsis: string;
  onSynopsisChange: (v: string) => void;
  durationLabel: string;
  releaseYear: string;
  onReleaseYearChange: (v: string) => void;
  maturity: string;
  onMaturityChange: (v: string) => void;
  categoryId: string;
  onCategoryChange: (v: string) => void;
  categories: ReadonlyArray<CategoryOption>;
  collectionId: string;
  onCollectionChange: (v: string) => void;
  collections: ReadonlyArray<CollectionOption>;
  seasonNumber: string;
  onSeasonChange: (v: string) => void;
  episodeNumber: string;
  onEpisodeChange: (v: string) => void;
}>) {
  const isEpisode = type === "episode";
  return (
    <section className="hf-admin-wizard__section">
      <h2 className="hf-admin-wizard__section-title">Step 3 - Información Principal &amp; Organización</h2>
      <div className="hf-admin-wizard__info-grid">
        <div className="hf-admin-wizard__info-col">
          <h3 className="hf-admin-wizard__sub-title">Details &amp; Metadata</h3>
          <div className="hf-admin-field">
            <label className="hf-admin-field-label" htmlFor="wz-title">Título</label>
            <input
              id="wz-title"
              className="hf-admin-input"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Aventura en la playa"
              autoComplete="off"
              required
            />
          </div>
          <div className="hf-admin-field">
            <label className="hf-admin-field-label" htmlFor="wz-synopsis">Sinopsis</label>
            <textarea
              id="wz-synopsis"
              className="hf-admin-textarea"
              value={synopsis}
              onChange={(e) => onSynopsisChange(e.target.value)}
              rows={3}
              placeholder="Una descripción corta y cálida…"
            />
          </div>
          <div className="hf-admin-field">
            <label className="hf-admin-field-label" htmlFor="wz-duration">Duración (auto detectada)</label>
            <input
              id="wz-duration"
              className="hf-admin-input is-readonly"
              value={durationLabel}
              readOnly
              tabIndex={-1}
            />
          </div>
          <div className="hf-admin-field">
            <label className="hf-admin-field-label" htmlFor="wz-year">Año</label>
            <input
              id="wz-year"
              className="hf-admin-input"
              type="number"
              min={1888}
              max={2100}
              step={1}
              value={releaseYear}
              onChange={(e) => onReleaseYearChange(e.target.value)}
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
                  className={`hf-admin-chip${maturity === m ? " is-active" : ""}`}
                  onClick={() => onMaturityChange(maturity === m ? "" : m)}
                  aria-pressed={maturity === m}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="hf-admin-wizard__info-col">
          <h3 className="hf-admin-wizard__sub-title">Organization</h3>
          <p className="hf-admin-wizard__info-hint">¿Dónde aparecerá?</p>
          <div className="hf-admin-field">
            <label className="hf-admin-field-label" htmlFor="wz-category">Carrusel (Categoría)</label>
            <select
              id="wz-category"
              className="hf-admin-input"
              value={categoryId}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <option value="">— Sin categoría —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className={`hf-admin-field${isEpisode ? "" : " is-muted"}`}>
            <label className="hf-admin-field-label" htmlFor="wz-series">
              {isEpisode ? "Si es episodio: Serie" : "Serie (solo para episodios)"}
            </label>
            <select
              id="wz-series"
              className="hf-admin-input"
              value={collectionId}
              onChange={(e) => onCollectionChange(e.target.value)}
              disabled={!isEpisode}
            >
              <option value="">— Selecciona una serie —</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="hf-admin-wizard__info-pair">
            <div className={`hf-admin-field${isEpisode ? "" : " is-muted"}`}>
              <label className="hf-admin-field-label" htmlFor="wz-season">Temporada</label>
              <input
                id="wz-season"
                className="hf-admin-input"
                type="number"
                min={1}
                max={999}
                value={seasonNumber}
                onChange={(e) => onSeasonChange(e.target.value)}
                disabled={!isEpisode}
                placeholder="1"
              />
            </div>
            <div className={`hf-admin-field${isEpisode ? "" : " is-muted"}`}>
              <label className="hf-admin-field-label" htmlFor="wz-episode">Número de episodio</label>
              <input
                id="wz-episode"
                className="hf-admin-input"
                type="number"
                min={1}
                max={9999}
                value={episodeNumber}
                onChange={(e) => onEpisodeChange(e.target.value)}
                disabled={!isEpisode}
                placeholder="3"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepVisibility({
  editorialStatus,
  onEditorialStatusChange,
  releaseScope,
  onReleaseScopeChange,
  visibility,
  onVisibilityChange,
  profiles,
  selectedProfileIds,
  onToggleProfile
}: Readonly<{
  editorialStatus: EditorialStatus;
  onEditorialStatusChange: (v: EditorialStatus) => void;
  releaseScope: "admin_only" | "public_catalog";
  onReleaseScopeChange: (v: "admin_only" | "public_catalog") => void;
  visibility: Visibility;
  onVisibilityChange: (v: Visibility) => void;
  profiles: ReadonlyArray<ProfileOption>;
  selectedProfileIds: ReadonlyArray<string>;
  onToggleProfile: (id: string) => void;
}>) {
  return (
    <section className="hf-admin-wizard__section">
      <h2 className="hf-admin-wizard__section-title">Step 4 - Visibilidad &amp; Acceso</h2>
      <div className="hf-admin-wizard__visibility-grid">
        <div className="hf-admin-wizard__fieldset" style={{ gridColumn: "1 / -1" }}>
          <ReleaseScopeSection onChange={onReleaseScopeChange} value={releaseScope} />
        </div>
        <fieldset className="hf-admin-wizard__fieldset">
          <legend className="hf-admin-wizard__legend">Estado</legend>
          <div className="hf-admin-radio-group">
            {STATUS_OPTIONS.map((opt) => (
              <label key={opt.value} className="hf-admin-radio-option">
                <input
                  type="radio"
                  name="editorial-status"
                  value={opt.value}
                  checked={editorialStatus === opt.value}
                  onChange={() => onEditorialStatusChange(opt.value)}
                />
                <span className="hf-admin-radio-option__dot" aria-hidden />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="hf-admin-wizard__fieldset">
          <legend className="hf-admin-wizard__legend">Visibilidad (¿Quién lo ve?)</legend>
          <div className="hf-admin-radio-group">
            {VISIBILITY_OPTIONS.map((opt) => (
              <label key={opt.value} className="hf-admin-radio-option" title={opt.hint}>
                <input
                  type="radio"
                  name="visibility"
                  value={opt.value}
                  checked={visibility === opt.value}
                  onChange={() => onVisibilityChange(opt.value)}
                />
                <span className="hf-admin-radio-option__dot" aria-hidden />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="hf-admin-wizard__fieldset">
          <legend className="hf-admin-wizard__legend">Acceso por Perfil</legend>
          {profiles.length === 0 ? (
            <p className="hf-admin-field-hint">
              No hay perfiles disponibles. Crea perfiles en la sección Perfiles.
            </p>
          ) : (
            <div className="hf-admin-check-group">
              {profiles.map((p) => {
                const checked = selectedProfileIds.includes(p.id);
                return (
                  <label key={p.id} className="hf-admin-check-option hf-admin-check-option--stack">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleProfile(p.id)}
                    />
                    <span className="hf-admin-check-option__box" aria-hidden>
                      {checked ? <IconCheck /> : null}
                    </span>
                    <span className="hf-admin-check-option__label-stack">
                      <span className="hf-admin-check-option__title">{p.displayName}</span>
                      <span className="hf-admin-check-option__sub">{p.userEmail}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>
      </div>
    </section>
  );
}

function IconClipShort() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 5h16l-2 14H6z" />
      <path d="M10 10l6 2-6 2z" fill="currentColor" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
