# FASE 9 — Hardening de seguridad y consistencia

## Objetivo

Endurecer Family V1 sin agregar features de producto:

- control de acceso consistente en APIs
- validación server-side más estricta
- errores HTTP coherentes
- reproducción local con acceso validado
- reducción de bypass por archivos públicos de video

## Cambios principales

### 1) Guard unificado para APIs de consumo

Se incorpora `requireStorefrontApi()` para centralizar:

- sesión válida (`401`)
- perfil activo válido (`403`)

Aplicado en endpoints de consumo e historial:

- `/api/family/catalog`
- `/api/family/home`
- `/api/family/search`
- `/api/family/content/[slug]/detail`
- `/api/family/history/*`

### 2) Errores consistentes

Se agrega helper `family-api-errors.ts` con respuestas estándar:

- `unauthorizedResponse()` → `401`
- `forbiddenResponse()` → `403`
- `notFoundResponse()` → `404`
- `badRequestResponse()` → `400`
- `serviceUnavailableResponse()` → `503`

### 3) Protección de media de reproducción

Se crea proxy validado:

- `GET /api/family/media/[id]`

Solo sirve archivo si:

- hay sesión + perfil activo
- `MediaAsset` está `ready`
- el `ContentItem` está `published`
- existe `ProfileContentAccess` para el perfil activo
- el archivo físico existe

Si falla cualquier check: `404`.

Además, se bloquea acceso directo a video público:

- `middleware.ts` devuelve `404` para `/storage/videos/*`

El player ya no usa path directo de disco; consume URL proxy (`/api/family/media/{mediaAssetId}`).

### 4) Historial más robusto

- `POST /api/family/history/upsert` responde `404` cuando el contenido no es visible o el media no es reproducible (sin filtrar existencia/estado).
- Continue Watching limpia entradas inválidas/corruptas al cargar (si el media ya no es reproducible).

### 5) Hardening de inputs admin

Se corrigen validaciones en `PATCH` para evitar `500` por tipos inválidos en:

- categorías
- colecciones
- contenido

Y se maneja conflicto de dependencias (`P2003`) como `409` en operaciones de update/delete relevantes.

### 6) Endpoint técnico endurecido

- `/api/family/db-health` deja de ser público y requiere admin.

## Resultado

Family V1 mantiene la simplicidad, pero con controles más estrictos:

- backend como única verdad
- menos filtración por códigos de error
- menos superficie de bypass para video local
- validaciones más robustas en admin y consumo

