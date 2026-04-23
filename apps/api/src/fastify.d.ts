import type { CatalogAuthContext } from "./modules/catalog/catalog-authz.js";

declare module "fastify" {
  interface FastifyRequest {
    auth?: CatalogAuthContext;
  }
}
