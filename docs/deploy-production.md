# HomeFlix Family V1 — operación en producción (VPS + Docker)

Guía mínima para desplegar y mantener el stack definido en `docker-compose.prod.yml` (Postgres + Next `client` + Nginx). No sustituye el SSOT de dominio en `docs/family-v1/`.

## Requisitos en el servidor

- Docker Engine y plugin **Compose v2** (`docker compose`).
- Repo clonado; trabajo siempre desde la **raíz del clon** (donde está `docker-compose.prod.yml`).
- Archivo `.env.production` (copia de `.env.production.example` con valores reales).

## Levantar producción

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Validar interpolación antes de arrancar:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml config
```

## Healthchecks y estado

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker inspect --format='{{json .State.Health}}' homeflix-prod-postgres
docker inspect --format='{{json .State.Health}}' homeflix-prod-client
docker inspect --format='{{json .State.Health}}' homeflix-prod-nginx
```

- **Postgres:** `pg_isready` (definido en compose).
- **Client:** `GET /api/family/healthz` en `:3000` (Dockerfile).
- **Nginx:** `GET /healthz` interno (responde JSON fijo, no pasa al upstream).

Desde fuera (sustituye host y puerto si usas `NGINX_HTTP_PORT` distinto de 80):

```bash
curl -sS -D- "http://TU_IP_O_DOMINIO/api/family/healthz" -o /dev/null | head -n 15
```

## Logs

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f client
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f nginx
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f postgres
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

- `docker compose ... ps` → `postgres`, `client`, `nginx` en **running** y **healthy**.
- `curl http://…/api/family/healthz` → **200**.
- Puedes iniciar sesión en la app con el admin creado por bootstrap.

## Backups (recordatorio)

- **Base de datos:** volumen Docker `homeflix-postgres-data` (o dump lógico `pg_dump` periódico).
- **Media:** volumen `homeflix-media` (videos/posters/thumbnails bajo `public/storage` en el contenedor).

Sin backups no hay recuperación ante fallo de disco o borrado accidental.

## Script opcional

Desde la raíz del repo:

```bash
bash scripts/deploy-production.sh
```

Por defecto usa `.env.production` en la raíz del clon.
