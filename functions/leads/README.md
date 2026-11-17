# NovEspoir leads function

Appwrite Function that receives the website lead form, validates it, stores the lead in
Appwrite TablesDB and optionally notifies the owner.

There is **no public Telegram bot** here. Telegram is only an optional private notification
channel for the site owner; the website never links to it.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/lead` (or `/`) | Accept a lead |
| `GET` | `/health` | Check configuration without exposing secrets |
| `OPTIONS` | any | CORS preflight |

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `LEADS_DB_ID` | yes* | Appwrite database ID |
| `LEADS_TABLE_ID` | yes* | Table ID, usually `leads` |
| `ALLOWED_ORIGINS` | recommended | Comma-separated site origins |
| `RATE_LIMIT_MAX` | no | Requests per IP per window (default `8`) |
| `RATE_LIMIT_WINDOW_MS` | no | Window in ms (default `600000`) |
| `TELEGRAM_BOT_TOKEN` | no | Private notification bot token |
| `TELEGRAM_CHAT_ID` | no | Owner chat ID for notifications |
| `NOTIFY_WEBHOOK_URL` | no | Optional JSON webhook for n8n/Make/etc. |

\* If the database is not configured, the function can still deliver the lead through
`TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` or `NOTIFY_WEBHOOK_URL`. If neither storage nor
delivery is configured, it returns `503 storage_unavailable` so the form shows the email fallback.

`APPWRITE_FUNCTION_API_ENDPOINT`, `APPWRITE_FUNCTION_PROJECT_ID` and the execution key
(`x-appwrite-key`) are provided by Appwrite automatically.

## Local test

```bash
cd functions/leads
npm install
node test-local.mjs
```

The test starts a local mock of the Appwrite TablesDB API and checks validation, honeypot,
rate limiting, storage and notification fallback. It does not call real Appwrite or Telegram.

## Deployment

See [`../../LEADS_SETUP.md`](../../LEADS_SETUP.md) for the full Appwrite Console walkthrough.
