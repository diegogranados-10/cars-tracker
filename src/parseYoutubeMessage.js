const YOUTUBE_URL =
  /https?:\/\/(?:(?:www\.|m\.)?youtube\.com\/(?:watch\?(?:[^\s]*&)?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})[^\s]*/i;

export function parseYoutubeMessage(text) {
  if (typeof text !== "string" || text.length === 0) {
    return { ok: false };
  }

  const match = text.match(YOUTUBE_URL);
  if (!match) {
    return { ok: false };
  }

  const url = match[0].replace(/[),.;!?]+$/, "");
  const videoId = match[1];
  const notas = `${text.slice(0, match.index)} ${text.slice(match.index + match[0].length)}`
    .replace(/\s+/g, " ")
    .trim();

  return { ok: true, url, videoId, notas };
}
