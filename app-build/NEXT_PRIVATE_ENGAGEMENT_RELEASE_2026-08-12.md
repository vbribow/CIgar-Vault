# Next private engagement release

## Included

- Personalized Leaf Feed connecting verified private collection signals with clearly labeled community and educational context.
- Multi-dimensional exact-cigar Community Experience Profiles with sample size and confidence.
- Opt-in Collector Passport and community directory that never expose Vault quantities, values, locations, acquisition details, box codes, serials, receipts, or private photographs.
- Plain-language exact-identity market movement summaries that retain the detailed evidence ledger and keep asking prices separate from completed sales.
- Habanos and New World lineage maps with tradition-specific identity rules.

## Held

- Do not apply `202608120001_collector_engagement_layer.sql` until the production Supabase migration baseline is reconciled and Brian separately approves the schema operation.
- Collector Passport endpoints fail closed until the migration is applied.
- No public access widening, trade or marketplace support, partner campaign, Fox Cigars activity, paid API call, billing, or trademark/public launch.

## Deployment behavior before migration

- Leaf Feed, market movement, lineage maps, and legacy-compatible overall community ratings remain available.
- Extended experience dimensions fall back to the existing community-rating schema.
- Collector Passport clearly reports that protected storage is pending; it never simulates a successful save.

## Validation checkpoint

- Full Node test suite: passed.
- TypeScript (`tsc --noEmit`): passed.
- Internal navigation audit: 190 routes passed.
- Source and built-client performance budgets: passed.
- Vinext production build: passed; Sites artifact is ready at `dist/server/index.js`.
- `git diff --check`: passed.
