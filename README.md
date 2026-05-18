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

## Important deployment note

This app uses server routes (`/api/*`) and should be deployed to a server-capable platform (for example Vercel). GitHub Pages cannot run these API routes.
