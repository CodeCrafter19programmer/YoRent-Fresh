# Vercel + Supabase Setup & Deployment (YoRent)

## 1) Prerequisites

- GitHub repo: `YoRent-Fresh`
- Supabase project ref: `xjnvnbbijcbrqgbyxkij`
- Node.js installed locally (for local dev)

## 2) Supabase: Apply Schema

1. Open Supabase Dashboard:
   https://supabase.com/dashboard/project/xjnvnbbijcbrqgbyxkij
2. Go to SQL Editor
3. Copy/paste and run:
   - `supabase/schema.sql`

## 3) Supabase: Configure Auth URLs

In Supabase Dashboard:

1. Go to Authentication → URL Configuration
2. Set:
   - Site URL: `https://<your-vercel-project>.vercel.app`
   - Redirect URLs: add
     - `https://<your-vercel-project>.vercel.app/login`
     - `http://localhost:5173/login`

This ensures email confirmations / redirects land back in your app.

## 4) Local Environment Setup

1. Create a local env file:
   - copy `.env.example` → `.env.local` (recommended)
2. Verify it contains:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_PROJECT_ID`

Run locally:

```bash
npm install
npm run dev
```

## 5) Create an Admin User

1. Sign up a user in the app or create a user in Supabase Auth
2. Promote them to admin via SQL:

```sql
update public.profiles set role = 'admin' where id = 'USER_ID_HERE';
```

## 6) Deploy to Vercel

### Option A: Vercel UI

1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment variables (Project Settings → Environment Variables):

- `VITE_SUPABASE_URL` = `https://xjnvnbbijcbrqgbyxkij.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = (your anon key)
- `VITE_SUPABASE_PROJECT_ID` = `xjnvnbbijcbrqgbyxkij`

7. Deploy

### SPA Routing Note

This repo includes `vercel.json` with a rewrite to `index.html`, so React Router routes (e.g. `/login`, `/admin/payments`) work on refresh.

## 7) Post-deploy checks

- Visit `https://<your-vercel-project>.vercel.app`
- Sign up / log in
- Verify:
  - Admin routes are accessible for admin role
  - Tenant dashboard loads for tenant role
  - CRUD pages load without 404s

