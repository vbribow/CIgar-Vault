# Google Places production setup

Hojavía (pronounced oh-ha-VEE-ah) calls **Places API (New) Text Search** only from its authenticated
server route. The credential must never be sent to the browser.

## Google Cloud

1. Use a dedicated production Google Cloud project with billing enabled.
2. Enable **Places API (New)** only.
3. Create a dedicated server-side credential.
4. Restrict the credential to **Places API (New)**.
5. Set conservative daily quotas and billing alerts before launch.

The current route uses the required field mask and requests only the fields
Hojavía displays.

## Application restriction

Google recommends IP restrictions for server-side API keys. Vercel Functions
use dynamic outbound addresses by default, so an IP-restricted key requires
Vercel Static IPs (or another controlled egress proxy). After Static IPs are
enabled, allow only those production egress addresses.

Do not apply an HTTP-referrer restriction to this key: requests originate from
the Hojavía server, not the collector's browser. If static egress is not yet
available, keep the key restricted to Places API (New), use tight quotas and
alerts, and treat that as a temporary launch exception.

## Vercel

Add this encrypted Production environment variable:

`GOOGLE_PLACES_API_KEY`

Never use a `NEXT_PUBLIC_` prefix. Redeploy after adding or rotating it.

## Acceptance check

1. Sign in to canonical production.
2. Search a known U.S. ZIP code in Places.
3. Confirm results show separate Google and Hojavía scores.
4. Confirm permanently closed locations are excluded.
5. Confirm an anonymous request receives a sign-in response.
6. Review Google usage, quota, and billing dashboards after the test.
