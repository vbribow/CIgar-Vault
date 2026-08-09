# Live cigar research activation runbook

**Current state:** prepared locally; disabled; no billing, key, migration, deployment, or paid request activated.

This runbook is the final held step for the source-backed `Research any cigar`
service. It does not authorize spending or a database change.

## Preconditions

- The production Supabase migration baseline is reconciled and backed up.
- Brian approves a dedicated OpenAI Platform project and its hard monthly
  spending limit and alert thresholds.
- The exact production release candidate has passed type checking, tests,
  internal-navigation audit, and production build.
- The operator has protected access to the deployment secret interface. Never
  paste the API key into a chat, browser field in Hojavía, source file, log, or
  `NEXT_PUBLIC_` variable.

## Activation sequence

1. Create separate OpenAI Platform projects for staging and production.
2. Set the founder-approved hard spending limit and alerts before creating a
   production service credential.
3. Create a project-scoped server credential.
4. Apply `supabase/migrations/202608090001_cigar_research_service.sql` only
   through the separately approved migration process.
5. Add these protected environment values:

   ```text
   OPENAI_API_KEY=<protected project credential>
   OPENAI_RESEARCH_MODEL=gpt-5.6-terra
   OPENAI_RESEARCH_DAILY_USER_LIMIT=3
   OPENAI_RESEARCH_CACHE_HOURS=24
   OPENAI_RESEARCH_ENABLED=true
   ```

6. Deploy the unchanged, validated candidate through the approved private
   release process.
7. Confirm the research status changes from billing hold to available without
   exposing any credential value.
8. Run the controlled founder evaluation below. Do not widen beta access yet.
9. Inspect request counts, cache hits, tokens, web-search calls, failures,
   latency, source retention, and actual spend against the approved limit.
10. Record an explicit founder pass before enabling research for beta testers.

## Controlled founder evaluation

Use at least 20 queries covering:

- `Fuente Fuente Opus6 Red 2024` and the spacing variant `Opus 6 red box`;
- presentation versus individual component cigars;
- Natural versus Maduro distinctions;
- same family but different vitola and year;
- rare, discontinued, regular-production, Habanos, and New World cigars;
- one real cigar with no current retailer observation;
- one genuinely ambiguous query and one unsupported query;
- a repeated exact query that must return from cache without another billable
  request;
- a duplicate submission, daily-limit boundary, timeout, provider-limit, and
  invalid-source simulation.

Pass only when Hojavía never substitutes a neighboring product, never retains
an unvisited citation, labels unresolved facts, preserves the app’s
non-transactional retailer boundary, and gives a recoverable explanation for
every failure.

## Rollback and kill switch

Set `OPENAI_RESEARCH_ENABLED=false` and redeploy. This immediately returns the
interface to a visible billing hold without removing cached evidence or usage
records. Rotate or revoke the project credential if exposure is suspected.
Never delete the usage ledger to hide or reset spending history.
