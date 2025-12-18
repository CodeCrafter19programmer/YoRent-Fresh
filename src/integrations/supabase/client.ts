import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.warn('VITE_SUPABASE_URL is not set. Supabase client will not be able to connect.');
}

if (!supabaseAnonKey) {
  console.warn('VITE_SUPABASE_ANON_KEY is not set. Supabase client will not be able to authenticate.');
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      persistSession: true, // WARNING: Client-side session, NOT secure against XSS. Use SSR helpers & cookies for true security.
      autoRefreshToken: true,
      storageKey: 'yorent.auth',
      // If you run this in Node SSR/API, use the 'cookieOptions' documented in supabase-js for secure cookies:
      // cookieOptions: {
      //   name: 'yorent.sid',
      //   domain: 'yourdomain.com',
      //   path: '/',
      //   sameSite: 'lax',
      //   secure: true,
      //   httpOnly: true,
      //   maxAge: 60 * 60 * 24 * 30, // 30 days
      // },
    },
  }
);

if (typeof window !== 'undefined') {
  console.warn('[SECURITY] Supabase auth is client-persisted (localStorage). For max security, migrate auth to HttpOnly cookies via server helpers for production.');
}

