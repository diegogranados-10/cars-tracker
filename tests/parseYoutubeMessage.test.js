import { test } from "node:test";
import assert from "node:assert/strict";
import { parseYoutubeMessage } from "../src/parseYoutubeMessage.js";

const ID = "dQw4w9WgXcQ";

test("watch?v= extracts videoId and exact url substring", () => {
  const url = `https://www.youtube.com/watch?v=${ID}`;
  const result = parseYoutubeMessage(url);
  assert.deepEqual(result, { ok: true, url, videoId: ID, notas: "" });
});

test("youtu.be extracts the same videoId", () => {
  const url = `https://youtu.be/${ID}`;
  const result = parseYoutubeMessage(url);
  assert.equal(result.ok, true);
  assert.equal(result.videoId, ID);
  assert.equal(result.url, url);
});

test("youtube.com/shorts extracts the same videoId", () => {
  const url = `https://www.youtube.com/shorts/${ID}`;
  const result = parseYoutubeMessage(url);
  assert.equal(result.ok, true);
  assert.equal(result.videoId, ID);
  assert.equal(result.url, url);
});

test("youtube.com/embed extracts the same videoId", () => {
  const url = `https://www.youtube.com/embed/${ID}`;
  const result = parseYoutubeMessage(url);
  assert.equal(result.ok, true);
  assert.equal(result.videoId, ID);
  assert.equal(result.url, url);
});

test("m.youtube.com/watch extracts the same videoId", () => {
  const url = `https://m.youtube.com/watch?v=${ID}`;
  const result = parseYoutubeMessage(url);
  assert.equal(result.ok, true);
  assert.equal(result.videoId, ID);
  assert.equal(result.url, url);
});

test("strips the first URL and collapses leftover text into notas", () => {
  const result = parseYoutubeMessage(
    `mira esto https://youtu.be/${ID} me gusta el interior`,
  );
  assert.equal(result.ok, true);
  assert.equal(result.notas, "mira esto me gusta el interior");
});

test("two URLs: first wins", () => {
  const first = "https://youtu.be/aaaaaaaaaaa";
  const second = "https://youtu.be/bbbbbbbbbbb";
  const result = parseYoutubeMessage(`${first} ${second}`);
  assert.equal(result.ok, true);
  assert.equal(result.videoId, "aaaaaaaaaaa");
  assert.equal(result.url, first);
});

test("plain text is not a YouTube link", () => {
  assert.deepEqual(parseYoutubeMessage("hola"), { ok: false });
});

test("empty string is not a YouTube link", () => {
  assert.deepEqual(parseYoutubeMessage(""), { ok: false });
});
