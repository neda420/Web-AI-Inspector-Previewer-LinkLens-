# LinkLens

LinkLens is a Next.js web application that inspects a URL before you open it and presents:

- AI-generated page preview
- Safety risk signals
- Community trust score and anonymous reviews

## Features

- URL normalization and public-network safety checks
- HTML extraction with bounded content handling
- AI-style summary generation
- Risk classification (`safe`, `medium`, `high`)
- Trust score aggregation:
  - If no community reviews exist, trust score equals AI safety score
  - Otherwise: `0.7 * community rating + 0.3 * AI safety score`
- Anonymous community reviews stored in Supabase
- URL details page with back-to-previous-page and exit navigation

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- Supabase (`@supabase/supabase-js`)
- ESLint 9

## Project Structure

```text
app/
  api/
    inspect/route.ts
    reviews/route.ts
    urls/[id]/route.ts
  url/[id]/page.tsx
components/
lib/
supabase/migrations/
```

## API

### `POST /api/inspect`

Inspects a submitted URL and stores/retrieves its analysis record.

### `GET /api/urls/:id`

Returns inspected URL details with computed scores.

### `GET /api/reviews?urlId=<id>`

Returns anonymous reviews for a URL (Supabase required).

### `POST /api/reviews`

Creates or updates the current browser session’s anonymous review.

## Environment Variables

Set these variables to enable persistent storage:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run lint
npm run build
```

## Deployment

Deployment is automated via `.github/workflows/deploy-pages.yml` using Vercel CLI.

Required GitHub Actions secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## License

Licensed under the terms of [LICENSE](./LICENSE).
