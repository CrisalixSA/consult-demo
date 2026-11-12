# JavaScript API Reference

The SDK exposes one global once loaded: `window.CrisalixWidget`.

## Events

The widget posts every event to your page, only to an origin on your
allowed domains. Subscribe with the SDK or with DOM events:

```js
const off = window.CrisalixWidget.on("module_completed", (event) => save(event.refs, event.data))
window.CrisalixWidget.on("*", (event) => console.log(event.type))

document.querySelector("#crisalix-widget").addEventListener(
  "crisalix:module_completed",
  (event) => console.log(event.detail)
)
```

- `CrisalixWidget.on(type, callback)` subscribes to one event type, or to all
  with `"*"`. It returns a function that removes the callback.
- The container also dispatches a bubbling `crisalix:<type>` `CustomEvent`
  with the envelope in `detail`.
- `window.CrisalixWidget` exists once the SDK has mounted. Subscribe after
  that, or attach `crisalix:<type>` listeners to the container, which work at
  any time.
- Events are re-sent on every page load and reopen; the SDK drops
  duplicates. A closed tab sends nothing, so abandonment is "started, never
  completed".

### Envelope (version `1`)

```json
{ "source": "crisalix-widget", "type": "module_completed", "module": "self_assessment", "version": "1",
  "refs": { "case": "cs_8f3k..." }, "data": { } }
```

| Event | When | `data` |
|-------|------|--------|
| `session_started` | Session opens | `{}` |
| `module_started` | A module starts | `{}` |
| `module_progress` | An inner step ends | `{ "step": "photos_uploaded" }`, `{ "step": "intake_answered", "intake" }`, `{ "step": "ranking_done", "ranked_regions" }` |
| `module_completed` | A module ends | The module's full output |
| `session_completed` | Every module ended | `{ "outputs": { "<module>": … } }` |
| `session_failed` | Start refused | `{ "code" }` — see below |

`session_failed` codes: `modules_required`, `module_not_allowed`,
`module_not_purchased`, `input_not_found`, `invalid_signature`,
`link_expired`, `unknown_token`, `domain_not_allowed`, `clinic_id_required`.

`refs` are opaque references: `case` (`cs_…`), `consultation` (`cn_…`),
`treatment_plan` (`tp_…`) and `appointment` (`ap_…`). Store them and send them
back as `inputs` of a signed clinic launch.

The `treatment_plan` output lists every item with its product, quantity,
unit, price, planned date, urgency and areas and, when `facial_mapping` ran,
a link to the facial mapping PDF that expires after one hour. Injection point
coordinates are never sent.

Adding fields keeps version `1`. Removing or changing fields needs a new
version, so read `version` and ignore fields you do not know.

## `CrisalixWidget.getResults([options])`

Requests what the session has produced so far.

