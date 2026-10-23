import { CARROCERIA, CONFIANZA, NICHO } from "./constants.js";

const EMPTY = {
  marca: "",
  modelo: "",
  version: "",
  anio: "",
  carroceria: "",
  nicho: "",
  precio_estimado: "",
  confianza: "baja",
};

function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function pickEnum(value, list) {
  return typeof value === "string" && list.includes(value) ? value : "";
}

function asYear(value) {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isInteger(n) || n < 1900 || n > 2100) {
    return "";
  }
  return n;
}

function asPrice(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : "";
}

export function sanitizeEnrichment(raw) {
  if (raw === null || raw === undefined || typeof raw !== "object") {
    return { ...EMPTY };
  }

  const confianza = pickEnum(raw.confianza, CONFIANZA) || "baja";

  return {
    marca: asTrimmedString(raw.marca),
    modelo: asTrimmedString(raw.modelo),
    version: asTrimmedString(raw.version),
    anio: asYear(raw.anio),
    carroceria: pickEnum(raw.carroceria, CARROCERIA),
    nicho: pickEnum(raw.nicho, NICHO),
    precio_estimado: asPrice(raw.precio_estimado),
    confianza,
  };
}
