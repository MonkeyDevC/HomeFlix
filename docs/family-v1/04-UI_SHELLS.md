# UI — shells y componentes base (Family V1)

## Objetivo visual

- **Simple**, legible, **dark mode** compatible (`prefers-color-scheme` y/o clase en raíz).
- Storefront: **tipo Netflix familiar** (denso en contenido, poco cromo corporativo).
- Admin: sobrio, tablas claras, sin “consola enterprise”.

## Shells (rutas / layout)

| Shell | Ruta / grupo | Función |
|-------|----------------|---------|
| `StorefrontShell` | `(storefront)/layout` | Chrome consumo: nav perfil, búsqueda básica. **Hoy**: `ConsumeAppChrome`; evolucionar sin API externa. |
| `AdminShell` | `(admin)/layout` | Sidebar/top mínimos, área de contenido. |
| `AuthShell` | `(auth)/auth/layout` | Centrado, formulario login, sin distracciones. |
| `AppShell` | `app/layout.tsx` | HTML/body, providers globales. |

## Componentes base (implementación mínima en FASE 0)

Ubicación código: `apps/client/src/components/family-ui/`.

| Componente | Uso |
|------------|-----|
| `FamilyPageHeader` | Título + descripción opcional de página. |
| `FamilySectionLayout` | Contenedor max-width + padding vertical. |
| `FamilyEmptyState` | Mensaje cuando no hay ítems. |
| `FamilyErrorState` | Mensaje de error amigable. |
| `FamilyLoadingState` | Placeholder de carga (texto o skeleton mínimo). |

Reglas: **pequeños**, sin lógica de negocio, sin fetch; presentacionales.

## Qué no hacer

- Reutilizar estilos de `dev-console.css` en storefront/admin Family V1.
- Pantallas “temporales” sin intención de borrar: todo placeholder debe estar marcado o bajo rutas claramente `legacy`.
