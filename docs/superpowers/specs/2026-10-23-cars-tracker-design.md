# Cars Tracker — Design

Date: 2026-10-23
Status: approved in conversation; awaiting user review of this document

## Intent

Capture YouTube car-review links from Telegram, extract structured car data, and store one row per video in Google Sheets so the owner can filter later by brand, model, version, year, body, and commercial niche.

Telegram is the inbox. Google Sheets is the catalog. n8n is the only backend.

## Why this shape

The work is a pipeline, not an app. The owner already has self-hosted n8n and an LLM credential there. A Django/Postgres app would delay the first saved car by weeks. Sheets is both the database and the filter UI for v1.

## Goals

- Send a YouTube link from the phone (Share to Telegram) and get a row in the sheet.
- Extract marca, modelo, version, anio, carroceria, and nicho from the video title via an LLM.
- Store an estimated USD price only when the model can justify it.
- Keep the original URL.
- Deduplicate by YouTube `video_id`.
- Filter in Google Sheets the same day the first rows land.

## Non-goals (v1)

- Web UI, Django, or Postgres.
- Multi-user access.
- WhatsApp, web chat, or email inbox.
- Treating price as a hard fact.
- Storing YouTube title or channel in the sheet.
- A currency column. All prices are USD.

## Anti-goals

- Duplicate rows for the same video.
- Invented versions or invented prices written as if they were real.
- Open bot that anyone can write into.
- Free-text niche labels that break filters (`SUV grande` vs `suv_grande`).

## Constraints

- Engine: existing self-hosted n8n. No new backend.
- Inbox: Telegram bot, private, allowlist of one Telegram user id.
- Catalog: one Google Sheet, one tab.
- Enrichment: the LLM already configured in that n8n instance. The workflow is provider-agnostic.
- Language of bot replies: Spanish.
- Sheet column names: the identifiers below, not translated headers.

## Decided how

### Capture

The owner sends a message that contains a YouTube URL, optionally plus a free-text note.

Accepted URL shapes: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`, `youtube.com/embed/`, `m.youtube.com`. First YouTube URL in the message wins. The rest of the text (minus the URL) is `notas`.

If the message has no YouTube URL, the bot replies that it cannot save it and writes nothing.

### Enrichment

n8n resolves `video_id` and fetches the official title via YouTube oEmbed (`https://www.youtube.com/oembed?url=...&format=json`). No YouTube Data API key. Title and channel are used only as LLM input. They are not written to the sheet.

The LLM returns strict JSON matching the schema below. It must pick `carroceria` and `nicho` from the closed lists. It must leave `version` empty when the title does not name a trim. It must leave `precio_estimado` empty when it cannot justify a USD figure. It must not invent values to fill the row.

### Sheet row

One row per new `video_id`. Columns, in this order:

| Column | Type | Notes |
| --- | --- | --- |
| `video_id` | string | Dedup key |
| `url` | string | The YouTube link as sent, not rewritten |
| `marca` | string | Empty if unknown |
| `modelo` | string | Empty if unknown |
| `version` | string | Trim (TRD Pro, Limited, Denali Ultimate). Empty if not in the title |
| `anio` | integer or empty | Model year |
| `carroceria` | enum or empty | Closed list below |
| `nicho` | enum or empty | Closed list below |
| `precio_estimado` | number or empty | USD, no currency symbol, number so Sheets can sort |
| `confianza` | enum | `alta` / `media` / `baja` |
| `notas` | string | Owner text from the Telegram message |
| `fecha` | date | `YYYY-MM-DD` UTC on insert |

`carroceria` (builder call: closed list so filters work):

`suv`, `sedan`, `coupe`, `hatchback`, `wagon`, `convertible`, `pickup`, `van`, `crossover`

`nicho` (decided with the owner):

`supercar`, `hypercar`, `grand_turismo`, `ultra_luxury`, `sports_sedan`, `muscle`, `suv_compacta`, `suv_mediana`, `suv_grande`, `off_road`, `pickup`

A 4Runner TRD Pro and a 4Runner Limited are different cars: same `marca` + `modelo`, different `version`. A Yukon and a CX-5 can share `carroceria=suv` and differ on `nicho`.

### Dedup and errors

- Unknown Telegram user: ignore. No reply (builder call: do not leak that a bot exists).
- Not a YouTube link: reply, no write.
- `video_id` already in the sheet: reply that it is a duplicate, no write.
- oEmbed or LLM fails: still write `url`, `video_id`, `notas`, `fecha`. Other fields empty. `confianza=baja`. Reply that the row is incomplete.
- Sheets write fails: reply that it was not saved. Never claim success.

Happy path reply: saved vs duplicate, plus marca, modelo, version, anio, nicho.

### Workflow shape

Single n8n workflow, suggested name `cars-tracker-ingest`:

1. Telegram Trigger
2. Allowlist check
3. Extract URL / `video_id` / `notas`
4. YouTube oEmbed
5. Lookup `video_id` in the sheet
6. If new: LLM structured output, then append row
7. Telegram reply

The exported workflow JSON lives in this repo so the automation is versioned. Credentials stay in n8n, not in git.

## Left to the builder

- Exact n8n node types and wiring, as long as the behavior above holds.
- LLM system prompt wording, as long as the JSON schema and “do not invent” rules hold.
- Google Sheet display name and tab name. Default tab: `Cars`.
- How the owner pastes Sheet ID and Telegram allowlist into n8n credentials.
- Repo extras that help run this (exported workflow JSON, a one-page setup note). Do not add a web app, Django project, or database.

## Builder calls (check these while reading)

- YouTube metadata via oEmbed, not YouTube Data API.
- First YouTube URL only if the message has several.
- No reply to strangers.
- `carroceria` is a closed list (see above).
- `precio_estimado` is a number cell, not a string like `$80,000`.
- `fecha` is UTC `YYYY-MM-DD`.
- Workflow export committed in-repo; secrets never committed.
