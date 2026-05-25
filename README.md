# LinkLens — Web AI Inspector & Previewer

Understand any website **before you open it**.

LinkLens analyzes a submitted URL, extracts meaningful page content, generates an AI-style preview summary, evaluates safety signals, and blends them with community reviews into one trust score.

---

## Table of Contents

- [Why LinkLens](#why-linklens)
- [Feature Highlights](#feature-highlights)
- [Product Flow](#product-flow)
- [Architecture at a Glance](#architecture-at-a-glance)
- [Tech Stack](#tech-stack)
- [API Endpoints](#api-endpoints)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Data & Persistence Model](#data--persistence-model)
- [Deployment (GitHub Actions → Vercel)](#deployment-github-actions--vercel)
- [Project Structure](#project-structure)
- [Roadmap Ideas](#roadmap-ideas)
- [License](#license)

---

## Why LinkLens

Clicking unknown URLs can waste time—or worse, expose users to risky pages.

LinkLens provides:

- A quick content preview
- Practical safety clues
- Community trust context

So users can make a better decision before visiting a link directly.

---

## Feature Highlights

- **Live URL Inspection** via `POST /api/inspect`
- **URL Guardrails** (only `http/https`, blocks localhost/private/internal networks)
- **Content Extraction** with HTML validation, fetch timeout, and payload limits
- **AI-style Page Summary** from extracted metadata/body text
- **Safety Classification** (`safe`, `medium`, `high`) with human-readable reasons
- **Trust Score** = `70% community rating + 30% AI safety score`
- **Community Reviews** (rating + optional text) on every inspected URL
- **Dual Persistence Strategy**:
  - Supabase (primary, when configured)
  - Secure cookie fallback (when Supabase env vars are missing)

---

## Product Flow

1. User submits a URL from the home page.
2. Backend normalizes and validates the URL.
3. Server fetches and parses HTML.
4. App extracts title, meta description, and body text.
5. AI module generates summary + safety flags.
6. Record is stored and accessible via `/url/[id]`.
7. Users can contribute ratings/reviews that update trust context.

---

## Architecture at a Glance

- **Frontend**: Next.js App Router pages/components
- **Backend**: Next.js Route Handlers (`app/api/*`)
- **Parsing**: `cheerio` for HTML content extraction
- **Safety Rules**: Pattern-based heuristics + DNS/IP private-network checks
- **Persistence**:
  - Supabase tables (`url_records`, `url_reviews`) when configured
  - In-memory + cookie fallback for local/no-config operation

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: React 19 + Tailwind CSS 4
- **Linting**: ESLint 9
- **Data Layer**: Supabase JS client (optional runtime configuration)

---

## API Endpoints

### `POST /api/inspect`

Inspects a URL and returns:

- normalized URL
- extracted metadata
- generated summary
- safety flags

### `GET /api/urls/:id`

Returns stored URL details with computed community/safety metrics.

### `GET /api/reviews?urlId=<id>`

Returns reviews for a URL.

### `POST /api/reviews`

Creates/updates a user review for a URL.

---

## Local Development

### 1) Install dependencies

```bash
npm install
```

### 2) Run development server

```bash
npm run dev
```

Open: `http://localhost:3000`

### 3) Lint and build

```bash
npm run lint
npm run build
```

### 4) Run production server (after build)

```bash
npm start
```

---

## Environment Variables

Supabase is optional, but required for persistent shared storage:

```bash
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

If these are not set, the app still works using fallback persistence behavior for inspected results and reviews.

---

## Data & Persistence Model

### Primary mode (Supabase configured)

- URL records are upserted in `url_records`
- Reviews are upserted in `url_reviews`
- Community metrics are computed from stored reviews

### Fallback mode (no Supabase config)

- URL data is cached in memory
- Last inspected result is stored in `linklens_last_result` cookie
- Reviews are stored in per-URL cookies (`linklens_reviews_<urlId>`)

This design keeps the app usable in local or demo environments even without database credentials.

---

## Deployment (GitHub Actions → Vercel)

This project includes a workflow at:

`/.github/workflows/deploy-pages.yml`

It deploys to Vercel on pushes to `main` (or manual dispatch).

### Required GitHub Actions secrets

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Setup steps

1. Import the repository into Vercel.
2. Copy `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` from Vercel.
3. Create a Vercel access token (`VERCEL_TOKEN`).
4. Add all three values as repository Actions secrets.
5. Push to `main` or run the workflow manually.

---

## Project Structure

```text
app/
  api/
    inspect/route.ts        # URL inspection pipeline
    reviews/route.ts        # Review read/write endpoints
    urls/[id]/route.ts      # URL result retrieval
  url/[id]/page.tsx         # URL insight page
components/                 # UI components (search, reviews, trust badge)
lib/                        # Core logic (AI, URL validation, scraping, store)
supabase/migrations/        # DB schema migrations
.github/workflows/          # CI/CD deployment workflow
```

---

## Roadmap Ideas

- Replace heuristic summary with real LLM provider integration
- Add domain reputation signals and richer risk classifiers
- Improve anti-abuse controls and request rate limiting
- Add authentication and reviewer identity controls
- Add observability dashboard for inspection outcomes

---

## License

This repository is licensed under the terms of the [LICENSE](./LICENSE) file.
