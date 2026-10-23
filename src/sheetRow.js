import { SHEET_HEADERS } from "./constants.js";

export { SHEET_HEADERS };

export function incompleteEnrichment() {
  return {
    marca: "",
    modelo: "",
    version: "",
    anio: "",
    carroceria: "",
    nicho: "",
    precio_estimado: "",
    confianza: "baja",
  };
}

export function buildSheetRow({ videoId, url, notas, enrichment, now }) {
  const e = enrichment ?? incompleteEnrichment();
  const fecha = now.toISOString().slice(0, 10);
  return [
    videoId,
    url,
    e.marca,
    e.modelo,
    e.version,
    e.anio,
    e.carroceria,
    e.nicho,
    e.precio_estimado,
    e.confianza,
    notas ?? "",
    fecha,
  ];
}
