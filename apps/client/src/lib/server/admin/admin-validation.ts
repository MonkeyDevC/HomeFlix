const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const EDITORIAL = new Set(["draft", "published", "archived"]);
const VISIBILITY = new Set(["private", "household", "public_internal"]);
const CONTENT_TYPE = new Set(["movie", "clip", "episode"]);

export function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

export function assertValidSlug(slug: string): string | null {
  const s = normalizeSlug(slug);
  if (s.length < 2 || s.length > 120) {
    return "El slug debe tener entre 2 y 120 caracteres.";
  }
  if (!SLUG_RE.test(s)) {
    return "El slug solo puede usar minúsculas, números y guiones (sin espacios).";
  }
  return null;
}

export function assertEditorialStatus(v: string): string | null {
  if (!EDITORIAL.has(v)) {
    return "Estado editorial inválido (draft | published | archived).";
  }
  return null;
}

export function assertVisibility(v: string): string | null {
  if (!VISIBILITY.has(v)) {
    return "Visibilidad inválida (private | household | public_internal).";
  }
  return null;
}

export function assertContentType(v: string): string | null {
  if (!CONTENT_TYPE.has(v)) {
    return "Tipo inválido (movie | clip | episode).";
  }
  return null;
}

const ADMIN_EMAIL_MAX = 254;

export function parseAdminEmail(
  raw: unknown
): { ok: true; email: string } | { ok: false; error: string } {
  if (typeof raw !== "string") {
    return { ok: false, error: "Correo obligatorio." };
  }
  const t = raw.trim().toLowerCase();
  if (t.length < 3 || t.length > ADMIN_EMAIL_MAX || !t.includes("@")) {
    return { ok: false, error: "Correo inválido." };
  }
  return { ok: true, email: t };
}

export function parseAdminUserRole(
  raw: unknown,
  fallback: "admin" | "family_viewer"
): { ok: true; role: "admin" | "family_viewer" } | { ok: false; error: string } {
  if (raw === undefined || raw === null || raw === "") {
    return { ok: true, role: fallback };
  }
  if (typeof raw !== "string") {
    return { ok: false, error: "Rol inválido." };
  }
  const r = raw.trim();
  if (r === "admin" || r === "family_viewer") {
    return { ok: true, role: r };
  }
  return { ok: false, error: "Rol debe ser admin o family_viewer." };
}

export function parseAdminPassword(
  raw: unknown,
  required: boolean
): { ok: true; password: string | null } | { ok: false; error: string } {
  if (raw === undefined || raw === null) {
    return required ? { ok: false, error: "Contraseña obligatoria." } : { ok: true, password: null };
  }
  if (typeof raw !== "string") {
    return { ok: false, error: "Contraseña inválida." };
  }
  if (raw === "") {
    return required ? { ok: false, error: "Contraseña obligatoria." } : { ok: true, password: null };
  }
  if (raw.length < 8 || raw.length > 200) {
    return { ok: false, error: "La contraseña debe tener entre 8 y 200 caracteres." };
  }
  return { ok: true, password: raw };
}

export function optionalTrimmedString(
  v: unknown,
  maxLen: number
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (v === undefined || v === null) {
    return { ok: true, value: null };
  }
  if (typeof v !== "string") {
    return { ok: false, error: "Se esperaba texto." };
  }
  const t = v.trim();
  if (t.length > maxLen) {
    return { ok: false, error: `Texto demasiado largo (máx. ${maxLen}).` };
  }
  return { ok: true, value: t.length === 0 ? null : t };
}

const RELEASE_SCOPES = new Set(["admin_only", "public_catalog"]);

export function assertReleaseScope(v: string): string | null {
  if (!RELEASE_SCOPES.has(v)) {
    return "Alcance inválido: usa vista previa solo administradores o catálogo familiar.";
  }
  return null;
}

const MATURITY = new Set(["G", "7+", "13+", "18+"]);

export function optionalPositiveInt(
  v: unknown,
  opts: { min: number; max: number; label: string }
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (v === undefined || v === null) {
    return { ok: true, value: null };
  }
  if (typeof v === "string" && v.trim() === "") {
    return { ok: true, value: null };
  }
  const n = typeof v === "number" ? v : Number.parseInt(String(v), 10);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return { ok: false, error: `${opts.label} debe ser un número entero.` };
  }
  if (n < opts.min || n > opts.max) {
    return { ok: false, error: `${opts.label} fuera de rango (${opts.min}-${opts.max}).` };
  }
  return { ok: true, value: n };
}

export function optionalMaturityRating(
  v: unknown
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (v === undefined || v === null) {
    return { ok: true, value: null };
  }
  if (typeof v !== "string") {
    return { ok: false, error: "Clasificación inválida." };
  }
  const t = v.trim();
  if (t === "") {
    return { ok: true, value: null };
  }
  if (!MATURITY.has(t)) {
    return { ok: false, error: "Clasificación debe ser G, 7+, 13+ o 18+." };
  }
  return { ok: true, value: t };
}
