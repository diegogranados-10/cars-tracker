# Cars Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a versioned n8n workflow plus tested JS helpers so a Telegram YouTube link becomes one Google Sheets row the owner can filter.

**Architecture:** Pure Node helpers in this repo own parsing, enum sanitizing, row shape, and Spanish replies. Tests lock that behavior. One n8n workflow (`cars-tracker-ingest`) wires Telegram, oEmbed, the existing LLM credential, and Google Sheets around those helpers (Code nodes paste the same functions). Secrets stay in n8n, never in git.

**Tech Stack:** Node.js (built-in `node:test`), n8n (self-hosted), Telegram, YouTube oEmbed, Google Sheets, existing n8n LLM credential.

**Spec:** `docs/superpowers/specs/2026-10-23-cars-tracker-design.md`

## Global Constraints

- Engine: existing self-hosted n8n. No new backend, no Django, no Postgres, no web UI.
- Inbox: Telegram bot, private, allowlist of one Telegram user id.
- Catalog: one Google Sheet, one tab named `Cars`.
- Enrichment: the LLM already configured in that n8n instance. Workflow is provider-agnostic.
- Bot replies: Spanish.
- Sheet headers (this order, not translated): `video_id`, `url`, `marca`, `modelo`, `version`, `anio`, `carroceria`, `nicho`, `precio_estimado`, `confianza`, `notas`, `fecha`.
- YouTube metadata via oEmbed (`https://www.youtube.com/oembed?url=...&format=json`), not YouTube Data API.
- `url` is the YouTube link as sent, not rewritten.
- `precio_estimado` is a number or empty. All prices USD. No currency column.
- `fecha` is UTC `YYYY-MM-DD`.
- `carroceria` closed list: `suv`, `sedan`, `coupe`, `hatchback`, `wagon`, `convertible`, `pickup`, `van`, `crossover`.
- `nicho` closed list: `supercar`, `hypercar`, `grand_turismo`, `ultra_luxury`, `sports_sedan`, `muscle`, `suv_compacta`, `suv_mediana`, `suv_grande`, `off_road`, `pickup`.
- `confianza`: `alta` / `media` / `baja`.
- Workflow export in-repo. Credentials never committed.

## File map

- `package.json` — `"type": "module"`, `"test": "node --test tests/*.test.js"`.
- `src/constants.js` — closed lists.
- `src/parseYoutubeMessage.js` — first YouTube URL, `videoId`, `notas`.
- `src/sanitizeEnrichment.js` — drop invented enums/prices; empty fields.
- `src/sheetRow.js` — 12-cell row in header order.
- `src/replies.js` — Spanish copy.
- `src/allowlist.js` — stranger vs owner.
- `src/n8nCode.js` — one bundled string for the n8n Code node (re-exports the helpers).
- `tests/*.test.js` — one test file per module above.
- `n8n/cars-tracker-ingest.json` — exported workflow, no credentials.
- `docs/setup.md` — Sheet headers, bot, import, env names.

## Review Focus

- Shorts URL (`youtube.com/shorts/{id}`): parse as a valid `videoId` (Task 1).
- Two YouTube URLs in one message: first wins; second URL is not `notas` if it is the leftover text after stripping only the first URL (Task 1 must strip only the first match).
- LLM returns `nicho: "SUV grande"`: stored as empty, not as free text (Task 2).
- LLM returns `precio_estimado: "$80,000"`: stored as empty (not a string); a JSON number `80000` is kept (Task 2).
- oEmbed/LLM missing: row still written with `confianza=baja` and empty enrichment fields (Task 3).

---

### Task 1: Parse Telegram text into video_id, url, notas

**Files:**
- Create: `package.json`
- Create: `src/parseYoutubeMessage.js`
- Test: `tests/parseYoutubeMessage.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `parseYoutubeMessage(text: string) => { ok: false } | { ok: true, url: string, videoId: string, notas: string }`

- [ ] **Step 1: Write the failing tests**

`tests/parseYoutubeMessage.test.js` using `node:test` and `node:assert/strict`.

- `parseYoutubeMessage` is not defined until the module exists; import it from `../src/parseYoutubeMessage.js`.
- `watch?v=` → `ok: true`, `videoId` `dQw4w9WgXcQ`, `url` the exact substring found.
- `youtu.be/dQw4w9WgXcQ` → same `videoId`.
- `youtube.com/shorts/dQw4w9WgXcQ` → same `videoId`.
- `youtube.com/embed/dQw4w9WgXcQ` → same `videoId`.
- `m.youtube.com/watch?v=dQw4w9WgXcQ` → same `videoId`.
- `"mira esto https://youtu.be/dQw4w9WgXcQ me gusta el interior"` → `notas` is `"mira esto me gusta el interior"` (first URL stripped, leftover whitespace collapsed to single spaces, trimmed).
- Two URLs (`youtu.be/aaa` then `youtu.be/bbb`) → `videoId` from the first only (`aaa`); `url` is the first URL.
- `"hola"` → `{ ok: false }`.
- `""` → `{ ok: false }`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/parseYoutubeMessage.test.js`

