# ADLAA — Smart Digital Service Platform

ADLAA helps people find the right digital/government service, tells them **how complex** their
request is, **which documents** they need, **how long** it will take, and gives them a
**tracking ID** to follow progress.

Full stack: Express REST API + a server-side analysis engine + a live analytics dashboard.

```
Home  →  Application form  →  Server-side analysis  →  Tracking + Dashboard
```

## Quick start

```bash
npm install
npm run seed     # optional: loads 8 demo applications so the dashboard is not empty
npm start        # http://localhost:3000
```

No database setup is required. ADLAA uses MongoDB when `MONGODB_URI` is set **and reachable**,
and otherwise falls back automatically to a local JSON store at `data/applications.json`, so the
app always boots — useful during a demo.

```bash
cp .env.example .env     # then optionally set MONGODB_URI
npm run dev              # auto-reload
npm test                 # unit tests for the analysis engine and validation
```

## Pages

| Page | Path | What it does |
| --- | --- | --- |
| Home | `/` | Hero, live analyser demo, service catalogue and platform counters — all loaded from the API |
| Application form | `/form.html` | 3-step form, live validation, catalogue-driven autocomplete, "Get Assistance" preview |
| Result | `/form.html` (after submit) | Complexity score with reasoning, document checklist, action plan, tracking ID |
| Tracking | `/track.html` | Look up any application by tracking ID and view its status timeline |
| Dashboard | `/dashboard.html` | Live KPIs, charts, and a searchable table where statuses can be updated |

## The analysis engine

`src/services/analysis.js` scores every request out of 14 and explains itself. Inputs:

- **Category baseline** — each of the 7 categories has an intrinsic complexity.
- **Service match** — fuzzy-matches the typed service against the catalogue in `src/data/catalog.js`
  and uses its real processing time.
- **Complication signals** — words like *rejected*, *dispute*, *mismatch*, *correction*.
- **Urgency signals** and **first-time-applicant signals**.
- **Description quality** — too short (officer will ask for more) or very long (multi-part request).
- **Assisted applicant** — seniors and minors.

Output: `LOW` / `MEDIUM` / `HIGH`, an estimated number of days, a confidence score, the required
documents, suggested related services, a step-by-step action plan, and the full score breakdown
that the UI renders back to the user.

Because the scoring runs on the server, the form, the API and the dashboard can never disagree.

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Status and which storage backend is active |
| `GET` | `/api/catalog/categories` | All service categories |
| `GET` | `/api/catalog/categories/:id/services` | Services (with documents and timelines) in a category |
| `GET` | `/api/catalog/statuses` | Allowed application statuses |
| `POST` | `/api/applications/preview` | Run the analysis engine **without** saving — powers the live demo and "Get Assistance" |
| `POST` | `/api/applications` | Submit an application (validated server-side, returns the analysis + tracking ID) |
| `GET` | `/api/applications` | List with `search`, `status`, `category`, `difficulty`, `page`, `limit` |
| `GET` | `/api/applications/latest` | Most recent application |
| `GET` | `/api/applications/track/:trackingId` | Look up by tracking ID |
| `GET` | `/api/applications/:id` | Look up by internal ID |
| `PATCH` | `/api/applications/:id` | Update status (appends to the timeline) |
| `DELETE` | `/api/applications/:id` | Delete an application |
| `GET` | `/api/stats` | Aggregates: totals, difficulty mix, category mix, status pipeline, 7-day trend, behaviour averages, top locations |

Every response is `{ success, data }`; errors are `{ success, error, fields? }`, where `fields`
maps a form field to its message so the UI can highlight inputs.

Example:

```bash
curl -X POST localhost:3000/api/applications/preview \
  -H 'Content-Type: application/json' \
  -d '{"category":"financial","service":"Old Age Pension","description":"Application was rejected last year."}'
```

## Project structure

```
adlaa/
├── server.js                  # entry point
├── src/
│   ├── app.js                 # express app, static hosting, error handling
│   ├── data/catalog.js        # 7 categories, 34 services, documents, timelines
│   ├── models/Application.js  # mongoose schema
│   ├── routes/                # applications, catalog, stats
│   ├── services/
│   │   ├── analysis.js        # complexity engine
│   │   ├── applications.js    # validation, tracking IDs, status timeline
│   │   └── stats.js           # dashboard aggregation
│   └── store/                 # mongo store, json store, automatic selection
├── public/                    # index, form, dashboard, track, 404 + css/js
├── scripts/seed.js            # demo data
└── tests/analysis.test.js     # node:test unit tests
```

## Deployment

`render.yaml` and `Procfile` are included. On Render/Railway/Heroku:

1. Set `MONGODB_URI` to a MongoDB Atlas connection string (optional but recommended in production —
   the JSON fallback is per-instance and is lost when the instance restarts).
2. Build command `npm install`, start command `npm start`.
3. `PORT` is read from the environment.

## Notes for the demo

- `npm run seed` gives you a populated dashboard instantly.
- The home page analyser updates as you type, which shows the backend working without filling the form.
- Submitting an application immediately changes the dashboard KPIs, charts and table.
