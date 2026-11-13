# Integration Guide

How to embed the Crisalix self-assessment widget on your site, what happens
under the hood, and every option you can configure.

## Overview

The widget runs the full guided self-assessment — photos, goals intake, facial
area ranking and rating with a real 3D preview — inside an `<iframe>` on
**your** page. Your visitors never create an account and never leave your
site; your page receives events and can pull their (anonymous) results
through a small JavaScript API.

Integration is a single script tag:

```html
<div id="crisalix-widget"></div>
<script src="https://<crisalix-host>/widget.js?partner_id=YOUR_PARTNER_ID" defer
        data-container="#crisalix-widget"
        data-modules="self_assessment"
        data-clinic-id="YOUR_CLINIC_ID"></script>
```

## Modules and entries

A launch names the **modules** it runs. You pick which modules run, never
their order: the widget always runs `capture` → `self_assessment` →
`booking` / `treatment_plan` → `facial_mapping`, and adds missing
dependencies (`self_assessment` needs `capture` unless the case already has a
3D model, `booking` and `treatment_plan` need a completed self-assessment,
`facial_mapping` needs `treatment_plan`).

| Module | Audience | Done when | Output refs |
|--------|----------|-----------|-------------|
| `capture` | Patient, clinic | Photos uploaded, 3D requested | `case` |
| `self_assessment` | Patient, clinic | Intake, ranking and rating complete | `case` |
| `booking` | Patient | Appointment booked | `appointment` |
| `treatment_plan` | Clinic | Doctor finishes the plan | `consultation`, `treatment_plan` |
| `facial_mapping` | Clinic | Finished with the treatment plan | `consultation` |

There are three ways to launch the widget:

| Entry | Allowed modules | Records |
|-------|-----------------|---------|
| Public snippet (`data-modules`) | `capture`, `self_assessment`, `booking` | Always new |
| Signed patient link (`kind: "patient"`) | `capture`, `self_assessment`, `booking` | Resumed by your `booking_ref` |
| Signed clinic launch (`kind: "clinic"`) | `capture`, `self_assessment`, `treatment_plan`, `facial_mapping` | New, or the `inputs` it names |

