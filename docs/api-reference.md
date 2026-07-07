# JavaScript API Reference

The SDK exposes one global once loaded: `window.CrisalixWidget`.

## `CrisalixWidget.getSelfAssessmentResults([options])`

Requests the visitor's self-assessment results from the widget.

```js
const results = await window.CrisalixWidget.getSelfAssessmentResults()
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | number (ms) | `5000` | How long to wait for the widget's answer before rejecting. |

**Returns** a `Promise` that:

- **resolves** with the results payload (below) — only once the visitor has
  **completed** the assessment;
- **rejects** with an `Error` whose message contains:
  - `assessment_not_completed` — the visitor has not finished yet. Nothing
    partial is ever returned: results exist as a whole or not at all.
  - `results_unavailable` — the widget could not produce results (e.g. the
    visitor session expired).
  - `results request timed out` — no answer within `timeout` (is the widget
    loaded and on-screen?).

## The results payload

> **Contract status: `draft-1`.** The schema below is versioned and may still
> change shape before being frozen — always read the `version` field and code
> defensively against unknown fields.

```json
{
  "version": "draft-1",
  "status": "completed",
  "ranked_regions": ["frontal", "orbital", "nasal", "zygomatic", "buccal", "oral", "mental", "auricular"],
  "ratings": [
    { "region_id": "nasal", "region_name": "Nose", "rating": 7, "notes": "nostril width" }
  ],
  "intake": [
    { "id": "top_goal", "question": "What are your aesthetic goals?", "answer": "Look refreshed" }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Payload schema version (`draft-1`). |
| `status` | string | Always `completed` on a resolved promise. |
| `ranked_regions` | string[] | The 8 facial region ids, ordered from the visitor's favorite to least favorite. |
| `ratings[]` | object[] | One entry per region the visitor rated (skipped regions are omitted). |
| `ratings[].region_id` | string | Stable region identifier (`frontal`, `orbital`, `nasal`, `zygomatic`, `buccal`, `oral`, `mental`, `auricular`). |
| `ratings[].region_name` | string | Human-readable region name. |
| `ratings[].rating` | number | 1–10, the visitor's self-rating for the area. |
| `ratings[].notes` | string \| null | The visitor's own words about the area. |
| `intake[]` | object[] | The goal/background questions the visitor answered. Multi-choice answers are comma-joined. |

### What is deliberately NOT in the payload

The results API is **anonymous by design**. It never contains:

- personal data (name, email, phone, address) — even when the visitor provided
  it with consent, it goes to the treating clinic, not to your page;
- internal identifiers (visitor, assessment, clinic or partner ids);
- media (photos, 3D asset URLs) or timestamps.

If your integration needs the lead itself, that is a clinic-console workflow —
not a browser API.

## Message-channel details (advanced)

The SDK and the widget talk over `postMessage` with the envelope
`{ source, type, payload }`. You normally never touch this — the promise API
wraps it — but for auditing: your page only receives messages whose `source`
is `"crisalix-widget"`, the widget only answers requests coming from its
direct parent window on an allowlisted origin, and replies always target your
page's exact origin, never `*`.
