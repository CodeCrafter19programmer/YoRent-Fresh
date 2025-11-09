# YoRent Setup Instructions

## Step 1: Apply Database Migrations to Supabase

Since we need to apply the database migrations to your Supabase project, please follow these steps:

### Option A: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/qfocwomylkbuiccipfgs
2. **Navigate to SQL Editor**
3. **Apply the first migration** by copying and pasting the content from:
   `supabase/migrations/20251108181052_3c8f55be-5a91-4ebe-b685-0b39ea8f1ba5.sql`
4. **Apply the second migration** by copying and pasting the content from:
   `supabase/migrations/20251108220000_add_tax_records.sql`

### Option B: Using Supabase CLI (If you have project access)

```bash
# Link to your project (you'll need to provide your database password)
supabase link --project-ref qfocwomylkbuiccipfgs

# Push migrations
supabase db push
```

## Step 2: Verify Environment Variables

Make sure your `.env` file has the correct Supabase credentials:

```env
VITE_SUPABASE_PROJECT_ID=qfocwomylkbuiccipfgs
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmb2N3b215bGtidWljY2lwZmdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MjExODgsImV4cCI6MjA3ODE5NzE4OH0.aK4DdcdTbE95Bs_Ke6KXOsn8rRpgdnCgqH2JHKP3UAk
VITE_SUPABASE_URL=https://qfocwomylkbuiccipfgs.supabase.co
```

## Step 3: Install Dependencies and Run the Application

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## Step 4: Create Initial Admin User

After the application is running:

1. Go to your Supabase Dashboard → Authentication → Users
2. Create a new user with admin privileges
3. After creating the user, go to SQL Editor and run:

```sql
-- Replace 'USER_ID_HERE' with the actual user ID from the auth.users table
INSERT INTO public.user_roles (user_id, role) 
VALUES ('USER_ID_HERE', 'admin');
```

## Step 5: Test the System

1. **Admin Login**: Use the admin credentials to access `/login`
2. **Tenant Registration**: Test tenant signup at `/signup`
3. **Payment Management**: Test the payment system at `/admin/payments`
4. **Notifications**: Check the notification system at `/admin/notifications`
5. **Tax Reports**: Verify tax calculations at `/admin/tax`

## Features Available

### For Tenants:
- Login at `/login`
- View dashboard at `/tenant/dashboard`
- Track payments and receive notifications
- View property information

### For Admins:
- Full dashboard access at `/`
- Payment management at `/admin/payments`
- Notification system at `/admin/notifications`
- Tax accountability at `/admin/tax`
- All existing property and tenant management features

## Troubleshooting

### If you get authentication errors:
1. Check that the migrations have been applied correctly
2. Verify that RLS policies are enabled
3. Ensure user roles are properly assigned

### If notifications aren't working:
1. Check that the notification service is initialized
2. Verify real-time subscriptions are working
3. Check browser console for any errors

### If payments aren't updating:
1. Verify the tax_records table was created
2. Check that triggers are properly installed
3. Ensure proper permissions are set

## Next Steps After Setup

1. **Create Sample Data**: Add some properties and tenants for testing
2. **Test Payment Flow**: Create payments and test the notification system
3. **Verify Tax Calculations**: Test the tax accountability features
4. **Customize**: Adjust tax rates, notification timing, etc. as needed

## Support

If you encounter any issues during setup, check:
1. Browser console for JavaScript errors
2. Supabase logs for database errors
3. Network tab for API call failures

The system is now ready for production use with all the requested features implemented!


The Flash 2004
