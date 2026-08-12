# Hojavía project brief

## Durable release boundary

- `https://hojavia.com` is the production web and installed-phone-app origin. The installed app is a PWA and receives code updates only after the corresponding production deployment reaches this origin.
- Vercel/GitHub is the single active application delivery platform. The separate `chatgpt.site` Sites release is retired and must not receive parallel application deployments.
- A temporary Vercel branch preview may be used for review, but it must never be described as deployed to the phone app or as the completed production release.
- When Brian approves a code deployment, batch the approved changes into one validated candidate and deploy that same commit to the production origin. A release is complete only after the production domain is verified and the installed-app update path is checked.
- Report deployment status separately as: validated locally, preview available, production deployed, and installed-app verified. Never collapse these states into a single “deployed” claim.
- Database migrations, paid services, purchases, public launch, access widening, and partner campaigns remain separately authorized operations.

## Product boundaries

- Keep the public website separate from the private collector application.
- Preserve collector inventory, exact cigar identity, physical-lot distinctions, provenance, and evidence-led valuation rules.
- Do not launch partner campaigns, especially anything involving Fox Cigars, without Brian’s explicit approval.

## Membership boundary

- The prepared membership ladder is Free, Collector, Reserve, Concierge, plus grandfathered Founder. Legacy `pro` records normalize to Reserve.
- Paid provider work uses a server-only monthly intelligence-credit ledger with no automatic overages; cached and local results cost no credits.
- Prices, benefits, unit economics, adoption assumptions, and the activation checklist are archived in `app-build/SUBSCRIPTION_PRICING_AND_UNIT_ECONOMICS_2026-08-12.md`.
- Stripe products, the database migration, paid API activation, and deployment remain separately authorized launch actions.
- Monetization uses an earned paywall: Free stays useful; Reserve is the recommended serious-collector tier; eligible Free accounts may unlock one server-verified 21-day Reserve trial after three lots plus a smoke or supported valuation. Existing records and complete owner-controlled exports are never paywalled.
