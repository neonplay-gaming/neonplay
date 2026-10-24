# NeonPlay online accounts and cloud profile setup

NeonPlay is a static GitHub Pages site with the Supabase JavaScript client and existing email sign-in/sign-up code in `index.html`. The front end is configured with a project URL and a publishable key; these are browser-safe values, not secret credentials. The live project's connectivity and database configuration still need to be verified in the owner's Supabase dashboard.

## Required setup for Update 3.0

1. Open the project's Supabase dashboard: https://supabase.com/dashboard.
2. In Authentication → URL Configuration, set Site URL to `https://neonplay-gaming.github.io/neonplay/` and add that URL to Redirect URLs.
3. In Authentication → Sign In / Providers, enable Email. Email confirmation may be required before the first sign-in.
4. Open SQL Editor and run the current `supabase-setup.sql` file from this repository. It creates the shared leaderboard table plus the `player_profiles` table used for account-based favorites, recent games, collections, XP and level.
5. Confirm the tables appear in Table Editor and keep Row Level Security enabled. The profile policies limit reads/writes to the signed-in owner of each profile.
6. Test sign-up, email verification/sign-in, and profile syncing in the deployed site. If the profile panel reports that the cloud table is not ready, rerun the current SQL file and check Supabase logs.

## Security

Never put a Supabase database password, secret key, or `service_role` key in browser code, GitHub, or chat. Only the publishable/legacy anon key belongs in a public website, with Row Level Security enabled. A database table being added to this repository does not execute the SQL in Supabase automatically; the project owner must run it in the dashboard.
