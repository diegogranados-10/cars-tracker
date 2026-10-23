import { test } from "node:test";
import assert from "node:assert/strict";
import { replyText } from "../src/replies.js";

test("not_youtube copy", () => {
  assert.equal(
    replyText("not_youtube"),
    "No pude guardar eso. Mándame un link de YouTube.",
  );
});

test("duplicate copy", () => {
  assert.equal(replyText("duplicate"), "Ese video ya está en la hoja.");
});

test("incomplete copy", () => {
  assert.equal(replyText("incomplete"), "Lo guardé incompleto. Revisa la fila.");
});

test("sheets_failed copy", () => {
  assert.equal(
    replyText("sheets_failed"),
    "No se guardó. Hubo un error con la hoja.",
  );
});

test("saved copy includes marca modelo version anio and nicho", () => {
  assert.equal(
    replyText("saved", {
      marca: "GMC",
      modelo: "Yukon",
      version: "Denali Ultimate",
      anio: 2027,
      nicho: "suv_grande",
    }),
    "Guardado: GMC Yukon Denali Ultimate 2027 · suv_grande",
  );
});
