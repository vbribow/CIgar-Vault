# Next private code-release batch

**Status:** queued; not committed, pushed, deployed, activated, or published.

**Release boundary:** private application code only. Database and paid-service
activation remain held.

## Included scope

- Add the disabled, fail-closed `Research any cigar` experience and service
  readiness status.
- Include authenticated server routing, request normalization, exact-product
  identity safeguards, per-user quotas, idempotency, source-backed caching,
  visited-source provenance enforcement, usage/error accounting, retry and
  provider-failure handling.
- Include the protected configuration template, automated regression coverage,
  launch-readiness gate, and
  `CIGAR_RESEARCH_ACTIVATION_RUNBOOK.md`.
- Preserve the existing no-cost catalog and inventory search paths while live
  research is unavailable.

## Explicitly excluded

- Do not apply `supabase/migrations/202608090001_cigar_research_service.sql`.
- Do not create or fund an OpenAI Platform project, establish billing, add an
  API key, or set `OPENAI_RESEARCH_ENABLED=true`.
- Do not execute paid research requests or the paid founder evaluation.
- Do not widen beta access, publish the feature, alter the public website,
  launch affiliate or partner activity, or perform Fox Cigars outreach.

## Private-release acceptance

1. The Discover experience states that live research awaits billing activation
   and does not offer an active paid-research submission control.
2. The service readiness endpoint reports the held state without exposing
   credentials or internal secret values.
3. A research submission cannot reach a paid provider while the activation flag
   is false or the credential is absent.
4. Existing inventory and catalog search remain functional.
5. The launch-readiness dashboard continues to show research activation as a
   blocking hold.
6. The release contains no database migration, secret, access change, public
   announcement, or partner communication.

## Later activation checkpoint

Activation is a separate change window. It requires the reconciled and backed-up
Supabase baseline, Brian's explicit approval of a dedicated provider project and
hard spending controls, protected credential provisioning, the held migration,
an unchanged validated release candidate, explicit feature enablement, and the
controlled founder evaluation in `CIGAR_RESEARCH_ACTIVATION_RUNBOOK.md`.

## Rollback boundary

This batch can be rolled back as a code-only release. Because the migration and
billing activation are excluded, this batch requires no research-schema rollback
and creates no paid-provider usage to unwind.