Expected: FAIL (module missing or function missing).

- [ ] **Step 3: Implement `parseYoutubeMessage(text)` in `src/parseYoutubeMessage.js`**

Accept the spec URL shapes. Extract 11-char YouTube id. Return the matched URL as `url` (as sent, not canonicalized). Strip only that first match when building `notas`. Add `"type": "module"` and `"scripts.test": "node --test tests/*.test.js"` in `package.json`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/parseYoutubeMessage.test.js`

Expected: PASS

- [ ] **Step 5: Commit** (only if the user asked to commit; otherwise skip)

```bash
git add package.json src/parseYoutubeMessage.js tests/parseYoutubeMessage.test.js
git commit -m "$(cat <<'EOF'
Add YouTube URL parsing for Telegram messages.

EOF
)"
```

---

### Task 2: Sanitize LLM JSON against closed lists

**Files:**
- Create: `src/constants.js`
- Create: `src/sanitizeEnrichment.js`
- Test: `tests/sanitizeEnrichment.test.js`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces:
  - `CARROCERIA`, `NICHO`, `CONFIANZA` arrays matching the spec lists exactly.
  - `sanitizeEnrichment(raw: unknown) => { marca: string, modelo: string, version: string, anio: number | '', carroceria: string, nicho: string, precio_estimado: number | '', confianza: 'alta' | 'media' | 'baja' }`

- [ ] **Step 1: Write the failing tests**

- Valid object with `marca: "GMC"`, `modelo: "Yukon"`, `version: "Denali Ultimate"`, `anio: 2027`, `carroceria: "suv"`, `nicho: "suv_grande"`, `precio_estimado: 80000`, `confianza: "alta"` → same values (empty string never used for those filled fields).
- `nicho: "SUV grande"` → `nicho: ""`.
- `carroceria: "SUV"` → `carroceria: ""` (no case-folding inventiveness unless the value already matches the list).
- `precio_estimado: "$80,000"` → `precio_estimado: ""`.
- `precio_estimado: 80000` → `80000`.
- `anio: "2027"` → `2027` (numeric year only if it is a 4-digit integer 1900–2100 after coercion; otherwise `""`).
- `anio: 99` → `""`.
- missing/null `raw` → all strings `""`, `anio` `""`, `precio_estimado` `""`, `confianza` `"baja"`.
- `confianza: "alta"` kept; unknown `confianza` → `"baja"`.
- `version` missing → `""`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/sanitizeEnrichment.test.js`

Expected: FAIL

- [ ] **Step 3: Implement `sanitizeEnrichment(raw)` in `src/sanitizeEnrichment.js` and lists in `src/constants.js`**

Unknown enum → empty string (except `confianza` → `baja`). `marca`/`modelo`/`version` are trimmed strings; do not invent them. Only JSON numbers (or integer-like year strings) for `anio`/`precio_estimado`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/sanitizeEnrichment.test.js`

Expected: PASS

- [ ] **Step 5: Commit** (only if asked)

```bash
git add src/constants.js src/sanitizeEnrichment.js tests/sanitizeEnrichment.test.js
git commit -m "$(cat <<'EOF'
Sanitize LLM car fields against closed enums.

EOF
)"
```

---

### Task 3: Sheet row and Spanish replies

**Files:**
- Create: `src/sheetRow.js`
- Create: `src/replies.js`
- Create: `src/allowlist.js`
- Test: `tests/sheetRow.test.js`
- Test: `tests/replies.test.js`
- Test: `tests/allowlist.test.js`

**Interfaces:**
- Consumes: `sanitizeEnrichment` output shape from Task 2.
- Produces:
  - `SHEET_HEADERS` = the 12 header strings in spec order.
  - `buildSheetRow({ videoId, url, notas, enrichment, now }) => unknown[]` length 12, `fecha` from `now` as UTC `YYYY-MM-DD`.
  - `incompleteEnrichment() =>` the empty enrichment object with `confianza: "baja"`.
  - `replyText(kind, payload) => string` where `kind` is `"not_youtube" | "duplicate" | "incomplete" | "sheets_failed" | "saved"`.
  - `isAllowedUser(fromId, allowedId) => boolean` (string-compare both as strings).

- [ ] **Step 1: Write the failing tests**

Row: given `videoId "abc"`, `url "https://youtu.be/abc"`, `notas "interior"`, enrichment from the GMC Yukon example, `now = new Date("2026-10-23T22:00:00Z")` → cells `["abc", "https://youtu.be/abc", "GMC", "Yukon", "Denali Ultimate", 2027, "suv", "suv_grande", 80000, "alta", "interior", "2026-10-23"]`.

Incomplete: `buildSheetRow` with `incompleteEnrichment()` → marca/modelo/version/anio/carroceria/nicho/precio empty, `confianza` `"baja"`, url/videoId/notas/fecha still filled.

Replies (exact copy):

- `not_youtube`: `No pude guardar eso. Mandame un link de YouTube.`
- `duplicate`: `Ese video ya esta en la hoja.`
- `incomplete`: `Lo guarde incompleto. Revisa la fila.`
- `sheets_failed`: `No se guardo. Hubo un error con la hoja.`
- `saved` with payload `{ marca: "GMC", modelo: "Yukon", version: "Denali Ultimate", anio: 2027, nicho: "suv_grande" }`: `Guardado: GMC Yukon Denali Ultimate 2027 · suv_grande`

No ASCII apostrophes that would become curly quotes. Do not use em dashes. Use `Mandame` / `guarde` / `guardo` / `esta` without accents if the implementer would otherwise insert special punctuation; **prefer the accented Spanish**: `Mándame`, `guardé`, `guardó`, `está`. Tests must use the accented strings.

Allowlist: `isAllowedUser(111, "111")` true; `isAllowedUser(222, "111")` false.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/sheetRow.test.js tests/replies.test.js tests/allowlist.test.js`

