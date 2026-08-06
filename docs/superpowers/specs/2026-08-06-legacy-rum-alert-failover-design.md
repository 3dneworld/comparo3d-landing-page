# Legacy RUM Compatibility And Alert Failover Design

## Problem

The production bundle imports `web-vitals` statically. Version 5.3.0 calls
`Array.prototype.at()`, which is unavailable in Chrome 79. The RUM collector
therefore raised three global errors on 2026-08-05 even though the quote flow
itself was not involved.

The global reporter also sent every event to Flask and the independent
Cloudflare Worker in parallel. Both channels sent email successfully, creating
duplicate alerts for one browser event.

## Approved Behavior

- The quote experience must remain usable in browsers without
  `Array.prototype.at()`.
- RUM is best-effort. An incompatible browser skips RUM without raising a
  global error or downloading the `web-vitals` chunk.
- Supported browsers continue reporting LCP, INP, CLS, FCP, and TTFB.
- Client errors go to Flask first. The Cloudflare Worker is called only when
  Flask is unavailable, returns a non-success response, or exceeds a bounded
  timeout.
- Real application errors remain critical. This change does not suppress
  errors based on user agent or IP address.

## Implementation

`src/lib/webVitals.ts` will replace the static runtime import with a guarded
dynamic import. `initWebVitals()` will return a promise, skip before import when
`Array.prototype.at` is absent, and contain import/registration failures.

`src/lib/clientErrorReporter.ts` will replace parallel delivery with serial
failover. A successful Flask response ends delivery; failure invokes the Worker.
The existing five-minute in-browser signature cooldown remains unchanged.

## Verification

- Unit test with `Array.prototype.at` removed proves the RUM dependency is not
  loaded.
- Unit test proves supported browsers register all five metrics.
- Unit tests prove successful backend delivery does not call the Worker and a
  failed backend delivery does.
- Production build must succeed and place `web-vitals` outside the main entry
  bundle.
- After deploy, the production HTML must reference the new bundle and the
  previous `index-D0aKxUdu.js` must no longer be the active entry.
