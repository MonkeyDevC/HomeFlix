# Snapshot Directus (opcional)

Este directorio está montado en el contenedor Directus como `/directus/snapshot` (ver `docker-compose.dev.yml`).

## Por qué puede estar vacío

Un **snapshot YAML/JSON válido** depende de la versión exacta de Directus y del estado importado en Studio. No se versiona aquí un snapshot generado a ciegas sin ejecutar Directus.

## Flujo recomendado para el equipo

1. Seguir `apps/cms/bootstrap/IMPORT-RUNBOOK.md` en un entorno con Docker.
2. Cuando el modelo en Studio sea correcto, ejecutar **export** desde el contenedor:

   ```bash
   docker compose -f docker-compose.dev.yml exec directus \
     npx directus schema snapshot /directus/snapshot/editorial-baseline.yaml --format yaml --yes
   ```

3. Commit del archivo `editorial-baseline.yaml` resultante.
4. En CI u otros devs, **apply**:

   ```bash
   docker compose -f docker-compose.dev.yml exec directus \
     npx directus schema apply /directus/snapshot/editorial-baseline.yaml --yes
   ```

Si el export no es viable (política de licencias, CI sin Docker), el runbook de importación manual sigue siendo la fuente de verdad reproducible.