```js
const results = await window.CrisalixWidget.getResults()
results.status // "in_progress" or "completed"
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | number (ms) | `5000` | How long to wait for the widget's answer before rejecting. |

**Returns** a `Promise` that:

- **resolves** with `{ version, status, refs, outputs }`. Partial data is
  allowed: `status` is `in_progress` until every module ended, then
  `completed`, and `outputs` holds every module of the session with whatever
  data it has so far;
- **rejects** with an `Error` whose message contains:
  - `results_unavailable` — the widget could not produce results (e.g. the
    session expired).
  - `results request timed out` — no answer within `timeout` (is the widget
    loaded and on-screen?).

## The self-assessment output

The self-assessment lives at `outputs.self_assessment` of `getResults()`, and
is the `data` of its `module_completed` event. Always read the `version` field
and code defensively against unknown fields.

```json
{
  "version": "1",
  "status": "completed",
  "refs": { "case": "cs_8f3k..." },
  "outputs": {
    "self_assessment": {
      "status": "completed",
      "ranked_regions": ["frontal", "orbital", "nasal", "zygomatic", "buccal", "oral", "mental", "auricular"],
      "ratings": [
        {
          "region_id": "nasal", "region_name": "Nose", "rating": 7,
          "concerns": [{ "id": "nostril_width", "label": "Nostril width" }],
          "other": "Slight bump since an old injury"
        }
      ],
      "intake": [
        { "id": "top_goal", "question": "What are your aesthetic goals?", "answer": "Look refreshed" }
      ]
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Envelope/result version (`1`). |
| `status` | string | `in_progress` or `completed`. |
| `refs` | object | Opaque references (`case`, `consultation`, `treatment_plan`, `appointment`) known so far. |
| `outputs.self_assessment.status` | string | Status of the module. |
| `outputs.self_assessment.ranked_regions` | string[] | The 8 facial region ids, ordered from the visitor's favorite to least favorite. |
| `….ratings[]` | object[] | One entry per region the visitor rated (skipped regions are omitted). |
| `….ratings[].region_id` | string | Stable region identifier (`frontal`, `orbital`, `nasal`, `zygomatic`, `buccal`, `oral`, `mental`, `auricular`). |
| `….ratings[].region_name` | string | Human-readable region name, in the clinic's language (the partner's default language when no clinic is set). |
| `….ratings[].rating` | number | 1–10, the visitor's self-rating for the area. |
| `….ratings[].concerns[]` | object[] | Concerns the visitor picked for the area, in display order. Empty when none. |
| `….ratings[].concerns[].id` | string | Stable concern identifier (for example `nostril_width`). Code against this. |
| `….ratings[].concerns[].label` | string | Human-readable concern, in the clinic's language (the partner's default language when no clinic is set). |
| `….ratings[].other` | string | The visitor's own words about the area; empty string when they added none. |
| `….intake[]` | object[] | The goal/background questions the visitor answered: `id`, `question`, `answer`. Multi-choice answers are comma-joined. |

### What is deliberately NOT in the payload

The self-assessment output is **anonymous by design**. It never contains:

- personal data (name, email, phone, address) — even when the visitor provided
  it with consent, it goes to the treating clinic, not to your page;
- database ids (only the opaque references above are sent);
- media (photos, 3D asset URLs) or timestamps.

If your integration needs the lead itself, that is a clinic-console workflow —
not a browser API.

## `CrisalixWidget.catalog({ products })`

> **Planned.** This is not available yet. See
> [Using your own product catalog](integration-guide.md#using-your-own-product-catalog).

Registers your **catalog data provider**: the function the widget calls to
read your product catalog, one page at a time. It
only takes effect once Crisalix has enabled the external catalog for your
partner account. Register it on every page that opens `facial_mapping`.

Load your registration script with `defer` right after `widget.js`, so it
runs once `window.CrisalixWidget` exists:

```html
<script src="https://<crisalix-host>/widget.js?partner_id=YOUR_PARTNER_ID" defer
        data-container="#crisalix-widget"
        data-launch="<JWT built by your backend>"></script>
<script src="/js/crisalix-catalog.js" defer></script>
```

`crisalix-catalog.js` registers the data provider. What happens inside is up to
you: call your API, read a file, filter a list in memory.

```js
window.CrisalixWidget.catalog({
  async products({ query, category, injectable, page }) {
    // Your code: find the products that match and return one page of them.
    return { products: [], categories: [], hasMore: false }
  }
})
```

### What `products()` receives

| Field | Type | Description |
|-------|------|-------------|
| `query` | string | What the doctor typed. Empty when they have not searched. |
| `category` | string or `null` | The category the doctor picked, or `null` for all. |
| `injectable` | `true` or `null` | `true` when the doctor is placing a point on the face: return only injectables. `null`: return every product. |
| `page` | number | Starts at `1`. The widget asks for the next page while `hasMore` is `true`. |

The widget calls it when the product picker opens (`page: 1`), when the
doctor scrolls to the end of the list (`page: 2`, `3`…), and again with
`page: 1` every time the search text or the category changes.

### What `products()` returns

A `Promise` (or a plain object) with:

| Field | Type | Description |
|-------|------|-------------|
| `products` | array | One page of products, in the order to show them. |
| `categories` | array of strings | Every category in your catalog, for the filter chips. |
| `hasMore` | boolean | `true` if there is another page. |

Each product:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Required. Must stay the same for the same product: doctors' favorites are kept by this id. |
| `name` | string | Required. |
| `brand` | string | |
| `category` | string | One of `categories`. |
| `unit` | `"U"`, `"mL"` or `null` | Leave it `null` for products without a dose, such as creams. |
| `injectable` | boolean | Only injectables can be placed on the face. |

Text fields are limited to 255 characters and are shown as plain text, never as HTML.

### Example

An illustrative answer to `products({ query: "", category: null, injectable: null, page: 1 })`.
The values are made up; only the shape matters.

```json
{
  "products": [
    {
      "id": "sku-1042",
      "name": "Hyaluronic acid filler, lips",
      "brand": "Brand A",
      "category": "Fillers",
      "unit": "mL",
      "injectable": true
    },
    {
      "id": "sku-2210",
      "name": "Botulinum toxin 100U",
      "brand": "Brand B",
      "category": "Toxins",
      "unit": "U",
      "injectable": true
    },
    {
      "id": "sku-3007",
      "name": "Post-treatment repair cream",
      "brand": "Brand C",
      "category": "Skincare",
      "unit": null,
      "injectable": false
    }
  ],
  "categories": ["Fillers", "Toxins", "Skin boosters", "Skincare"],
  "hasMore": true
}
```

### Errors

If no function is registered, it throws, or it does not answer within
**10 seconds**, the widget shows "Catalog unavailable" with a retry button.
It never falls back to another catalog.

## Message-channel details (advanced)

The SDK and the widget talk over `postMessage`. You normally never touch
this — the SDK wraps it — but for auditing: your page only receives messages
whose `source` is `"crisalix-widget"` (the envelope above), the widget only
answers requests coming from its direct parent window on an allowlisted
origin, and replies always target your page's exact origin, never `*`.
