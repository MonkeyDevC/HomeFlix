"use client";

import { useCallback, useState } from "react";
import type { AdminContentMediaSummaryDto } from "../../lib/family/admin-contracts";
import { adminParseJson, adminReadErrorMessage } from "../../lib/family/admin-json";
import { AdminInlineAlert } from "./admin-inline-alert";

type PhotoEntry = AdminContentMediaSummaryDto["photos"][number];

export function PhotoGalleryManager({
  contentItemId,
  initial,
  onSummaryChange
}: Readonly<{
  contentItemId: string;
  initial: AdminContentMediaSummaryDto;
  onSummaryChange: (next: AdminContentMediaSummaryDto) => void;
}>) {
  const [media, setMedia] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const sync = useCallback(
    (next: AdminContentMediaSummaryDto) => {
      setMedia(next);
      onSummaryChange(next);
    },
    [onSummaryChange]
  );

  async function setCover(photoId: string | null) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/family/admin/content/${contentItemId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverPhotoId: photoId })
      });
      if (!res.ok) {
        setError(await adminReadErrorMessage(res));
        return;
      }
      const summary = await buildAdminContentMediaSummaryDtoClient(contentItemId);
      if (summary !== null) {
        sync(summary);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al actualizar portada.");
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto(photoId: string) {
    if (!window.confirm("¿Eliminar esta foto del disco y del catálogo?")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/family/admin/content/${contentItemId}/photos/${photoId}`, {
        method: "DELETE",
        credentials: "include"
      });
      const parsed = await adminParseJson<{ item: AdminContentMediaSummaryDto }>(res);
      if (!parsed.ok) {
        setError(parsed.message);
        return;
      }
      sync(parsed.data.item);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar.");
    } finally {
      setBusy(false);
    }
  }

  async function movePhoto(photoId: string, dir: -1 | 1) {
    const ordered = [...media.photos].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = ordered.findIndex((p) => p.id === photoId);
    if (idx < 0) return;
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= ordered.length) return;
    const a = ordered[idx]!;
    const b = ordered[nextIdx]!;
    ordered[idx] = b;
    ordered[nextIdx] = a;
    const orderedIds = ordered.map((p) => p.id);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/family/admin/content/${contentItemId}/photos/reorder`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds })
      });
      const parsed = await adminParseJson<{ item: AdminContentMediaSummaryDto }>(res);
      if (!parsed.ok) {
        setError(parsed.message);
        return;
      }
      sync(parsed.data.item);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al reordenar.");
    } finally {
      setBusy(false);
    }
  }

  async function onFilesSelected(files: FileList | null) {
    if (files === null || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      for (let i = 0; i < files.length; i++) {
        const f = files.item(i);
        if (f !== null) {
          form.append("file", f);
        }
      }
      const res = await fetch(`/api/family/admin/content/${contentItemId}/photos`, {
        method: "POST",
        credentials: "include",
        body: form
      });
      const parsed = await adminParseJson<{ item: AdminContentMediaSummaryDto }>(res);
      if (!parsed.ok) {
        setError(parsed.message);
        return;
      }
      sync(parsed.data.item);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir.");
    } finally {
      setUploading(false);
    }
  }

  const sorted = [...media.photos].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="hf-admin-photo-gallery">
      {error !== null ? <AdminInlineAlert tone="error" text={error} /> : null}
      {media.photos.length === 0 ? (
        <p className="hf-admin-field-hint">
          Galería sin fotos. Podés guardar como borrador; para publicar necesitás al menos una imagen.
        </p>
      ) : null}

      <div className="hf-admin-photo-dropzone">
        <label className="hf-admin-photo-dropzone__label">
          <input
            className="sr-only"
            disabled={uploading || busy}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            multiple
            onChange={(e) => void onFilesSelected(e.target.files)}
          />
          <span className="hf-admin-photo-dropzone__title">Arrastrá o elegí fotos (JPG, PNG, WebP)</span>
          <span className="hf-admin-photo-dropzone__sub">Hasta 200 imágenes por galería · máx. 10 MiB c/u</span>
        </label>
        {uploading ? <span className="hf-admin-photo-dropzone__status">Subiendo…</span> : null}
      </div>

      <ul className="hf-admin-photo-grid" aria-label="Fotos de la galería">
        {sorted.map((p: PhotoEntry, i: number) => (
          <li key={p.id} className="hf-admin-photo-tile">
            <div className="hf-admin-photo-tile__frame">
              <img
                alt={p.altText ?? ""}
                className="hf-admin-photo-tile__img"
                height={p.height ?? 200}
                src={`/api/family/photos/${p.id}`}
                width={p.width ?? 200}
                loading="lazy"
              />
              {media.coverPhotoId === p.id ? (
                <span className="hf-admin-photo-tile__badge">Portada</span>
              ) : null}
            </div>
            <div className="hf-admin-photo-tile__meta">
              <span className="hf-admin-photo-tile__idx">#{i + 1}</span>
              {p.width !== null && p.height !== null ? (
                <span className="hf-admin-photo-tile__dim">
                  {p.width}×{p.height}
                </span>
              ) : null}
            </div>
            <div className="hf-admin-photo-tile__actions">
              <button
                className="hf-admin-secondary-action"
                type="button"
                disabled={busy}
                onClick={() => void setCover(media.coverPhotoId === p.id ? null : p.id)}
              >
                {media.coverPhotoId === p.id ? "Quitar portada" : "Usar como portada"}
              </button>
              <button
                className="hf-admin-wizard__ghost"
                type="button"
                disabled={busy || i === 0}
                onClick={() => void movePhoto(p.id, -1)}
                aria-label="Mover arriba"
              >
                ↑
              </button>
              <button
                className="hf-admin-wizard__ghost"
                type="button"
                disabled={busy || i === sorted.length - 1}
                onClick={() => void movePhoto(p.id, 1)}
                aria-label="Mover abajo"
              >
                ↓
              </button>
              <button
                className="hf-admin-danger-action"
                type="button"
                disabled={busy}
                onClick={() => void removePhoto(p.id)}
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function buildAdminContentMediaSummaryDtoClient(
  contentItemId: string
): Promise<AdminContentMediaSummaryDto | null> {
  const res = await fetch(`/api/family/admin/content/${contentItemId}/media`, {
    credentials: "include"
  });
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as { item: AdminContentMediaSummaryDto };
  return data.item;
}