`capture`, `self_assessment` and `booking` need your Face Assessment
purchase. `treatment_plan` and `facial_mapping` only run from a signed clinic
launch. Any other combination fails at start with `session_failed` (see
[Events](api-reference.md#events)).

Each module renders like its Crisalix app counterpart, minus the *Exit*
button: inside your page there is no dashboard or patient record to return to.

## Signed launches

A signed launch is a compact JWT (HS256) signed with your **launch secret**.
Crisalix provides the secret; keep it on your backend and never ship it to a
browser. Your backend builds the token and you pass it as `data-launch`.
**You decide when and where your backend builds the token** (for example
when a clinician opens a patient file, or when you send a booking
confirmation); Crisalix only defines the token contract below and reads
`data-launch`.

| Claim | Kinds | Purpose |
|-------|-------|---------|
| `kind` | both | `patient` or `clinic`. One kind can never be replayed as the other. |
| `exp` | both | Expiry, Unix seconds. A clinic launch may live at most 5 minutes. |
| `clinic_id`, `clinic_name` | both | Your own clinic. Unknown clinics are created. |
| `modules` | both | Array of module names. Required. |
| `jti` | clinic | Unique id. A clinic launch works once. |
| `inputs` | clinic | Optional `{ "case": "cs_…", "treatment_plan": "tp_…" }`, resolved only within `clinic_id`. |
| `doctor_id`, `doctor_name` | clinic | Optional doctor of your own. |
| `booking_ref` | patient | Your booking. Reopening the link resumes the same case. |
| `patient` | patient | `{ "name", "email" }`, trusted and prefilled. |
| `locale` | both | Optional, as `data-locale`. |

A patient link is not single use and works until `exp`. A completed case
shows the final screen again and re-sends its outputs. A `treatment_plan`
input resumes the plan when it is open and shows it read-only when it is
completed; a bare `case` always opens a new consultation.

```html
<script src="https://<crisalix-host>/widget.js?partner_id=YOUR_PARTNER_ID" defer
        data-container="#crisalix-widget"
        data-launch="<JWT built by your backend>"></script>
```

With `data-launch`, its claims replace `data-modules`, `data-clinic-*` and
`data-doctor-*`.

## References

Cases (`cs_…`), consultations (`cn_…`), treatment plans (`tp_…`) and
appointments (`ap_…`) carry opaque references. Store them and send them back
as `inputs`; database ids never leave the widget.

## Prerequisites

1. **A partner account** with Crisalix. You receive:
   - your **`partner_id`** — a *publishable* identifier, safe to ship in your
     HTML (same model as a Stripe publishable key or a Maps API key). It is
     not a secret; it identifies your account. The value carries no prefix.
   - a registered **domain allowlist** — the exact hostnames your pages are
     served from (e.g. `www.auroraclinic.com`). The widget only loads and only
     renders inside pages on those domains. Adding or changing domains is a
     request to Crisalix, not a code change on your side.
2. **HTTPS hosting** for your page in production. Locally, `http://localhost`
   works.

## How it works

```
Your page ──/widget.js?partner_id──▶ Crisalix (validates identifier + domain, serves the SDK)
    │  the SDK injects ──▶ <iframe src=".../widget/start?partner_id=...">
    │                          │ Crisalix mints a signed, short-lived visitor session
    ▼                          ▼
your visitors complete the assessment entirely inside the iframe
    │
    ├── events (session_started … session_completed) ──▶ pushed to your page
    └── getResults() ──▶ results so far, on demand
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

The `partner_id` travels **in the script `src` query string** — that request
is validated before the SDK is even served.

| Where | Option | Required | Default | What it does |
|-------|--------|----------|---------|--------------|
| `src` query | `partner_id` | **Yes** (production) | — | Identifies your partner account. Requests with an unknown or deactivated identifier are refused. |
| attribute | `data-container` | No | `[data-crisalix-widget]` | CSS selector of the element the widget iframe is injected into. |
| attribute | `data-modules` | **Yes** (without `data-launch`) | — | Comma-separated modules of a public launch, e.g. `self_assessment,booking`. Allowed: `capture`, `self_assessment`, `booking` — see [Modules and entries](#modules-and-entries). |
| attribute | `data-launch` | No | — | A [signed launch](#signed-launches) built by your backend. Its claims replace `data-modules`, `data-clinic-*` and `data-doctor-*`. |
| attribute | `data-clinic-id` | **Yes** (with a `partner_id`) | — | **Your** identifier for the clinic/microsite this page belongs to. First use auto-registers it on your account; every assessment started here is attributed to it. Use it to segment leads per location. |
| attribute | `data-doctor-id` | No | — | **Your** identifier for the doctor/practitioner behind this page (any string up to 255 characters — it maps to nothing on Crisalix's side). Stored on every consultation started here, for attribution and reporting. Never exposed through the results API. |
| attribute | `data-metadata` | No | — | A JSON **object** of your own data (the raw attribute must stay ≤ 2048 bytes), attached to every consultation started here, for attribution and reporting. Invalid JSON, non-object values, or oversized payloads are silently ignored — they never block the widget. Never exposed through the results API. |
| attribute | `data-theme` | No | — | Brand theme key. |
| attribute | `data-locale` | No | — | Widget language: `en`, `es`, `pt` or `fr`. Falls back to the clinic's locale, then your default locale, then `en`. An unsupported value is ignored, not an error. |
| attribute | `data-title` | No | `Self-assessment` | Accessible `title` of the iframe. Set it to match `data-locale`. |
| attribute | `data-height` | No | `700` | Fixed height (px) of the widget iframe. The widget's screens are phone-like and scroll internally — the iframe never resizes itself. |

Notes:

- **Keep the tag literal.** The SDK locates its own `<script>` element while
  the document parses; injecting the tag dynamically breaks that discovery
  (see [troubleshooting](troubleshooting.md)).
- The iframe is created with `allow="camera"` so the guided selfie capture
  works. Visitors without a camera get a manual upload fallback automatically.
- The stage can be as large as you want — including viewport-filling via CSS
  on the container. What is unsupported is autosizing it to its content; see
  [troubleshooting → Sizing the stage](troubleshooting.md#sizing-the-stage).
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
**never to your page**: the results your page receives are anonymous by design
(see the [API reference](api-reference.md) for exactly what it can read).

## Using your own product catalog

In `facial_mapping` the doctor picks products from a catalog. By default it is
the one configured in your Crisalix account. If you already keep your
catalog in your own system, the widget can use it directly instead:

1. **Crisalix enables the external catalog** for your partner account. From
   then on the widget only uses your catalog, never ours.
2. **Your page registers a catalog data provider**: one function,
   `products()`, passed to `CrisalixWidget.catalog()`. The widget calls it to get one page of
   products at a time: when the product picker opens, when the doctor scrolls
   for more, searches or picks a category.
3. **You return products in our format.** How you get them is up to you: an
   API call, a JSON file, a list in memory. Crisalix never sees your
   endpoints or credentials, and the function runs with your page's own
   session.

Your catalog stays in your system, so any change you make shows up on the
next request. Crisalix only stores a copy of the product the doctor actually
chooses, inside the treatment plan, so the plan stays readable even if you
later rename or remove that product.

One catalog serves all your clinics. The data provider and the product format are
in the [API reference](api-reference.md#crisalixwidgetcatalog-products-).

## Going to production checklist

- [ ] Snippet `src` points at the production Crisalix host.
- [ ] `partner_id` is your production identifier.
- [ ] `data-modules` lists only public modules and `data-clinic-id` is set (or `data-launch` is built by your backend).
- [ ] Your launch secret lives only on your backend.
- [ ] Every hostname that will embed the widget is on your domain allowlist.
- [ ] `data-mode` is **not** present (internal development flag).
- [ ] Your page is served over HTTPS.
