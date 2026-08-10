# Next private code-release batch

**Status:** the original disabled-research foundation shipped privately in
version 60. The outside-Vault rating and legacy community-rating compatibility
increment described below is queued; it is not committed, pushed, deployed,
activated, or published.

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
- Allow collectors to explicitly mark a cigar as smoked outside their Vault,
  require exact brand, line, and vitola before its score can qualify, retain the
  classification on the private smoking record, and keep tasting notes,
  purchase details, and inventory outside the anonymous contribution.
- Let collectors deliberately classify existing manual smoking records without
  changing Vault quantities or silently reclassifying historical records.
- Keep direct manual community ratings writable against the current production
  schema while the held contribution-source migration remains unapplied.

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
7. An outside-Vault score qualifies only after the collector checks the explicit
   confirmation and supplies exact brand, line, and vitola; unchecked legacy
   manual records remain private and ineligible.

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
