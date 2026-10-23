export function replyText(kind, payload = {}) {
  switch (kind) {
    case "not_youtube":
      return "No pude guardar eso. Mándame un link de YouTube.";
    case "duplicate":
      return "Ese video ya está en la hoja.";
    case "incomplete":
      return "Lo guardé incompleto. Revisa la fila.";
    case "sheets_failed":
      return "No se guardó. Hubo un error con la hoja.";
    case "saved": {
      const parts = [
        payload.marca,
        payload.modelo,
        payload.version,
        payload.anio,
      ]
        .filter((part) => part !== undefined && part !== null && part !== "")
        .join(" ");
      const nicho = payload.nicho ? ` · ${payload.nicho}` : "";
      return `Guardado: ${parts}${nicho}`;
    }
    default:
      return "No se guardó. Hubo un error con la hoja.";
  }
}
