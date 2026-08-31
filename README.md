# Ratnavue

A Ceylon gemstone and jewelry e-commerce/quotation site: catalog browsing, a
procedural gem configurator (SVG cut/colour/clarity preview), registered-
customer quote/sourcing requests, and a full admin panel for catalog, media,
and request management.

## Stack

Next.js (App Router, TypeScript) · Tailwind CSS v4 · Prisma + PostgreSQL
(Supabase) · NextAuth (Auth.js v5, credentials + optional Google) ·
`motion` for scroll/entrance animation · local-disk media storage with
`sharp`.

## First-time setup

1. **Install dependencies** (already done if you're reading this right after
   the initial build):
   ```bash
   npm install
   ```
2. **Environment variables**: `.env` is already populated for this project,
   pointing at a Supabase Postgres instance — see `.env.example` for what
   each variable means and how to get your own (Supabase dashboard →
   Connect). `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` are blank — Google
   sign-in stays hidden on the login page until you add real credentials.

   Prefer a local database instead of a hosted one? `docker-compose.yml`
   still works — `docker compose up -d`, then point `DATABASE_URL` and
   `DIRECT_URL` at `postgresql://ratnavue:ratnavue@localhost:5433/ratnavue?schema=public`
   (see the comment block at the top of `.env.example`).
3. **Run migrations and seed data**:
   ```bash
   npx prisma migrate deploy   # or `migrate dev` against a local DB
   npx prisma db seed
   ```
   This seeds the 18 standard cuts, ~17 minerals with realistic hue ranges,
   the 4-tier clarity scale, treatments/origins, a demo admin + customer
   account, and demo gemstones/jewelry pieces with real product photography.
4. **Run the dev server**:
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000.

## Seeded logins

Set in `.env` (`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`,
`SEED_CUSTOMER_EMAIL`/`SEED_CUSTOMER_PASSWORD`) — defaults:

- **Admin** — `admin@ratnavue.com` / `ChangeMe123!` → `/admin`
- **Customer** — `customer@example.com` / `ChangeMe123!`

Change these in production before going live.

## Project structure

```
prisma/schema.prisma        Data model (catalog, quotes, sourcing, master data, auth)
prisma/seed.ts               Seed script (uses src/lib/gem-constants.ts as source of truth)
src/app/                     Routes: storefront, /account, /admin
src/components/gem-visualizer/  Isolated procedural renderer (GemVisualizer) — an SVG
                              cut/colour/clarity preview used by the "Design Your Gem"
                              configurator and as a fallback on catalog cards for any
                              product without a real photo yet
src/components/admin/        Admin forms/tables
src/actions/                 Server Actions (auth, quotes, catalog CRUD, media, master data)
src/lib/                     Prisma client, auth config, RBAC helpers, validation schemas
public/images/                Seed/demo photography (hero banners + catalog/heritage shots)
                              — see ATTRIBUTION.md for sources and licensing
storage/uploads/             Local media storage (gitignored), served via /api/media/*
```

## Notes

- **Pricing model**: quote-only by design — there are no price fields
  anywhere in the schema or UI. The quote/sourcing note field is
  moderated client- and server-side to flag (not block) anything that
  looks like a stated offer price.
- **Cuts are a closed list**: the 18 standard cuts are fixed in
  `src/lib/gem-constants.ts`. The admin cuts page can only activate/
  deactivate them, not add new ones — this is intentional.
- **Media storage** is local disk for this MVP (see `src/lib/media.ts`).
  Swapping to S3/Cloudinary later just means changing that one file.
- **Database**: Prisma connects to Supabase via two URLs —
  `DATABASE_URL` (the pooled/PgBouncer connection the running app uses)
  and `DIRECT_URL` (a non-pooled connection Prisma Migrate needs for
  DDL/advisory locks). Both are documented in `.env.example`.
