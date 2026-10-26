import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import sirv from "sirv";

// Only the production bundle is served. No authentication or live TTS calls.
export function createStaticServer(root = fileURLToPath(new URL("../dist/", import.meta.url))) {
  const serve = sirv(root, {
    etag: true,
    dotfiles: false,
    single: false,
    setHeaders(response, path) {
      response.setHeader(
        "Cache-Control",
        /^\/assets\/.+-[\w-]{8,}\.[\w]+$/.test(path) ? "public, max-age=31536000, immutable" : "no-cache",
      );
    },
  });
  return createServer((request, response) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "same-origin");
    response.setHeader("Cache-Control", "no-cache");
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end("Method not allowed");
      return;
    }
    if (request.url.split("?", 1)[0] === "/healthz") {
      response.writeHead(200, { "Content-Type": "text/plain", "Cache-Control": "no-store" });
      response.end(request.method === "HEAD" ? undefined : "ok");
      return;
    }
    serve(request, response, () => {
      response.writeHead(404, { "Content-Type": "text/plain" });
      response.end("Not found");
    });
  });
}

if (import.meta.main) {
  const port = Number(process.env.PORT || 8080);
  const server = createStaticServer();
  server.listen(port, "0.0.0.0", () => console.log(`Serving dist on port ${port}`));
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => server.close());
  }
}
