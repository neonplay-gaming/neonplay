# NeonPlay online accounts setup

NeonPlay is hosted as a static GitHub Pages site. Secure online accounts need a Supabase project owned/controlled by the site owner. This repository must never contain a database password, Supabase secret key, or service_role key.

## One-time setup
1. Create a project at https://supabase.com/dashboard (project name: NeonPlay).
2. In Project Settings → API Keys, copy the Project URL and the **publishable** key (or legacy anon key). Never use a secret/service_role key in browser code.
3. In Authentication → URL Configuration, set Site URL to `https://neonplay-gaming.github.io/neonplay/` and add that same URL to Redirect URLs.
4. In Authentication → Sign In / Providers, enable Email. Keep email confirmation enabled if you want verified email accounts.
5. Open SQL Editor, paste and run `supabase-setup.sql` to create the shared leaderboard table and row-level security policies.
6. The front-end still needs the project URL and publishable key wired into its Supabase client before online login/leaderboard is live. These public values are designed for browser use, but RLS must remain enabled. Never paste secrets into GitHub or chat.

## Important
Creating this project requires signing into the owner's Supabase account and accepting the provider's terms. An assistant cannot create/verify ownership of a project in someone else's account without that account's authorized setup. Do not use a real/reused password on a site until it visibly confirms online auth is connected.
