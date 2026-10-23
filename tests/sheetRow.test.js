import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSheetRow, incompleteEnrichment, SHEET_HEADERS } from "../src/sheetRow.js";

const enrichment = {
  marca: "GMC",
  modelo: "Yukon",
  version: "Denali Ultimate",
  anio: 2027,
  carroceria: "suv",
  nicho: "suv_grande",
  precio_estimado: 80000,
  confianza: "alta",
};

test("SHEET_HEADERS match spec order", () => {
  assert.deepEqual(SHEET_HEADERS, [
    "video_id",
    "url",
    "marca",
    "modelo",
    "version",
    "anio",
    "carroceria",
    "nicho",
    "precio_estimado",
    "confianza",
    "notas",
    "fecha",
  ]);
});

test("builds a complete row in header order", () => {
  const row = buildSheetRow({
    videoId: "abc",
    url: "https://youtu.be/abc",
    notas: "interior",
    enrichment,
    now: new Date("2026-10-23T22:00:00Z"),
  });
  assert.deepEqual(row, [
    "abc",
    "https://youtu.be/abc",
    "GMC",
    "Yukon",
    "Denali Ultimate",
    2027,
    "suv",
    "suv_grande",
    80000,
    "alta",
    "interior",
    "2026-10-23",
  ]);
});

test("incomplete enrichment still writes identity fields with baja confianza", () => {
  const row = buildSheetRow({
    videoId: "abc",
    url: "https://youtu.be/abc",
    notas: "interior",
    enrichment: incompleteEnrichment(),
    now: new Date("2026-10-23T22:00:00Z"),
  });
  assert.deepEqual(row, [
    "abc",
    "https://youtu.be/abc",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "baja",
    "interior",
    "2026-10-23",
  ]);
});
