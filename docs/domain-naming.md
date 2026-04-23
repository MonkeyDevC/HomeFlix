# Naming definitivo del dominio

Estos nombres quedan congelados antes de FASE 1.

## Entidades canonicas

- `ContentItem`
- `MediaAsset`
- `Collection`
- `Category`
- `Profile`

## Reglas

- En TypeScript se usan nombres PascalCase.
- En persistencia futura se puede usar snake_case, pero sin cambiar el concepto.
- `ContentItem` no debe renombrarse a `Movie`, `Video`, `Title` o `Content`.
- `MediaAsset` no debe renombrarse a `Video`, `File`, `Asset` o `Media`.
- `Profile` representa la identidad de consumo dentro de HomeFlix, no el usuario de autenticacion productiva.
- `Collection` agrupa contenido editorialmente.
- `Category` clasifica contenido.

## Motivo

Congelar naming evita migraciones tempranas, duplicacion de contratos y desacuerdos entre CMS, API y client.
