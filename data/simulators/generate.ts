// Writes the static data the demo reads: the product, the materials and the part contract. Fictional brand "VITRA Atelier".
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { MATERIALS, BASE_PRICE, COMPLICATION, STRAP_PRICE, ENGRAVE, DEFAULT } from "../../packages/domain/src/index.ts";
const out = new URL("../generated/", import.meta.url).pathname; mkdirSync(out, { recursive: true });
const parts = JSON.parse(readFileSync(new URL("../../model/parts.json", import.meta.url), "utf8"));
const product = { id: "vitra-v40", name: "VITRA V40 Automatic", brand: "VITRA Atelier (fictional)", basePrice: BASE_PRICE, assetUri: "/models/watch.glb", caseDiameterMm: 40,
  optionsSchema: { caseMetal: MATERIALS.filter((m) => m.kind === "case").map((m) => m.id), dial: MATERIALS.filter((m) => m.kind === "dial").map((m) => m.id), strap: Object.keys(STRAP_PRICE), complications: Object.keys(COMPLICATION), engraving: { lines: ENGRAVE.lines, perLine: ENGRAVE.perLine, charset: "A-Z 0-9 . , & ' - /" } }, defaults: DEFAULT };
writeFileSync(out + "product.json", JSON.stringify(product)); writeFileSync(out + "materials.json", JSON.stringify(MATERIALS)); writeFileSync(out + "parts.json", JSON.stringify(parts.parts));
console.log(`generated product, ${MATERIALS.length} materials, ${parts.parts.length} parts`);
