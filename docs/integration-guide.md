# Integration Guide

How to embed the Crisalix self-assessment widget on your site, what happens
under the hood, and every option you can configure.

## Overview

The widget runs the full guided self-assessment — photos, goals intake, facial
area ranking and rating, summary with a real 3D preview — inside an `<iframe>`
on **your** page. Your visitors never create an account and never leave your
site; your page can pull their (anonymous) results through a small JavaScript
API once they finish.

Integration is a single script tag:

```html
<div id="crisalix-widget"></div>
<script src="https://<crisalix-host>/widget.js?app_token=pk_YOUR_TOKEN" defer
        data-container="#crisalix-widget"></script>
```

## Prerequisites

1. **A partner account** with Crisalix. You receive:
   - your **`app_token`** (`pk_…`) — a *publishable* identifier, safe to ship
     in your HTML (same model as a Stripe publishable key or a Maps API key).
     It is not a secret; it identifies your account.
   - a registered **domain allowlist** — the exact hostnames your pages are
     served from (e.g. `www.auroraclinic.com`). The widget only loads and only
     renders inside pages on those domains. Adding or changing domains is a
     request to Crisalix, not a code change on your side.
2. **HTTPS hosting** for your page in production. Locally, `http://localhost`
   works.

## How it works

```
Your page ──/widget.js?app_token──▶ Crisalix (validates token + domain, serves the SDK)
    │  the SDK injects ──▶ <iframe src=".../widget/start?app_token=...">
    │                          │ Crisalix mints a signed, short-lived visitor session
    ▼                          ▼
your visitors complete the assessment entirely inside the iframe
    │
    └── getSelfAssessmentResults() ──▶ anonymous results, once completed
```

Three properties worth knowing:

- **The visitor session is a signed, expiring token** scoped to that one
  assessment. It is the only credential in play — the widget sets **no
  cookies** on your visitors (nothing to add to your cookie banner).
- **Your domain allowlist is enforced twice**: on Crisalix's servers when the
  SDK and the session are requested, and in the visitor's own browser through
  the frame embedding policy (`frame-ancestors`). A copied snippet on someone
  else's domain does not render.
- **Branding follows your partner account** (theme, color, typography as
  configured with Crisalix) — the snippet does not choose it.

## The snippet, option by option

The `app_token` travels **in the script `src` query string** — that request is
validated before the SDK is even served.

| Where | Option | Required | Default | What it does |
|-------|--------|----------|---------|--------------|
| `src` query | `app_token` | **Yes** (production) | — | Identifies your partner account. Requests with an unknown or deactivated token are refused. |
| attribute | `data-container` | No | `[data-crisalix-widget]` | CSS selector of the element the widget iframe is injected into. |
| attribute | `data-clinic-id` | No | — | **Your** identifier for the clinic/microsite this page belongs to. First use auto-registers it on your account; every assessment started here is attributed to it. Use it to segment leads per location. |
| attribute | `data-height` | No | `700` | Fixed height (px) of the widget iframe. The widget's screens are phone-like and scroll internally — the iframe never resizes itself. |

Notes:

- **Keep the tag literal.** The SDK locates its own `<script>` element while
  the document parses; injecting the tag dynamically breaks that discovery
  (see [troubleshooting](troubleshooting.md)).
- The iframe is created with `allow="camera"` so the guided selfie capture
  works. Visitors without a camera get a manual upload fallback automatically.
- One widget per page is supported.

## Attributing assessments to your clinics

If you operate several locations or microsites, give each embedding page its
own `data-clinic-id` (any stable string of yours — an internal id, a slug).
Crisalix stores it on first sight and attaches every assessment from that page
to it, so the leads your clinical team receives are already segmented by
location. There is nothing to pre-register: send a new id and it exists.

## Receiving your visitors as leads

During the intake step the widget asks the visitor for contact details and
**explicit consent**. Only with that consent does Crisalix persist the
visitor's identity — and it is delivered to the treating clinic's console,
**never to your page**: the JavaScript results API is anonymous by design (see
the [API reference](api-reference.md) for exactly what your page can read).

## Going to production checklist

- [ ] Snippet `src` points at the production Crisalix host.
- [ ] `app_token` is your production token.
- [ ] Every hostname that will embed the widget is on your domain allowlist.
- [ ] `data-mode` is **not** present (internal development flag).
- [ ] Your page is served over HTTPS.
