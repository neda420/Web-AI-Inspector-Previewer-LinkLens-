# LinkLens (Web AI Inspector & Previewer)

LinkLens helps users understand what a URL is before committing time or trust.

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run development server:
   ```bash
   npm run dev
   ```
3. Build production app:
   ```bash
   npm run build
   npm start
   ```

Open `http://localhost:3000`.

## MVP implemented in this repository

- Next.js App Router + TypeScript + Tailwind setup
- URL submission and secure inspection route at `POST /api/inspect`
- HTML extraction (`cheerio`) with timeout/size/content-type checks
- SSRF-style host checks (localhost/private ranges blocked)
- URL result pages at `/url/[id]`
- Review API at `POST /api/reviews` and timeline rendering
- Trust score display (70% community + 30% AI safety bucket)
- Supabase starter migration at `supabase/migrations/001_init.sql`

## Deploy with GitHub Actions (Vercel)

This app uses server routes (`/api/*`), so GitHub Pages cannot run it.
Use the included GitHub Actions workflow to deploy to Vercel on every push to `main`.

1. In Vercel, import this repository and copy:
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
2. Create a Vercel token (`VERCEL_TOKEN`).
3. In GitHub repository **Settings → Secrets and variables → Actions**, add:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Push to `main` (or manually run the workflow) to deploy.

If `SUPABASE_URL` and `SUPABASE_ANON_KEY` are missing, your deployed app will fail when the Supabase-backed store is enabled.
