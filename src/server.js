// The container runs this standalone, without the game's local Caper import map.
// deno-lint-ignore no-import-prefix
import { serveDir } from "jsr:@std/http@1.0.21/file-server";

// Only the production bundle is served. No authentication or live TTS calls.
export async function handleRequest(request) {
  if (!["GET", "HEAD"].includes(request.method)) {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  const path = new URL(request.url).pathname;
  if (path === "/healthz") {
    return new Response(request.method === "HEAD" ? null : "ok", {
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
    });
  }
  const fileRequest = request.method === "HEAD" ? new Request(request, { method: "GET" }) : request;
  const response = await serveDir(fileRequest, {
    fsRoot: "dist",
    showDirListing: false,
    showDotfiles: false,
    quiet: true,
  });
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "same-origin");
  response.headers.set(
    "Cache-Control",
    response.ok && /^\/assets\/.+-[\w-]{8,}\.[\w]+$/.test(path)
      ? "public, max-age=31536000, immutable"
      : "no-cache",
  );
  if (request.method === "HEAD") {
    await response.body?.cancel();
    return new Response(null, response);
  }
  return response;
}

if (import.meta.main) {
  Deno.serve({ hostname: "0.0.0.0", port: Number(Deno.env.get("PORT") || 8080) }, handleRequest);
}
