// VITRA API: the blueprint's section 12 contract, in memory. Configurations are validated and priced by packages/domain; commissions are idempotent.
import { createServer, type IncomingMessage, type ServerResponse, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { DEFAULT, MATERIALS, movement, price, refNumber, summary, validate } from "../../../packages/domain/src/index.ts";
import type { Commission, Configuration, Selections } from "../../../packages/schemas/src/index.ts";

const product = JSON.parse(readFileSync(new URL("../../../data/generated/product.json", import.meta.url), "utf8"));
export const openapi = { openapi: "3.1.0", info: { title: "VITRA API", version: "1.0.0", description: "Synthetic watch configurator." }, paths: {
  "/v1/products/{id}": { get: {} }, "/v1/materials": { get: {} }, "/v1/configurations": { post: { summary: "Create (validated, priced)" } }, "/v1/configurations/{id}": { patch: { summary: "Change selections" } },
  "/v1/configurations/{id}/preview": { post: { summary: "Preview state: price lines, movement stats, summary" } }, "/v1/commissions": { post: { summary: "Request a quote; Idempotency-Key required" } } } };

export function build() {
  const configs = new Map<string, Configuration>(), commissions = new Map<string, Commission>(), byKey = new Map<string, Commission>();
  const send = (res: ServerResponse, code: number, body: unknown) => { res.writeHead(code, { "content-type": "application/json", "access-control-allow-origin": "*", "access-control-allow-headers": "content-type,idempotency-key", "access-control-allow-methods": "GET,POST,PATCH,OPTIONS" }); res.end(JSON.stringify(body)); };
  const err = (res: ServerResponse, code: number, error: string, details?: string[]) => send(res, code, { error, details });
  async function body(req: IncomingMessage) { let s = ""; for await (const c of req) { s += c; if (s.length > 20_000) throw new RangeError("body too large"); } return s ? JSON.parse(s) : {}; }
  const merge = (base: Selections, p: Partial<Selections>): Selections => ({ ...base, ...p, complications: p.complications ?? base.complications, engraving: p.engraving ?? base.engraving });
  const server: Server = createServer(async (req, res) => {
    try {
      const u = new URL(req.url ?? "/", "http://x"), p = u.pathname.replace(/\/+$/, "") || "/", m = req.method ?? "GET"; let g: RegExpMatchArray | null;
      if (m === "OPTIONS") return send(res, 204, {});
      if (p === "/openapi.json") return send(res, 200, openapi);
      if (p === "/healthz") return send(res, 200, { ok: true });
      if (p === "/v1/materials" && m === "GET") { const k = u.searchParams.get("kind"); return send(res, 200, k ? MATERIALS.filter((x) => x.kind === k) : MATERIALS); }
      if ((g = p.match(/^\/v1\/products\/([\w-]+)$/)) && m === "GET") return g[1] === product.id ? send(res, 200, product) : err(res, 404, "no such product");
      if (p === "/v1/configurations" && m === "POST") {
        const b = await body(req), sel = merge(DEFAULT, b.selections ?? {}), v = validate(sel); if (!v.ok) return err(res, 422, "invalid configuration", v.errors);
        const c: Configuration = { id: `cfg-${configs.size + 1}`, productId: product.id, selections: sel, price: price(sel).total, ref: refNumber(sel), createdAt: new Date().toISOString() }; configs.set(c.id, c); return send(res, 201, c);
      }
      if ((g = p.match(/^\/v1\/configurations\/([\w-]+)(\/preview)?$/))) {
        const c = configs.get(g[1]); if (!c) return err(res, 404, "no such configuration");
        if (g[2] && m === "POST") return send(res, 200, { ref: c.ref, price: price(c.selections), movement: movement(c.selections), summary: summary(c.selections) });
        if (!g[2] && m === "PATCH") { const sel = merge(c.selections, (await body(req)).selections ?? {}), v = validate(sel); if (!v.ok) return err(res, 422, "invalid configuration", v.errors); const n = { ...c, selections: sel, price: price(sel).total, ref: refNumber(sel) }; configs.set(c.id, n); return send(res, 200, n); }
        if (!g[2] && m === "GET") return send(res, 200, c);
      }
      if (p === "/v1/commissions" && m === "POST") {
        const key = req.headers["idempotency-key"]; if (typeof key !== "string" || !key) return err(res, 400, "Idempotency-Key header required");
        const prior = byKey.get(key); if (prior) return send(res, 200, prior);
        const b = await body(req); if (!configs.has(b.configurationId)) return err(res, 404, "no such configuration");
        if (typeof b.customerEmail !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.customerEmail)) return err(res, 422, "customerEmail is not an email address");
        if (typeof b.notes === "string" && b.notes.length > 1000) return err(res, 422, "notes are limited to 1,000 characters");
        const cm: Commission = { id: `com-${commissions.size + 1}`, configurationId: b.configurationId, customerEmail: b.customerEmail, notes: String(b.notes ?? ""), status: "requested", createdAt: new Date().toISOString() };
        commissions.set(cm.id, cm); byKey.set(key, cm); return send(res, 201, cm);
      }
      return err(res, 404, "not found");
    } catch (e) { return err(res, e instanceof SyntaxError || e instanceof RangeError ? 400 : 500, e instanceof Error ? e.message : "error"); }
  });
  return { server, listen: (port = 8640) => new Promise<number>((r) => server.listen(port, () => r((server.address() as { port: number }).port))), close: () => new Promise<void>((r) => { server.closeAllConnections(); server.close(() => r()); }) };
}
if (import.meta.url === `file://${process.argv[1]}`) build().listen().then((p) => console.log(`VITRA API on :${p}`));
