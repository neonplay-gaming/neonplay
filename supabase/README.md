# NEONPLAY Private Video Box — secure backend setup

The GitHub Pages site is static. It cannot itself securely store videos, verify secret keys,
send reliable security alerts, or revoke server sessions. This folder prepares the database
policy layer; it is not a complete live backend until a Supabase project and server-side
functions are configured.

## Setup
1. Create a Supabase project owned by you.
2. In SQL Editor, run `schema.sql`.
3. In Storage, create a bucket named `private-videos` and leave it **Private**.
4. Configure Storage RLS so authenticated users can access only objects whose first path
   segment equals their own `auth.uid()`. Do not use public buckets or public URLs.
5. Deploy trusted Edge Functions for session creation/heartbeat/revocation, signed upload
   and download URLs, audit logging, and alert delivery. Functions must validate the
   authenticated user and active server-side session on every request.
6. Add new-device notification delivery through a provider you control.
7. Only then connect the website using the Supabase project URL and anon/publishable key.
   The anon key is intended for browser use only with correctly configured RLS.
8. Never put the Supabase service_role/secret key, raw user secret keys, or other server
   secrets in `index.html`, GitHub, or browser storage.

## Security model
- Use Supabase Auth (email/password or magic link) as the identity; a secret key alone is
  a bearer credential and cannot protect a user if stolen.
- Scope all metadata and object paths to the authenticated user ID.
- Use short-lived signed URLs, server-side audit events, rate limits, and key rotation.
- A session list/revoke UI must call trusted server functions. Do not show mock sessions
  as real data.
- The audit table is readable only by its owner. Inserts/updates are intentionally reserved
  for trusted server functions; service role credentials must remain server-side.

## Existing website
Keep current game cards, existing download URLs, anime content, and YouTube promotion intact.
