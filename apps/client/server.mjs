/**
 * Servidor HTTP de producción con timeouts altos para uploads largos (p. ej. video
 * vía streaming multipart). `next start` usa `requestTimeout` por defecto (~300s),
 * lo que corta peticiones lentas antes de que termine el cuerpo.
 *
 * @see https://nodejs.org/api/http.html#serverrequesttimeout
 */
import http from "node:http";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

if (!Number.isFinite(port) || port <= 0) {
  console.error("[homeflix:server] PORT inválido:", process.env.PORT);
  process.exit(1);
}

const app = next({ dev, hostname, port });
await app.prepare();
const handle = app.getRequestHandler();

const server = http.createServer((req, res) => {
  void handle(req, res);
});

/** 1 h — tiempo máximo para leer la petición completa (incl. cuerpo). */
server.requestTimeout = 60 * 60 * 1000;
/** Debe ser > requestTimeout (recomendación Node para keep-alive / headers). */
server.headersTimeout = 65 * 60 * 1000;
/** Cierre de sockets keep-alive inactivos (valor pedido por ops). */
server.keepAliveTimeout = 65 * 1000;
/** Sin tope de inactividad en el socket (0 = desactivado). */
server.timeout = 0;

server.on("error", (err) => {
  console.error("[homeflix:server] listen_error", err);
  process.exit(1);
});

server.listen(port, hostname, () => {
  console.log(
    `[homeflix:server] ready NODE_ENV=${process.env.NODE_ENV ?? ""} http://${hostname}:${port} requestTimeout=${server.requestTimeout}ms headersTimeout=${server.headersTimeout}ms`
  );
});