Expected: FAIL

- [ ] **Step 3: Implement the three modules with the signatures in Interfaces**

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/sheetRow.test.js tests/replies.test.js tests/allowlist.test.js`

Expected: PASS

- [ ] **Step 5: Commit** (only if asked)

```bash
git add src/sheetRow.js src/replies.js src/allowlist.js tests/sheetRow.test.js tests/replies.test.js tests/allowlist.test.js
git commit -m "$(cat <<'EOF'
Add sheet row mapping and Telegram reply copy.

EOF
)"
```

---

### Task 4: n8n workflow export (no secrets)

**Files:**
- Create: `n8n/cars-tracker-ingest.json`
- Create: `docs/setup.md`

**Interfaces:**
- Consumes: helper behavior from Tasks 1–3 (Code node must call the same function names: `parseYoutubeMessage`, `sanitizeEnrichment`, `buildSheetRow`, `incompleteEnrichment`, `replyText`, `isAllowedUser`).
- Produces: importable n8n workflow named `cars-tracker-ingest`.

- [ ] **Step 1: Write `docs/setup.md`**

Must include: create Sheet tab `Cars` with the 12 headers; Telegram bot token in n8n credentials; env/workflow variable `TELEGRAM_ALLOWLIST_USER_ID`; Google Sheets credential; attach existing LLM credential; import JSON; set Sheet ID; activate. State that strangers get no reply.

- [ ] **Step 2: Write `n8n/cars-tracker-ingest.json`**

Nodes, in this order of logic (names exact):

1. `Telegram Trigger` — message.
2. `Allowlist` — Code: if `!isAllowedUser(from.id, $env.TELEGRAM_ALLOWLIST_USER_ID)` then empty output (no reply).
3. `Parse message` — Code: `parseYoutubeMessage` on message text. If `ok: false`, set `kind: "not_youtube"`.
4. `IF YouTube` — if not ok, skip to `Reply not youtube`.
5. `Lookup video_id` — Google Sheets read tab `Cars`, filter column `video_id`.
6. `IF duplicate` — if found, `Reply duplicate`.
7. `YouTube oEmbed` — HTTP GET `https://www.youtube.com/oembed?url={{url}}&format=json`, continue on fail.
8. `LLM extract` — provider-agnostic AI node using the instance credential; system prompt must: return JSON only with keys `marca`, `modelo`, `version`, `anio`, `carroceria`, `nicho`, `precio_estimado`, `confianza`; pick enums from the spec lists; empty `version` if trim not in title; empty `precio_estimado` if not justifiable; do not invent. Continue on fail.
9. `Build row` — Code: if oEmbed or LLM failed, `enrichment = incompleteEnrichment()`; else `sanitizeEnrichment`. Then `buildSheetRow`. Set `kind` `incomplete` or `saved`.
10. `Append row` — Google Sheets append to `Cars`. Continue on fail → `kind: "sheets_failed"` (do not leave `saved` if append failed).
11. Telegram reply nodes for each `kind`, text from `replyText`.

No credential values in the JSON. `settings` may reference credential names as placeholders only.

- [ ] **Step 3: Grep the JSON for secrets**

Run: `rg -n "api[_-]?key|BEGIN |token|AIza|ya29" n8n/cars-tracker-ingest.json || true`

Expected: no real secrets (placeholder credential ids only).

- [ ] **Step 4: Run the full unit suite**

Run: `npm test`

Expected: PASS (all Task 1–3 tests).

- [ ] **Step 5: Commit** (only if asked)

```bash
git add n8n/cars-tracker-ingest.json docs/setup.md
git commit -m "$(cat <<'EOF'
Add n8n ingest workflow export and setup notes.

EOF
)"
```

---

## Spec coverage (self-review)

- Capture URL shapes, first URL, notas → Task 1
- Closed lists, no invented version/price → Task 2
- Column order, USD number, UTC date, incomplete row → Task 3
- Spanish replies, allowlist silence, duplicate/fail copy → Task 3
- oEmbed, LLM, Sheets, workflow name, no secrets → Task 4
- Non-goals (no Django/web) → no task creates them
