import { afterAll, assert, beforeAll, test } from "vite-plus/test";
import { once } from "node:events";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStaticServer } from "../src/server.js";

let root, server, base;
beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "drawing-server-"));
  await mkdir(join(root, "assets"));
  await writeFile(join(root, "index.html"), "<!doctype html><title>Drawing world</title>");
  await writeFile(join(root, "assets/song-abcdefgh.mp3"), "0123456789");
  await writeFile(join(root, ".secret"), "private");
  server = createStaticServer(root);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}`;
});
afterAll(async () => {
  if (server)
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  if (root) await rm(root, { recursive: true, force: true });
});

test("health check is public and never cached", async () => {
  const response = await fetch(`${base}/healthz`);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "ok");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  const head = await fetch(`${base}/healthz`, { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
});

test("static server rejects writes", async () => {
  const response = await fetch(base, { method: "POST" });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET, HEAD");
  await response.text();
});

test("serves the index and HEAD with revalidation and security headers", async () => {
  const response = await fetch(base);
  assert.equal(response.status, 200);
  assert.include(response.headers.get("Content-Type"), "text/html");
  assert.equal(response.headers.get("Cache-Control"), "no-cache");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(response.headers.get("Referrer-Policy"), "same-origin");
  assert.include(await response.text(), "Drawing world");
  const head = await fetch(base, { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("Content-Length"), response.headers.get("Content-Length"));
  assert.equal(await head.text(), "");
});

test("hashed assets are immutable and audio supports byte ranges", async () => {
  const response = await fetch(`${base}/assets/song-abcdefgh.mp3`, { headers: { Range: "bytes=2-5" } });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("Content-Range"), "bytes 2-5/10");
  assert.equal(response.headers.get("Cache-Control"), "public, max-age=31536000, immutable");
  assert.equal(await response.text(), "2345");
});

test("missing files, directories, dotfiles and traversal are never served", async () => {
  for (const path of [
    "/missing",
    "/assets/",
    "/.secret",
    "/%2esecret",
    "/..%2fpackage.json",
    "/src/server.js",
  ]) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 404, path);
    assert.equal(response.headers.get("Cache-Control"), "no-cache");
    await response.text();
  }
});
