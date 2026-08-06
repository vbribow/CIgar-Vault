# Hojavía (pronounced oh-ha-VEE-ah)

This folder is the main repository for the Hojavía premium-cigar collector platform.

The former brand is retired. Older technical identifiers remain only where
changing them would break backups, integrations, links, or collector history;
they are not part of the product presentation.

## Repository structure

- `app-build/` — application source, tests, deployment configuration, and local development files
- `brand-development/` — identity development, clearance, and brand decisions
- `corporate-docs/` — company plans, strategy, and other corporate documentation;
  historical titles remain unchanged when they are part of the record

## Work on the app

```bash
cd app-build
cp .env.example .env.local
pnpm install
pnpm dev
```

See [`app-build/README.md`](app-build/README.md) for the full application setup and verification instructions.
