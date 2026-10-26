import { assertEquals } from "@std/assert";
import { handleRequest } from "../src/server.js";

Deno.test("health check is public and never cached", async () => {
  const response = await handleRequest(new Request("http://localhost/healthz"));
  assertEquals(response.status, 200);
  assertEquals(await response.text(), "ok");
  assertEquals(response.headers.get("Cache-Control"), "no-store");
  const head = await handleRequest(new Request("http://localhost/healthz", { method: "HEAD" }));
  assertEquals(await head.text(), "");
});

Deno.test("static server rejects writes", async () => {
  const response = await handleRequest(new Request("http://localhost/", { method: "POST" }));
  assertEquals(response.status, 405);
  assertEquals(response.headers.get("Allow"), "GET, HEAD");
  await response.body.cancel();
});
