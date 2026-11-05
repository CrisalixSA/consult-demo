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
| Iframe shows a start failure and the page receives `session_failed` with `data.code` `modules_required` | The snippet has neither `data-modules` nor `data-launch`. | Add `data-modules`, e.g. `data-modules="self_assessment"`. |
| `session_failed` with `module_not_allowed` | The launch asks for a module its entry cannot run (for example `treatment_plan` in a public `data-modules`). | Public snippets only allow `capture`, `self_assessment` and `booking`; clinic modules need a signed clinic launch. |
| `session_failed` with `module_not_purchased` | `capture`, `self_assessment` and `booking` need your Face Assessment purchase. | Contact Crisalix to enable it. |
| `session_failed` with `input_not_found` | A clinic launch `inputs` reference (`cs_…`, `tp_…`) does not exist within its `clinic_id`. | Send a reference you stored from an earlier event, for the same clinic. |
| `session_failed` with `invalid_signature` | The `data-launch` token is not a valid HS256 JWT signed with your launch secret. | Rebuild it on your backend with the secret Crisalix provides. |
| `session_failed` with `link_expired` | The token is past its `exp`, or a clinic launch was already used (`jti` works once; clinic launches live at most 5 minutes). | Build a fresh token for each launch. |
| Iframe shows *This widget is not available for this site (clinic id required)*, `X-Widget-Error: clinic_id_required` | `data-clinic-id` is missing or blank. | Add your clinic identifier as `data-clinic-id`. |
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

## `getResults()` rejects

`getResults()` never rejects because the visitor is unfinished: it resolves
with whatever exists so far and `status: "in_progress"`.

| Error message contains | Meaning | Fix |
|------------------------|---------|-----|
| `results_unavailable` | The visitor session expired (sessions are short-lived) or the widget could not reach its backend. | The visitor can restart the assessment (reload the page). |
| `results request timed out` | The widget iframe is not loaded, was removed from the DOM, or the page called the API before the SDK finished mounting. | Call the API only after the widget is visible; check for earlier load errors. |

## Events do not arrive

| Symptom | Cause | Fix |
|---------|-------|-----|
| `CrisalixWidget` is `undefined` when your script runs | The SDK creates `window.CrisalixWidget` when it mounts, after the page has parsed. | Subscribe once it exists (for example on `DOMContentLoaded`), or listen to the container's `crisalix:<type>` DOM events, which you can attach at any time. |
| A listener sees the same event twice | It is registered twice. The SDK already drops duplicate events when the widget re-sends them on reload or reopen. | Register each listener once. |
| No events from a tab the visitor closed | A closed tab sends nothing. | Treat "`session_started`, never `session_completed`" as abandonment. |

## Local development checklist

- Serve your page over **HTTP, never `file://`** (`npx serve .`).
- The dev backend must be running and reachable at the origin in your snippet.
- `localhost` must be on the partner's allowlist (the seeded demo partners
  include it).
- Identifiers are per-database: after a reseed, re-copy the `partner_id` from
  the seed output (printed without any prefix).
