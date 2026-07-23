# Cedriva

This folder is the main repository for the Cedriva project.

## Repository structure

- `app-build/` — application source, tests, deployment configuration, and local development files
- `corporate-docs/` — company plans, strategy, and other corporate documentation

## Work on the app

```bash
cd app-build
cp .env.example .env.local
pnpm install
pnpm dev
```

See [`app-build/README.md`](app-build/README.md) for the full application setup and verification instructions.
