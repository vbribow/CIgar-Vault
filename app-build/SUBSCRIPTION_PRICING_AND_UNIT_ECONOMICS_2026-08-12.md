# Hojavía Subscription Pricing, Unit Economics, and Adoption Plan

Status: **Built and prepared; checkout, paid APIs, and production migration remain intentionally inactive until founder approval.**

Prepared: August 12, 2026

## Product principle

The Free experience must feel complete enough to earn trust. Paid membership is introduced when collection scale, evidence-backed intelligence, environmental monitoring, or personal service becomes genuinely useful. Hojavía will not create surprise AI overages, sell collector records, or hold an owner’s export hostage.

## Recommended membership structure

| Membership | Monthly | Annual | Core benefit | Monthly intelligence credits |
|---|---:|---:|---|---:|
| Free | $0 | $0 | 25 lots, one humidor, journal, collections, learning, community, export | 5 |
| Collector | $9.99 | $99 | Unlimited inventory, three humidors, one sensor, insurance reporting, backups, value history | 30 |
| Reserve | $24.99 | $249 | Unlimited humidors/sensors, professional ratings, live research, Cigar Somm, alerts and scheduled intelligence | 150 |
| Concierge | $99 | $999 | Reserve plus assisted onboarding, record review, priority support, and collection strategy | 500 |
| Founder | $99/year | Grandfathered | Reserve-level platform access and founder-priority onboarding for the first 25 collectors | 150 |

Founder does not mean unlimited future human labor. Material appraisal, cataloging, or ongoing advisory projects should be scoped separately.

## Intelligence-credit rules

- Cached or local application result: 0 credits.
- Cigar Somm answer: 1 credit.
- Exact live cigar research: 5 credits.
- Live valuation or professional-rating refresh: 5 credits.
- Founder-approved deep multi-source research: 10 credits.
- Optional future research pack: 100 credits for $15, activated only after measured demand and margin validation.

The application reserves credits atomically before a paid provider request. A failed request releases its reservation. When the allowance is exhausted, live research pauses; cached evidence remains available and the member sees a clear meter and membership link. There are no automatic overage charges.

## Cost boundaries

Initial monthly paid-provider ceilings used for planning:

| Membership | Provider-cost ceiling/member/month |
|---|---:|
| Free | $0.15 |
| Collector | $1.00 |
| Reserve / Founder | $4.00 |
| Concierge | $15.00 |

Use the lowest-capability model that meets the evidence standard: Luna for routine extraction and pairing, Terra for exact source-backed research, and Sol only for exceptional founder-approved work. Recheck current vendor prices before activation; these are operating caps, not vendor-price claims.

## Contribution-margin planning

Assumption: combined payment and subscription-billing fees equal 3.6% of revenue plus $0.30 per transaction. This is deliberately conservative and must be replaced with the signed processor terms before launch. Shared hosting, support labor, taxes, refunds, and acquisition cost are not included.

| Monthly plan | Price | Net after assumed transaction fees | API ceiling | Contribution before shared costs | Margin |
|---|---:|---:|---:|---:|---:|
| Collector | $9.99 | $9.33 | $1.00 | $8.33 | 83% |
| Reserve | $24.99 | $23.79 | $4.00 | $19.79 | 79% |
| Concierge | $99.00 | $95.14 | $15.00 | $80.14 | 81% before labor |

| Annual plan | Price | Contribution after assumed fees and 12 months of API ceilings | Margin |
|---|---:|---:|---:|
| Collector | $99 | $83.14 | 84% |
| Reserve | $249 | $191.74 | 77% |
| Concierge | $999 | $782.74 | 78% before labor |

Concierge labor is the primary margin risk. One $50 hour of monthly human service reduces estimated monthly contribution to about $30. Limit included human work, publish service boundaries, and quote large cataloging or appraisal projects separately.

## Adoption forecast

Early paid-member mix assumption:

- Collector: 60–70% of paying members.
- Reserve: 25–35%.
- Concierge: 3–6%.
- Reserve plus Concierge: approximately 30–40% of paying members, or roughly 1.5–2.5% of all registered users during early growth.

