# Ratnavue

A Ceylon gemstone and jewelry e-commerce/quotation site: catalog browsing, a
procedural gem configurator (2D SVG thumbnails + a rotatable 3D viewer with
real transparency), registered-customer quote/sourcing requests, and a full
admin panel for catalog, media, and request management.

## Stack

Next.js (App Router, TypeScript) · Tailwind CSS v4 · Prisma + PostgreSQL ·
NextAuth (Auth.js v5, credentials + optional Google) · Three.js / React
Three Fiber for the 3D gem viewer · local-disk media storage with `sharp`.

## First-time setup

1. **Start Postgres** (via Docker Compose — runs on port **5433** to avoid
   colliding with any native Postgres already on 5432):
   ```bash
   docker compose up -d
   ```
2. **Install dependencies** (already done if you're reading this right after
   the initial build):
   ```bash
   npm install
   ```
3. **Environment variables**: `.env` is already populated for local dev
   (copied from `.env.example`). Notably `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`
   are blank — Google sign-in stays hidden on the login page until you add
   real credentials there.
4. **Run migrations and seed data**:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
   This seeds the 18 standard cuts, ~17 minerals with realistic hue ranges,
   the 4-tier clarity scale, treatments/origins, a demo admin + customer
   account, and a handful of demo gemstones/jewelry pieces.
5. **Run the dev server**:
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
src/components/gem-visualizer/  Isolated procedural renderer — GemVisualizer (2D SVG,
                              used for catalog thumbnails) and Gem3D (Three.js, used
                              for hero views: product detail, configurator, home)
src/components/admin/        Admin forms/tables
src/actions/                 Server Actions (auth, quotes, catalog CRUD, media, master data)
src/lib/                     Prisma client, auth config, RBAC helpers, validation schemas
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
