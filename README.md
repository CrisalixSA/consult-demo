# Crisalix Non-Invasive Widget — Partner Integration Demo

[![Netlify Status](https://api.netlify.com/api/v1/badges/80b90c2a-4abd-452d-bdae-cc0539e10aca/deploy-status)](https://app.netlify.com/projects/non-invasive-demo/deploys)

**Live demo:** <https://non-invasive-demo.netlify.app>

A minimal, deployable demo of how a **partner** embeds the Crisalix self-assessment
widget on their own website. One HTML page, no build step, no framework — exactly
the footprint a real integration has.

> This repo plays the role of the **partner's site** (a fictional "Aurora Clinic").
> The widget itself is served by the Crisalix application — this demo only embeds it.

## What's in the box

| File | Purpose |
|------|---------|
| `index.html` | The fake partner page: the embed snippet + an example of consuming the results API |
| `docs/integration-guide.md` | How the integration works and every configuration option |
| `docs/api-reference.md` | The `CrisalixWidget` JavaScript API and the results payload schema |
| `docs/troubleshooting.md` | The errors you can hit and what they mean |

## Run it

The snippet in `index.html` ships pointed at the **Crisalix staging**
deployment with the staging partner's `partner_id` — real backend, real 3D.

1. Serve **this** folder over HTTP (the widget will not work from `file://`):

   ```sh
   npx serve .          # or: python3 -m http.server 8080
   ```

2. Open `http://localhost:8080` — `localhost` is on the staging partner's
   domain allowlist, so the page works as-is.

### Against a local backend instead

Point the snippet's `src` at `http://localhost:3009` with the locally seeded
`partner_id` (printed by `bin/rails db:seed` in the main repo). Optional: add
`data-mode="demo"` to the tag to see a 3D without the CoreApp pipeline — the
flag is development-only and ignored by real deployments.

## Configure it

Everything a partner configures lives in **one script tag** in `index.html`
(marked with a banner comment). Two values matter:

- **The widget origin** — where the Crisalix app runs (`http://localhost:3009`
  locally; your staging/production URL when deployed).
- **Your `partner_id`** — the publishable identifier of your partner account
  (no prefix). Locally, take it from the `bin/rails db:seed` output of the
  main repo or from the internal partner admin.

The optional `data-doctor-id` and `data-metadata` attributes let you attach
your own data to each consultation.

See [`docs/integration-guide.md`](docs/integration-guide.md) for every option.
