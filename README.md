# Crisalix Widget — Partner Integration Demo

A minimal, deployable demo of how a **partner** embeds the Crisalix self-assessment
widget on their own website. One HTML page, no build step, no framework — exactly
the footprint a real integration has.

> This repo plays the role of the **partner's site** (a fictional "Aurora Clinic").
> The widget itself is served by the Crisalix application — this demo only embeds it.

## What's in the box

| File | Purpose |
|------|---------|
| `index.html` | The fake partner page: the embed snippet + an example of consuming the results API |
| `netlify.toml` | Zero-config Netlify deployment (static publish) |
| `docs/integration-guide.md` | How the integration works and every configuration option |
| `docs/api-reference.md` | The `CrisalixWidget` JavaScript API and the results payload schema |
| `docs/troubleshooting.md` | The errors you can hit and what they mean |

## Run it

The snippet in `index.html` ships pointed at the **Crisalix staging**
deployment with the staging Crisalix partner token — real backend, real 3D.

1. Serve **this** folder over HTTP (the widget will not work from `file://`):

   ```sh
   npx serve .          # or: python3 -m http.server 8080
   ```

2. Open `http://localhost:8080` — `localhost` is on the staging partner's
   domain allowlist, so the page works as-is.

### Against a local backend instead

Point the snippet's `src` at `http://localhost:3009` with the locally seeded
partner token (printed by `bin/rails db:seed` in the main repo). Optional: add
`data-mode="demo"` to the tag to see a 3D without the CoreApp pipeline — the
flag is development-only and ignored by real deployments.

## Configure it

Everything a partner configures lives in **one script tag** in `index.html`
(marked with a banner comment). Two values matter:

- **The widget origin** — where the Crisalix app runs (`http://localhost:3009`
  locally; your staging/production URL when deployed).
- **Your `app_token`** — the publishable token of your partner account
  (`pk_…`). Locally, take it from the `bin/rails db:seed` output of the main
  repo or from the internal partner admin.

See [`docs/integration-guide.md`](docs/integration-guide.md) for every option.

## Deploy to Netlify

1. Drag-and-drop this folder into Netlify (or connect the repo — `netlify.toml`
   makes it zero-config).
2. Point the snippet's `src` at a **publicly reachable** Crisalix deployment
   (e.g. staging) — a Netlify page cannot reach your `localhost`.
3. Ask Crisalix to **register your Netlify domain** (e.g. `your-demo.netlify.app`)
   on the partner account. Without it the widget refuses to load — the domain
   allowlist drives both the server-side checks and the browser-enforced
   framing policy.
That's it: the whole partner-side integration is the one script tag.
