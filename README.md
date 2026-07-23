# Cedriva MVP

A speed-to-market collector application with **Smartsheet as the complete source of truth**.

## What is already built

- Responsive founder dashboard
- Inventory browser
- Seed data from the current collection
- Server-side Smartsheet reader
- Smartsheet row-creation API
- Health endpoint
- Provisioning script for the four MVP sheets
- Mock-data mode so the product runs before credentials are connected

## Run locally

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Connect Smartsheet

Smartsheet API access is available on eligible Business and Enterprise plans. Generate an API token in Smartsheet Personal Settings > API Access. Keep it server-side and never commit it.

1. Create a workspace named `Cedriva MVP`.
2. Copy `.env.example` to `.env.local`.
3. Set `SMARTSHEET_ACCESS_TOKEN` and `SMARTSHEET_WORKSPACE_ID`.
4. Run `pnpm provision:smartsheet`.
5. Copy the returned sheet IDs into `.env.local`.
6. Set a strong `FOUNDER_WRITE_KEY` and `USE_MOCK_DATA=false`.
7. Run `pnpm dev`.

The inventory editor asks for the founder write key before saving. The key is sent only to the server and is never stored by the browser.

Set `APP_ACCESS_PASSWORD` to protect the entire deployed application with browser authentication. Production fails closed when it is missing.

Validate the bundled collection before import, then explicitly apply it:

```bash
pnpm import:inventory
pnpm import:inventory -- --apply
```

## Verify

```bash
pnpm test
pnpm typecheck
pnpm build
```

## Fastest launch sequence

1. Deploy this repository to Vercel.
2. Add the Smartsheet environment variables in Vercel.
3. Password-protect the founder beta.
4. Recruit 10–20 collectors.
5. Charge only after inventory import, smoking log and valuation are reliable.

## Product boundary for v0.1

Ship: inventory, tasting log, valuations, aging status, search, mobile entry.

Defer: social network, marketplace, AI chat, auction integrations and automated authenticity claims.

## Security

The Smartsheet token is used only in server code. Do not prefix it with `NEXT_PUBLIC_` and never place it in client components.
