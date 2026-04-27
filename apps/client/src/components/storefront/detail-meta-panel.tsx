import Link from "next/link";
import type {
  ContentDetailFamilyDto,
  LocalPlaybackDto,
  LocalPlaybackStateFamily
} from "../../lib/family/domain-shapes";
import { formatRuntimeMinutes } from "../../lib/family/playback-time";
import type { DetailRelatedItemDto } from "../../lib/server/catalog/content-detail-related";

function playbackStatusLabel(
  state: LocalPlaybackStateFamily,
  contentType: ContentDetailFamilyDto["type"]
): string {
  if (contentType === "photo_gallery") {
    return "Galería de imágenes";
  }
  switch (state.state) {
    case "ready":
      return "Listo para reproducir";
    case "missing_media":
      return "Sin video aún";
    case "file_missing":
      return "Archivo no encontrado";
    case "asset_unusable":
      return "Asset no reproducible";
    default:
      return "—";
  }
}

/**
 * Extrae el DTO técnico del estado de playback cuando aplica.
 * `missing_media` y `asset_unusable` no tienen playback, así que devuelven null.
 */
function extractPlaybackInfo(state: LocalPlaybackStateFamily): LocalPlaybackDto | null {
  if (state.state === "ready" || state.state === "file_missing") {
    return state.playback;
  }
  return null;
}

function formatResolution(info: LocalPlaybackDto): string | null {
  if (info.width === null || info.height === null || info.width <= 0 || info.height <= 0) {
    return null;
  }
  const tier = info.height >= 2160
    ? "4K"
    : info.height >= 1440
      ? "1440p"
      : info.height >= 1080
        ? "1080p"
        : info.height >= 720
          ? "720p"
          : info.height >= 480
            ? "480p"
            : `${info.height}p`;
  return `${tier} · ${info.width}×${info.height}`;
}

function formatFrameRate(fps: number | null): string | null {
  if (fps === null || fps <= 0) return null;
  const rounded = Math.round(fps * 100) / 100;
  return `${rounded} fps`;
}

/**
 * Normaliza el nombre del códec para que sea legible y etiqueta cuando el
 * navegador típicamente no puede decodificarlo (muestra negro).
 *
 * AV1 se excluye a propósito: Chrome/Edge lo soportan sólo cuando hay
 * decodificador hardware o el perfil del archivo coincide con dav1d; en
 * Windows sin GPU compatible suele dar "audio sí, video en negro".
 */
const BROWSER_FRIENDLY_CODECS = new Set(["h264", "avc1", "vp8", "vp9"]);

function formatCodec(codec: string | null): { label: string; friendly: boolean } | null {
  if (codec === null || codec.trim() === "") return null;
  const key = codec.trim().toLowerCase();
  const pretty = key === "h264"
    ? "H.264 / AVC"
    : key === "hevc" || key === "h265"
      ? "H.265 / HEVC"
      : key === "av1" || key === "av01"
        ? "AV1"
        : key === "vp9"
          ? "VP9"
          : key === "vp8"
            ? "VP8"
            : codec;
  return { label: pretty, friendly: BROWSER_FRIENDLY_CODECS.has(key) };
}

function contentTypeLabel(type: ContentDetailFamilyDto["type"]): string {
  switch (type) {
    case "movie":
      return "Película original";
    case "episode":
      return "Episodio de serie";
    case "clip":
      return "Clip";
    case "photo_gallery":
      return "Galería de fotos";
    default:
      return "Contenido";
  }
}

function visibilityLabel(v: ContentDetailFamilyDto["visibility"]): string {
  switch (v) {
    case "household":
      return "Familia";
    case "private":
      return "Privado";
    case "public_internal":
      return "Interno";
    default:
      return v;
  }
}

