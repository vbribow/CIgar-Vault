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
