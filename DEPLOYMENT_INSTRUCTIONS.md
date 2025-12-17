# Deployment Instructions

## Current Live Deployment

**Production URL:** https://<your-vercel-project>.vercel.app

## Updating GitHub Repository Settings

The URL shown in the GitHub repository's "About" section needs to be manually updated:

1. Go to your GitHub repository: https://github.com/CodeCrafter19programmer/YoRent-Fresh
2. Click the ⚙️ (gear icon) next to "About" on the right side
3. In the "Website" field, enter your Vercel URL, e.g. `https://<your-vercel-project>.vercel.app`
4. Save changes

## Deployment Platform

This project is deployed on **Vercel**.

- **Platform:** Vercel
- **Live URL:** https://<your-vercel-project>.vercel.app
- **Deployment Source:** GitHub repository `YoRent-Fresh`

## Vercel Configuration

The project auto-deploys from the `main` branch on every push to GitHub.

### Build Settings
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Framework:** Vite

### Environment Variables Required

Make sure these are set in your Vercel project under Settings → Environment Variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
```

## Manual Deployment

To manually trigger a deployment:

1. Go to your Vercel project dashboard
2. Navigate to the Deployments tab
3. Click "Redeploy" on the latest deployment

Or push changes to the main branch, which will auto-deploy.
