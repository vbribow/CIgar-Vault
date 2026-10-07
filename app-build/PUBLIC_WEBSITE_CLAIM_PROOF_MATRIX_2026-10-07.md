# Public Website Claim-to-Proof Matrix

**Reviewed:** October 7, 2026
**Release path:** Separate public educational website plus private collector PWA
**Decision:** Local copy is appropriately bounded; publication remains held.

This audit compares the public website in `hojavia-website` with the current private-application release candidate. It is evidence for Task 12, not approval to publish, index, advertise, or activate commerce.

| Material public claim | Public source | Release-candidate proof or boundary | Status |
| --- | --- | --- | --- |
| Hojavía helps collectors document and preserve collection knowledge | `app/page.tsx` | Private app supports inventory, collections, notes, photos, smoke history, valuations, export, and evidence labels | Supported |
| The public site and private collection are separate | `app/page.tsx`, `app/preview/page.tsx`, `app/philosophy/page.tsx` | Public project is separate from `app-build`; collector records are not accepted by the public site | Supported |
| Private by design; private records are not a public feed | `app/page.tsx`, `app/preview/page.tsx` | Private app requires account access and tenant-scoped records; public copy does not expose collection records | Supported, pending final real-account isolation acceptance |
| Evidence, sources, dates, confidence, and unresolved questions remain visible | `app/page.tsx`, `app/trust/page.tsx`, `app/sources/*` | Application uses evidence-linked valuations and uncertainty states; public learning library lists source records and uses | Supported |
| Hojavía is not an authenticator or appraiser | `app/trust/page.tsx`, `app/authenticity/page.tsx`, `app/philosophy/page.tsx` | Copy explicitly limits conclusions and separates provenance, channel, inspection, asking price, and completed sale | Supported |
| Hojavía is not a tobacco seller or transaction marketplace | `app/page.tsx`, `app/retailers/page.tsx` | Retailer route is web-only, adult-only, separately disclosed, and fails closed without reviewed offers | Supported; retailer activation remains held |
| Retailer availability does not imply certification, endorsement, authenticity, or value | `app/retailers/page.tsx`, `app/trust/page.tsx` | Exact identity, source date, observation type, and commercial disclosure are required | Supported |
| Adults 21+ only | `app/retailers/page.tsx` and application age gate | Retail-facing copy states 21+ and delegates retailer age/shipping compliance | Supported; legal review remains required before public commerce links |
| The collector controls inventory, values, photos, notes, exports, and history | `app/preview/page.tsx` | Private app exposes owner export and recovery-point flows; entitlement logic keeps owned data visible | Supported, pending founder restore/export acceptance |
| AI-assisted guidance is labeled and not presented as authority | `app/preview/page.tsx`, `app/philosophy/page.tsx` | Cigar Somm distinguishes guidance from evidence and is availability-gated | Supported |
| Hojavía 25 reflects scored community activity | No material public launch claim found | Private app scorecard remains an internal/community feature and is not promised as an independent rating authority | Properly omitted from public claims |
| Preview is closed, founder-controlled, and not a promise of access | `app/preview/page.tsx` | Calls to action describe the staged preview; no self-service enrollment promise | Supported |
| No first-party advertising tracker or marketing cookie is configured on the public site | `app/trust/page.tsx` | No analytics or advertising packages were found in the public project manifest or audited app source | Supported as an implementation fact; recheck before publication |
| Public indexing is disabled until both release mode and approved production origin are present | `app/brand.ts`, `app/layout.tsx`, `app/robots.ts` | Two independent controls are required before indexing | Supported and fail-closed |
| Legal owner is Emberward Holdings LLC | `app/brand.ts`, `app/trust/page.tsx` | Matches current project source of truth | Supported |
| Support is direct during the founder-led preview | `app/preview/page.tsx` | Founder packet and issue-desk workflow define direct support and blocking-defect containment | Conditional on founder process |

## Claims intentionally not made

- No individual cigar authentication or authenticity certificate.
- No independent appraisal, investment return, guaranteed value, or guaranteed market liquidity.
- No manufacturer, retailer, lounge, publisher, or source partnership merely because it is referenced.
- No guarantee that inventory, price, availability, legal eligibility, or shipping remains current.
- No public access, open enrollment, paid subscription availability, affiliate activation, or launch date promise.
- No claim that AI output replaces maker knowledge, collector judgment, or human review.

## Publication holds

1. Founder must complete the real-device and real-account acceptance packet.
2. Privacy notice, terms, adult-category language, support destination, and residual-risk record require final human/legal approval.
3. Public release mode, canonical origin, indexing, and redirect controls must change together in one approved release.
4. Retailer or affiliate links require separate legal/privacy/age/jurisdiction review and explicit founder approval.
5. Billing and paid-plan claims remain unavailable until Stripe test-mode acceptance is complete.

## Audit conclusion

No unsupported authentication, appraisal, investment, partnership, tobacco-sale, paid-plan, or public-availability claim was found in the reviewed public pages. No public-site code change is required for this local release candidate. Dates and preview-stage wording should be refreshed immediately before any authorized publication.
