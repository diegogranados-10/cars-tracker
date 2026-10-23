import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeEnrichment } from "../src/sanitizeEnrichment.js";

const valid = {
  marca: "GMC",
  modelo: "Yukon",
  version: "Denali Ultimate",
  anio: 2027,
  carroceria: "suv",
  nicho: "suv_grande",
  precio_estimado: 80000,
  confianza: "alta",
};

test("keeps a valid enrichment object", () => {
  assert.deepEqual(sanitizeEnrichment(valid), valid);
});

test("drops free-text nicho", () => {
  assert.equal(sanitizeEnrichment({ ...valid, nicho: "SUV grande" }).nicho, "");
});

test("drops case-mismatched carroceria", () => {
  assert.equal(sanitizeEnrichment({ ...valid, carroceria: "SUV" }).carroceria, "");
});

test("drops string prices", () => {
  assert.equal(
    sanitizeEnrichment({ ...valid, precio_estimado: "$80,000" }).precio_estimado,
    "",
  );
});

test("keeps numeric prices", () => {
  assert.equal(sanitizeEnrichment({ ...valid, precio_estimado: 80000 }).precio_estimado, 80000);
});

test("coerces a 4-digit year string", () => {
  assert.equal(sanitizeEnrichment({ ...valid, anio: "2027" }).anio, 2027);
});

test("rejects a two-digit year", () => {
  assert.equal(sanitizeEnrichment({ ...valid, anio: 99 }).anio, "");
});

test("missing raw becomes empty with baja confianza", () => {
  assert.deepEqual(sanitizeEnrichment(null), {
    marca: "",
    modelo: "",
    version: "",
    anio: "",
    carroceria: "",
    nicho: "",
    precio_estimado: "",
    confianza: "baja",
  });
});

test("unknown confianza becomes baja", () => {
  assert.equal(sanitizeEnrichment({ ...valid, confianza: "maybe" }).confianza, "baja");
});

test("missing version is empty", () => {
  const { version: _drop, ...rest } = valid;
  assert.equal(sanitizeEnrichment(rest).version, "");
});
