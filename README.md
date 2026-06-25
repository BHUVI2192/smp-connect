# MP CONNECT — Constituency Management System

A full-stack governance platform for Members of Parliament, Personal Assistants, and Office Staff.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, ShadCN UI
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime), Prisma ORM
- **Charts:** Recharts
- **Notifications:** Supabase Realtime

---

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon Key** from Settings > API
3. Note your **Service Role Key** from Settings > API (keep this secret)
4. Note your **Database Connection String** from Settings > Database > Connection String (URI)

### Step 2: Configure Authentication

1. Go to **Authentication > Providers > Email**
2. **Disable** "Confirm email" toggle (important for dev setup)
3. **Disable** "Enable signup" toggle (we only want predefined users)

### Step 3: Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:YOUR-PASSWORD@db.YOUR-PROJECT.supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Run SQL Script 1 — Auth & Storage

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste `scripts/01-auth-and-storage.sql`
3. Click **Run** — this creates:
   - 3 auth users (MP, PA, Staff) with fixed UUIDs
   - Storage buckets (images, videos, audio, documents)
   - Storage access policies

### Step 5: Install Dependencies & Push Schema

```bash
npm install
npx prisma generate
npx prisma db push
```

This creates all 30+ database tables in your Supabase PostgreSQL.

### Step 6: Run SQL Script 2 — Realtime & Search Indexes

1. Go back to **SQL Editor** in Supabase Dashboard
2. Copy and paste `scripts/02-realtime-and-search.sql`
3. Click **Run** — this creates:
   - Realtime subscription on the `notifications` table
   - Full-text search GIN indexes on contacts, complaints, letters, works, speeches

> **Why two scripts?** Script 2 references tables that only exist after `prisma db push`.
> Running them in the wrong order causes "relation does not exist" errors.

### Step 7: Seed Data

```bash
npm run db:seed
```

This loads Karnataka locations (10 districts, 30+ taluks, 90+ villages), 30 trains, sample contacts/complaints/works, and MPLADS fund data.

### Step 8: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 9 (optional): Quick Setup Summary

```bash
# Full setup in order:
# 1. Create Supabase project
# 2. Disable email confirm + signup in Auth settings
# 3. Run scripts/01-auth-and-storage.sql in SQL Editor
# 4. cp .env.example .env  (fill in credentials)
# 5. npm install && npx prisma generate && npx prisma db push
# 6. Run scripts/02-realtime-and-search.sql in SQL Editor
# 7. npm run db:seed
# 8. npm run dev
```

---

## Login Credentials

| Role  | Email          | Password   |
|-------|---------------|------------|
| MP    | mp@smp.com    | Mp@123     |
| PA    | pa@smp.com    | Pa@123     |
| Staff | staff@smp.com | Staff@123  |

---

## Architecture

### Database Tables

**Core:** profiles, audit_logs, notifications

**Location Hierarchy:** states → districts → taluks → panchayats → villages

**Planning:** plan_today_events, tour_programs, day_book_entries

**Work & Development:** development_works, development_work_media, mplads_projects, mplads_funds

**Complaints:** complaints (full workflow: RECEIVED → VERIFIED → IN_REVIEW → FORWARDED → RESOLVED)

**Communication:** letters, parliament_letters, parliament_questions, parliament_answers

**Media:** photo_gallery_albums, photo_gallery_photos, speech_storage

**Contacts:** contacts, greeting_logs

**Railway:** train_master, railway_eq_requests, railway_quota_config

### Role-Based Access

- **MP Portal:** Dashboard, Live Briefing (geolocation), Tours, Development viewer, MPLADS graphs, Complaint insights, Gallery
- **PA Portal:** Plan Today, Day Book, Development Works, Dispatch Hub, Tour Hub, Letters, Greetings, Gallery, Speeches, Parliament Tracker, Railway EQ
- **Staff Portal:** Plan Today (view), Events, Complaints (register + verify), Letters (draft), MPLADS (entry feeds Dev Works), Contacts, Media, Speeches, Parliament, Railway EQ

### Key Features

- **Global Search:** Searches across contacts, complaints, letters, development works, speeches
- **Realtime Notifications:** Via Supabase Realtime subscriptions
- **Cascading Location Dropdowns:** State → District → Taluk → Panchayat → Village
- **Live Briefing:** Uses browser geolocation to find nearby works within 10km
- **Complaint Workflow:** STAFF creates → PA reviews/forwards → PA resolves
- **MPLADS Integration:** Staff project entry auto-feeds Development Works (no duplication)
- **Railway EQ:** Train autocomplete search from preloaded train master data

---

## Deployment (Vercel)

1. Push code to GitHub
2. Connect repo to [vercel.com](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy — Vercel auto-detects Next.js

```bash
# Ensure DATABASE_URL uses connection pooler for Vercel:
# postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:6543/postgres?pgbouncer=true
```

---

## Project Structure

```
smp-connect/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed/                  # Seed scripts
│       ├── index.ts
│       ├── users.ts
│       ├── locations.ts       # Karnataka location data
│       ├── trains.ts          # 30 train entries
│       └── sample-data.ts
├── scripts/
│   └── supabase-setup.sql     # Auth + Storage + FTS indexes
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # Login page
│   │   ├── (dashboard)/
│   │   │   ├── mp/            # MP portal pages
│   │   │   ├── pa/            # PA portal pages
│   │   │   └── staff/         # Staff portal pages
│   │   ├── api/               # API routes
│   │   │   ├── auth/
│   │   │   ├── complaints/
│   │   │   ├── contacts/
│   │   │   ├── dashboard/
│   │   │   ├── day-book/
│   │   │   ├── development-works/
│   │   │   ├── gallery/
│   │   │   ├── greetings/
│   │   │   ├── letters/
│   │   │   ├── locations/
│   │   │   ├── mplads/
│   │   │   ├── notifications/
│   │   │   ├── parliament/
│   │   │   ├── plan-today/
│   │   │   ├── railway/
│   │   │   ├── search/
│   │   │   ├── speeches/
│   │   │   └── tours/
│   │   ├── unauthorized/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── layout/
│   │   ├── shared/
│   │   └── ui/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   ├── role-config.ts
│   │   ├── supabase/
│   │   └── utils.ts
│   ├── middleware.ts
│   └── types/
├── .env.example
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```