export function DetailMetaPanel({
  item,
  playback,
  durationSeconds,
  shareUrl,
  moreLikeThis
}: Readonly<{
  item: ContentDetailFamilyDto;
  playback: LocalPlaybackStateFamily;
  durationSeconds: number | null;
  shareUrl: string;
  moreLikeThis: readonly DetailRelatedItemDto[];
}>) {
  const runtime = formatRuntimeMinutes(durationSeconds);
  const collections = item.collections;
  const playbackInfo = extractPlaybackInfo(playback);
  const resolution = playbackInfo !== null ? formatResolution(playbackInfo) : null;
  const frameRate = playbackInfo !== null ? formatFrameRate(playbackInfo.frameRate) : null;
  const codec = playbackInfo !== null ? formatCodec(playbackInfo.codec) : null;

  return (
    <aside className="sf-detail-meta" aria-label="Detalles del contenido">
      <div className="sf-detail-meta-card">
        <section className="sf-detail-meta-section">
          <h3 className="sf-detail-meta-heading">Detalles</h3>
          <dl className="sf-detail-meta-list">
            <div className="sf-detail-meta-row">
              <dt>Categoría</dt>
              <dd>{item.category?.name ?? "—"}</dd>
            </div>
            <div className="sf-detail-meta-row">
              <dt>Tipo</dt>
              <dd>{contentTypeLabel(item.type)}</dd>
            </div>
            <div className="sf-detail-meta-row">
              <dt>Duración</dt>
              <dd>{runtime ?? "—"}</dd>
            </div>
            <div className="sf-detail-meta-row">
              <dt>Reproducción</dt>
              <dd>{playbackStatusLabel(playback, item.type)}</dd>
            </div>
            <div className="sf-detail-meta-row">
              <dt>Visibilidad</dt>
              <dd>{visibilityLabel(item.visibility)}</dd>
            </div>
            <div className="sf-detail-meta-row">
              <dt>En el hogar</dt>
              <dd>
                {item.releaseScope === "admin_only"
                  ? "Vista previa solo administradores"
                  : "Catálogo familiar"}
              </dd>
            </div>
          </dl>
        </section>

        {playbackInfo !== null && (resolution !== null || frameRate !== null || codec !== null) ? (
          <section className="sf-detail-meta-section">
            <h3 className="sf-detail-meta-heading">Ficha técnica</h3>
            <dl className="sf-detail-meta-list">
              {resolution !== null ? (
                <div className="sf-detail-meta-row">
                  <dt>Resolución</dt>
                  <dd>{resolution}</dd>
                </div>
              ) : null}
              {frameRate !== null ? (
                <div className="sf-detail-meta-row">
                  <dt>Frame rate</dt>
                  <dd>{frameRate}</dd>
                </div>
              ) : null}
              {codec !== null ? (
                <div className="sf-detail-meta-row">
                  <dt>Códec</dt>
                  <dd>
                    <span className={`sf-detail-meta-codec${codec.friendly ? "" : " is-warn"}`}>
                      {codec.label}
                    </span>
                    {!codec.friendly ? (
                      <span className="sf-detail-meta-codec-hint">
                        Tu navegador puede no decodificarlo.
                      </span>
                    ) : null}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}

        {collections.length > 0 ? (
          <section className="sf-detail-meta-section">
            <h3 className="sf-detail-meta-heading">Colección</h3>
            <div className="sf-detail-meta-chips">
              {collections.map((c) => (
                <span key={c.id} className="sf-detail-meta-chip">
                  {c.name}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {moreLikeThis.length > 0 ? (
          <section className="sf-detail-meta-section">
            <h3 className="sf-detail-meta-heading">Más contenido para ti</h3>
            <ul className="sf-detail-meta-similar">
              {moreLikeThis.slice(0, 4).map((it) => {
                const art = it.posterPath ?? it.thumbnailPath;
                return (
                  <li key={it.id} className="sf-detail-meta-similar-item">
                    <Link
                      aria-label={it.title}
                      className="sf-detail-meta-similar-card"
                      href={`/c/${it.slug}`}
                      prefetch={false}
                    >
                      {art !== null ? (
                        <img
                          alt=""
                          className="sf-detail-meta-similar-img"
                          loading="lazy"
                          src={art}
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="sf-detail-meta-similar-placeholder"
                        />
                      )}
                      <div className="sf-detail-meta-similar-scrim" aria-hidden="true" />
                      <span className="sf-detail-meta-similar-label">{it.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section className="sf-detail-meta-section sf-detail-meta-section--share">
          <Link className="sf-detail-meta-share" href={shareUrl}>
            <svg aria-hidden="true" height="18" viewBox="0 0 24 24" width="18">
              <path
                d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"
                fill="currentColor"
              />
            </svg>
            <span>Compartir este {item.type === "episode" ? "capítulo" : item.type === "movie" ? "título" : "contenido"}</span>
          </Link>
        </section>
      </div>
    </aside>
  );
}