Illustrative registered-user scenarios:

| Registered users | Paid members | Collector | Reserve | Concierge | Approx. list MRR |
|---:|---:|---:|---:|---:|---:|
| 1,000 | 20 | 14 | 5 | 1 | $364 |
| 1,000 | 50 | 32 | 15 | 3 | $992 |
| 1,000 | 80 | 45 | 28 | 7 | $1,842 |

The first operating target is conversion quality, not maximum conversion: a useful Free product, 5% paid conversion, about 30% of paid members choosing Reserve or higher, API spend within tier ceilings, and Concierge capped at 10–20 members until actual service time is known.

## Signup and hospitality experience

The home page presents two unmistakable welcome actions: **Create free account** and **Sign in**. Signup begins on Free. No payment card is required. Members can review benefits and prices without being forced into checkout. Existing authenticated members continue into their private vault.

Pricing language explains the outcome of each level, not just feature names. The account screen shows the active membership, monthly intelligence allowance, usage, and remaining balance.

## RevenueCat 2026 benchmark decision

RevenueCat’s public 2026 analysis covers more than 115,000 subscription apps and $16 billion in tracked revenue. It reports materially faster conversion for hard-paywall apps, nearly equal one-year retention between hard paywalls and freemium, better conversion for longer trials, an early annual-cancellation spike, and stronger initial monetization but weaker retention for AI-led apps. Source: https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026

Hojavía will use an **earned paywall**, not a whole-app hard paywall:

- Free remains a useful hospitality and trust experience with no payment card.
- Reserve is the visually recommended membership for serious collectors.
- Paid capabilities are hard-gated at the moment their value is clear: inventory scale, insurance-ready PDF schedules, sensors, source-backed live research, advanced ratings, and automation.
- Complete owner-controlled data export, education, community participation, and existing collector records are never placed behind a paywall.
- An eligible Free collector unlocks one 21-day Reserve trial only after documenting at least three lots and recording either a smoke or a supported valuation. The server verifies eligibility, the trial requires a payment method, renews monthly at the disclosed Reserve price, and records redemption only after Stripe confirms the trialing subscription.
- Hojavía is positioned as collection stewardship supported by AI—not as an AI novelty product.

The launch experiment should compare this earned-paywall flow against the same Free experience without a trial. Measure signup-to-first-lot, three-lot activation, trial start, trial-to-paid conversion, Day-0 cancellation, 30/90-day paid retention, provider cost per payer, and data contribution. Do not switch the entire product to a hard paywall based only on cross-category benchmarks.

## Technical implementation prepared in this bundle

- Central tier definitions, prices, limits, benefits, credit allowances, and provider-cost ceilings.
- Legacy `pro` accounts normalize safely to `reserve`.
- Stripe-ready monthly and annual checkout for Collector, Reserve, and Concierge; annual Founder checkout remains compatible.
- Checkout metadata and webhook handling preserve exact plan and interval.
- Server-only atomic AI-credit ledger and usage meter.
- Cigar Somm costs 1 credit and defaults to the cost-efficient Luna route.
- Exact live cigar research costs 5 credits; cache hits cost 0.
- Public home-page Sign in and Create free account welcome path.
- RevenueCat-informed earned Reserve trial and contextual premium gates.

## Activation checklist — founder approval required

1. Confirm final public prices, annual discounts, Founder promise, refund policy, and tax treatment.
2. Create Stripe products/prices and add the six protected price IDs to the deployment environment.
3. Apply the reviewed Supabase migration and verify the credit ledger in staging.
4. Set hard provider budget alerts/limits; enable live research only after the limit is confirmed.
5. Run one sandbox checkout for every plan/interval, including cancellation, failed payment, and webhook replay.
6. Verify mobile and desktop signup, sign-in, pricing, account meter, upgrade, downgrade, export, and exhausted-credit behavior.
7. Record measured API cost, support time, conversion, and churn for 30 days before changing prices or allowances.

No deployment, migration application, Stripe product creation, paid API activation, or charge is authorized by this document.
