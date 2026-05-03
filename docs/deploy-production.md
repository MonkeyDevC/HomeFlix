# HomeFlix Family V1 — operación en producción (VPS + Docker)

Guía mínima para desplegar y mantener el stack definido en `docker-compose.prod.yml` (Postgres + Next `client` + Nginx + **Jellyfin** como motor de media interno, fase 1). No sustituye el SSOT de dominio en `docs/family-v1/`.

## Requisitos en el servidor

- Docker Engine y plugin **Compose v2** (`docker compose`).
- Repo clonado; trabajo siempre desde la **raíz del clon** (donde está `docker-compose.prod.yml`).
- Archivo `.env.production` (copia de `.env.production.example` con valores reales).

## Levantar producción

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Desde la raíz del repo también podés usar el atajo:

```bash
./deploy.sh
# o con otro env:
./deploy.sh /ruta/a/.env.production
```

Validar interpolación antes de arrancar:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml config
```

## Jellyfin (fase 1 — solo infra)

HomeFlix conserva la UI y el auth; **Jellyfin** corre en paralelo en la misma red Docker para biblioteca, metadata, streaming y transcodificación. En esta fase **no** se modifican endpoints de la app: solo conviven los contenedores y el volumen de media.

### Acceso al panel de configuración

1. Abrí en el navegador: **`http://IP_DEL_SERVIDOR:8096`** (sustituí `IP_DEL_SERVIDOR` por la IP pública o LAN del VPS; si cambiaste el mapeo, usá el puerto `JELLYFIN_HTTP_PORT` de `.env.production`).
2. Completá el asistente inicial de Jellyfin (usuario admin del servidor multimedia; **no** es el admin de HomeFlix).
3. En **Bibliotecas**, añadí una carpeta que apunte a **`/media`** dentro del contenedor: es el mismo volumen Docker `homeflix-media` que usa el client (`FAMILY_STORAGE_ROOT`), montado **solo lectura** para Jellyfin (config y caché van en `/config` y `/cache`).

**Seguridad:** el puerto **8096** está publicado al host a propósito para la configuración inicial. Cuando pases Jellyfin detrás de Nginx + TLS o solo por VPN, podés dejar de publicar el puerto o restringirlo con firewall.

### Volúmenes Jellyfin

| Volumen compose              | Uso en el contenedor |
|-----------------------------|----------------------|
| `homeflix-jellyfin-config`  | `/config` (BD local, settings) |
| `homeflix-jellyfin-cache`   | `/cache` (transcodes, caché)   |
| `homeflix-media`            | `/media` (misma data que HomeFlix, **ro**) |

## Healthchecks y estado

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker inspect --format='{{json .State.Health}}' homeflix-prod-postgres
docker inspect --format='{{json .State.Health}}' homeflix-prod-client
docker inspect --format='{{json .State.Health}}' homeflix-prod-nginx
docker inspect --format='{{json .State.Health}}' homeflix-prod-jellyfin
```

- **Postgres:** `pg_isready` (definido en compose).
- **Client:** `GET /api/family/healthz` en `:3000` (Dockerfile).
- **Nginx:** `GET /healthz` interno (responde JSON fijo, no pasa al upstream).
- **Jellyfin:** `HEALTHCHECK` de la imagen oficial (`curl` → `/health`).

Desde fuera (sustituye host y puerto si usas `NGINX_HTTP_PORT` distinto de 80):

```bash
curl -sS -D- "http://TU_IP_O_DOMINIO/api/family/healthz" -o /dev/null | head -n 15
```

## Logs

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f client
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f nginx
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f postgres
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f jellyfin
```

Las migraciones Prisma se ejecutan en el **entrypoint** del `client` (`prisma migrate deploy`). Si fallan, el contenedor `client` no pasará a healthy: revisa `DATABASE_URL` y los logs del `client`.

## Bootstrap del primer administrador

No hay seed automático en producción. Tras el primer `up` y con la base migrada:

1. Asegúrate de que **no** exista ya un usuario `admin` si vas a crear el primero (el script lo comprueba).
2. Elige email y contraseña fuerte (mínimo **12** caracteres para el script de bootstrap).
3. Ejecuta **una vez** (variables por `-e` para no guardarlas en disco):

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec \
  -e HOMEFLIX_BOOTSTRAP_ADMIN_EMAIL="admin@tu-dominio.com" \
  -e HOMEFLIX_BOOTSTRAP_ADMIN_PASSWORD="TU_CLAVE_SEGURA_AQUI" \
  client sh -lc 'cd /repo/apps/client && pnpm exec tsx prisma/bootstrap-admin.ts'
```

- Si el usuario **ya existe** y solo quieres **rotar contraseña** y forzar rol admin:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec \
  -e HOMEFLIX_BOOTSTRAP_ADMIN_EMAIL="admin@tu-dominio.com" \
  -e HOMEFLIX_BOOTSTRAP_ADMIN_PASSWORD="NUEVA_CLAVE_SEGURA" \
  -e HOMEFLIX_BOOTSTRAP_RESET_PASSWORD=1 \
  client sh -lc 'cd /repo/apps/client && pnpm exec tsx prisma/bootstrap-admin.ts'
```

Desarrollo local (misma lógica, sin Docker):

```bash
cd apps/client
export DATABASE_URL="postgresql://..."
export HOMEFLIX_BOOTSTRAP_ADMIN_EMAIL="admin@local.test"
export HOMEFLIX_BOOTSTRAP_ADMIN_PASSWORD="clave_de_al_menos_12_chars"
pnpm run bootstrap:admin
```

### Seed de desarrollo (`prisma db seed`)

Sigue disponible para entornos locales; credenciales por defecto solo para dev. Puedes sobreescribir con `HOMEFLIX_SEED_ADMIN_EMAIL` y `HOMEFLIX_SEED_ADMIN_PASSWORD`. En producción usa el bootstrap anterior, no el seed como flujo principal.

## Hardening en Nginx (este repo)

- Rutas **`/dev` y `/dev/*`:** responden **404** en producción detrás de Nginx (consola legacy).
- **`POST /api/family/auth/login`:** rate limit básico por IP (zona `hf_family_login` en `docker/nginx/nginx.conf`).

No afecta streaming (`/api/family/media/`) ni uploads admin largos (`/api/family/admin/content/`).

## ¿Deploy sano?

- `docker compose ... ps` → `postgres`, `client`, `nginx` en **running** y **healthy**; `jellyfin` en **running** (healthy cuando el `/health` de la imagen responde).
- `curl http://…/api/family/healthz` → **200** (vía Nginx o directo al client en diagnóstico).
- Jellyfin: `curl -fsS http://IP:8096/health` (o el puerto configurado) → **200** cuando el servicio está listo.
- Puedes iniciar sesión en la app con el admin creado por bootstrap.

## Backups (recordatorio)

- **Base de datos:** volumen Docker `homeflix-postgres-data` (o dump lógico `pg_dump` periódico).
- **Media:** volumen `homeflix-media` (videos/posters/thumbnails bajo `public/storage` en el contenedor).

Sin backups no hay recuperación ante fallo de disco o borrado accidental.

## Script de despliegue

Desde la raíz del repo:

```bash
./deploy.sh
# equivalente:
bash scripts/deploy-production.sh
```

Por defecto usa `.env.production` en la raíz del clon.
