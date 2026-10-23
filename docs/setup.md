# Setup

Import `n8n/cars-tracker-ingest.json` into self-hosted n8n. Credentials stay in n8n, never in git.

## Google Sheet

1. Create a spreadsheet.
2. Rename the first tab to `Cars`.
3. Put this header row in A1:L1, exactly:

`video_id` `url` `marca` `modelo` `version` `anio` `carroceria` `nicho` `precio_estimado` `confianza` `notas` `fecha`

4. Copy the spreadsheet ID from the URL (`/d/<ID>/edit`).
5. In n8n, open Google Sheets nodes (`Lookup video_id`, `Append row`) and paste that ID. Attach your Google Sheets credential.

## Telegram

1. Create a bot with BotFather and put the token in an n8n Telegram credential.
2. Attach that credential to `Telegram Trigger` and every `Telegram` reply node.
3. Message `@userinfobot` (or similar) to get your numeric user id.
4. Set workflow / instance env `TELEGRAM_ALLOWLIST_USER_ID` to that id.

Strangers get no reply.

## LLM

Attach the LLM credential you already use in this n8n instance to the `LLM extract` chat-model node. Swap the example OpenAI model node for Gemini/Claude if that is what you have. The prompt is provider-agnostic.

## Activate

1. Import the JSON (Workflows → Import from File).
2. Set Sheet ID, Telegram credential, LLM model, allowlist env.
3. Save and activate `cars-tracker-ingest`.
4. Send a YouTube link to the bot from your account.
