import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { build } from "../src/server.ts";
const api = build(); let base = "";
beforeAll(async () => { base = `http://127.0.0.1:${await api.listen(0)}`; }); afterAll(() => api.close());
const j = async (path: string, init?: RequestInit) => { const r = await fetch(base + path, init); return { status: r.status, body: (await r.json()) as any }; };
const send = (method: string, path: string, b: unknown, h: Record<string, string> = {}) => j(path, { method, headers: { "content-type": "application/json", ...h }, body: JSON.stringify(b) });

describe("catalogue", () => {
  it("serves the product, materials (filterable) and OpenAPI 3.1", async () => {
    expect((await j("/v1/products/vitra-v40")).body.basePrice).toBe(4800); expect((await j("/v1/products/nope")).status).toBe(404);
    expect((await j("/v1/materials")).body).toHaveLength(8); expect((await j("/v1/materials?kind=dial")).body).toHaveLength(4);
    expect((await j("/openapi.json")).body.openapi).toBe("3.1.0");
  });
});
describe("configurations", () => {
  it("creates with defaults, prices server-side, and patches", async () => {
    const c = await send("POST", "/v1/configurations", { selections: { caseMetal: "titanium", complications: ["date"] } });
    expect(c.status).toBe(201); expect(c.body.price).toBe(4800 + 600 + 450); expect(c.body.ref).toMatch(/^VT-/);
    const p = await send("PATCH", `/v1/configurations/${c.body.id}`, { selections: { dial: "ivory-enamel" } });
    expect(p.body.price).toBe(4800 + 600 + 150 + 450); expect(p.body.selections.complications).toEqual(["date"]);
    const pv = await send("POST", `/v1/configurations/${c.body.id}/preview`, {}); expect(pv.body.movement.parts).toBe(133); expect(pv.body.summary).toContain("Estimate");
  });
  it("refuses invalid combinations with the reasons, on create and patch", async () => {
    const bad = await send("POST", "/v1/configurations", { selections: { complications: ["moon"] } }); expect(bad.status).toBe(422); expect(bad.body.details).toContain("Moon phase needs the Date module");
    const ok = await send("POST", "/v1/configurations", {}); const p = await send("PATCH", `/v1/configurations/${ok.body.id}`, { selections: { caseMetal: "ceramic", strap: "bracelet" } }); expect(p.status).toBe(422);
    expect((await j("/v1/configurations/zzz")).status).toBe(404); expect((await send("PATCH", "/v1/configurations/zzz", {})).status).toBe(404);
  });
});
describe("commissions", () => {
  it("need an idempotency key, a real configuration and an email; replay is safe", async () => {
    const cfg = (await send("POST", "/v1/configurations", {})).body.id, mail = "buyer@example.com";
    expect((await send("POST", "/v1/commissions", { configurationId: cfg, customerEmail: mail })).status).toBe(400);
    expect((await send("POST", "/v1/commissions", { configurationId: "x", customerEmail: mail }, { "idempotency-key": "a" })).status).toBe(404);
    expect((await send("POST", "/v1/commissions", { configurationId: cfg, customerEmail: "nope" }, { "idempotency-key": "b" })).status).toBe(422);
    expect((await send("POST", "/v1/commissions", { configurationId: cfg, customerEmail: mail, notes: "x".repeat(1001) }, { "idempotency-key": "c" })).status).toBe(422);
    const a = await send("POST", "/v1/commissions", { configurationId: cfg, customerEmail: mail }, { "idempotency-key": "k" }), b = await send("POST", "/v1/commissions", { configurationId: cfg, customerEmail: mail }, { "idempotency-key": "k" });
    expect(a.status).toBe(201); expect(b.status).toBe(200); expect(b.body.id).toBe(a.body.id);
  });
  it("rejects malformed JSON", async () => { const r = await fetch(base + "/v1/configurations", { method: "POST", body: "{" }); expect(r.status).toBe(400); });
});
