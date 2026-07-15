# Troubleshooting

The failures you can hit, what they look like, and what they mean. For gate
errors the response carries a machine-readable `X-Widget-Error` header —
check the Network tab.

## The widget area stays empty

| Symptom | Cause | Fix |
|---------|-------|-----|
| No iframe appears at all, no SDK request in the Network tab | The snippet was injected dynamically (`createElement`/`innerHTML`). The SDK locates its own `<script>` tag while the document parses; dynamic injection breaks that. | Keep the snippet as a literal tag in the served HTML. |
| No iframe, `data-container` selector matches nothing | The container div is missing or the selector is wrong. | Ensure the container element exists before the script tag runs. |
| `/widget.js` request → **403**, `X-Widget-Error: unknown_token` | The `partner_id` is wrong, or the partner account is deactivated. | Check the identifier against your partner account. |
| `/widget.js` request → **403**, `X-Widget-Error: domain_not_allowed` | The page's domain is not on your account's allowlist. | Have the hostname registered (exact hostname; subdomains are not implied). |
| Iframe appears but the browser refuses to render it (blank + console CSP error mentioning `frame-ancestors`) | Same cause as above, enforced by the browser: the embedding page's origin is not allowlisted. | Register the domain. This protection cannot be bypassed client-side — that is the point. |
| **406 Not Acceptable** | The visitor's browser is below the supported baseline. | Nothing on your side; the visitor needs a modern browser. |

## The widget loads but behaves oddly

| Symptom | Cause | Fix |
|---------|-------|-----|
| Everything worked yesterday, today every request is 403 `unknown_token` | Your `partner_id` was rotated. Rotation is immediate — the old identifier dies the moment a new one is issued. | Update the snippet with the current `partner_id`. |
| 3D preview never appears when testing locally against a dev backend | The local backend has no 3D pipeline. | For local runs only, add `data-mode="demo"` to the snippet (ignored outside development). Remove it for staging/production. |
| The page scrolls to a giant white area | You are trying to make the iframe grow with its content. The iframe is a fixed stage (`data-height`, default 700px); widget screens scroll internally, and the SDK has no content-resize protocol — the content height is not readable cross-origin. | Don't autosize to content — see [Sizing the stage](#sizing-the-stage). |

## Sizing the stage

Two different things get called "resizing the iframe" — one is unsupported,
the other works fine:

- **Autosizing to content** — making the iframe grow and shrink as the visitor
  moves through the steps — is **unsupported**. The content height is not
  readable cross-origin, the SDK exposes no resize protocol, and a stage that
  reflowed on every step would shift your page's layout and reset the 3D
  canvas. This is what the warning above is about.
- **A bigger stage** is entirely up to you. Set `data-height` to a larger
  constant, or size the container with CSS and stretch the iframe to fill it —
  for example, a viewport-filling stage:

  ```css
  #crisalix-widget { height: calc(100vh - 120px); }
  #crisalix-widget iframe { width: 100% !important; height: 100% !important; }
  ```

  (`!important` overrides the sizing the SDK applies from `data-height`.)
  The widget's screens scroll internally, so any stage height works — it just
  needs to stay constant while the visitor is in the flow.

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
- Identifiers are per-database: after a reseed, re-copy the `partner_id` from
  the seed output (printed without any prefix).
