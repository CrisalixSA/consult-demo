# Troubleshooting

The failures you can hit, what they look like, and what they mean. For gate
errors the response carries a machine-readable `X-Widget-Error` header —
check the Network tab.

## The widget area stays empty

| Symptom | Cause | Fix |
|---------|-------|-----|
| No iframe appears at all, no SDK request in the Network tab | The snippet was injected dynamically (`createElement`/`innerHTML`). The SDK locates its own `<script>` tag while the document parses; dynamic injection breaks that. | Keep the snippet as a literal tag in the served HTML. |
| No iframe, `data-container` selector matches nothing | The container div is missing or the selector is wrong. | Ensure the container element exists before the script tag runs. |
| `/widget.js` request → **403**, `X-Widget-Error: unknown_token` | The `app_token` is wrong, or the partner account is deactivated. | Check the token against your partner account. |
| `/widget.js` request → **403**, `X-Widget-Error: domain_not_allowed` | The page's domain is not on your account's allowlist. | Have the hostname registered (exact hostname; subdomains are not implied). |
| Iframe appears but the browser refuses to render it (blank + console CSP error mentioning `frame-ancestors`) | Same cause as above, enforced by the browser: the embedding page's origin is not allowlisted. | Register the domain. This protection cannot be bypassed client-side — that is the point. |
| **406 Not Acceptable** | The visitor's browser is below the supported baseline. | Nothing on your side; the visitor needs a modern browser. |

## The widget loads but behaves oddly

| Symptom | Cause | Fix |
|---------|-------|-----|
| Everything worked yesterday, today every request is 403 `unknown_token` | Your `app_token` was rotated. Rotation is immediate — the old token dies the moment a new one is issued. | Update the snippet with the current token. |
| 3D preview never appears when testing locally against a dev backend | The local backend has no 3D pipeline. | For local runs only, add `data-mode="demo"` to the snippet (ignored outside development). Remove it for staging/production. |
| The page scrolls to a giant white area | You are fighting the fixed-height design — the iframe height is a constant (`data-height`, default 700px); widget screens scroll internally. | Don't try to autosize the iframe; adjust `data-height` if you want a taller stage. |

## `getSelfAssessmentResults()` rejects

| Error message contains | Meaning | Fix |
|------------------------|---------|-----|
| `assessment_not_completed` | The visitor hasn't finished all steps. Results are all-or-nothing — no partial data is ever exposed. | Wait for completion; surface a friendly "finish the assessment" message. |
| `results_unavailable` | The visitor session expired (sessions are short-lived) or the widget could not reach its backend. | The visitor can restart the assessment (reload the page). |
| `results request timed out` | The widget iframe is not loaded, was removed from the DOM, or the page called the API before the SDK finished mounting. | Call the API only after the widget is visible; check for earlier load errors. |

## Local development checklist

- Serve your page over **HTTP, never `file://`** (`npx serve .`).
- The dev backend must be running and reachable at the origin in your snippet.
- `localhost` must be on the partner's allowlist (the seeded demo partners
  include it).
- Tokens are per-database: after a reseed, re-copy the `pk_…` token from the
  seed output.
