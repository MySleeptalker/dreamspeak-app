# Dreamspeak — One App, Two Doors

This single Next.js project now contains everything:

- **`/app`** → the learner-facing Dreamspeak PWA (login/signup, lessons, hearts, shop, league).
- **`/admin`** → the password-protected CRM dashboard for you as the app owner.
- **`/api/*`** → the backend both of the above talk to (same origin, no config needed).

## Run it locally

```bash
npm install
npm run dev
```

- Learner app: **http://localhost:3000/app**
- Admin dashboard: **http://localhost:3000/admin** (default password `dreamspeak2026`, change via `ADMIN_PASSWORD` env var)
- Demo accounts (e.g. `james@dreamwealthsolutions.com`) all use password `dreamspeak123`.

## Real user accounts

Users create an account with name/email/phone/password on `/app`. Passwords are salted + hashed (Node's `scrypt`) — never stored or transmitted in plain text, never exposed by any API response. Logging in sets a secure, `httpOnly` session cookie that lasts 180 days, so returning users are **automatically logged back in** next time they open the app or PWA — no need to retype credentials every visit. "Log Out" on the hub screen clears the session.

If a user gets locked out, open their profile in `/admin`, use **Generate Temporary Password**, and share the one-time password shown with them.

## Turning it into an installable app (PWA)

The learner app is a full Progressive Web App:

- `public/manifest.json` + `public/icons/icon-192.png` / `icon-512.png` (the sheep mascot) make it installable.
- `public/sw.js` is a service worker caching the app shell for fast reloads and light offline resilience.
- On desktop Chrome/Edge, visiting `/app` shows an **Install** icon in the address bar; tapping "📲 Install App" on the hub screen does the same via the in-app prompt. On iOS Safari, users tap Share → **Add to Home Screen**.
- Once installed, it opens in its own window/icon like a native app, with no browser chrome.

## ⚠️ If a login/password field looks like it's not accepting input correctly

That's a browser autofill/extension quirk, not the app. Test in a private window, or verify the server directly:

```bash
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"james@dreamwealthsolutions.com","password":"dreamspeak123"}'
```

A JSON user object back (not an `error` field) confirms the backend is working correctly.

## Deploying for real use

Deploy this whole folder to any Node host (Vercel is easiest): import the project, set `ADMIN_PASSWORD` in environment variables, deploy. Both `/app` and `/admin` are served from the same domain automatically — no separate backend URL configuration needed.

## What's included

- `/app/api/auth/signup`, `/login`, `/logout`, `/me` — real email/password accounts with hashed passwords and session cookies.
- `/app/api/users`, `/api/users/[id]`, `/api/users/export` — admin user management + CSV export of every user's contact info.
- `/app/api/interactions`, `/api/interactions/[id]` — logged emails, texts, calls, and notes per user, visible in each user's admin detail panel.
- `/admin` — stats cards, searchable/filterable user table (hearts editor, plan toggle, time-on-app, last-active), per-user detail sheet (usage analytics, interaction history, password reset).
- `public/game.html` — the full learner experience: login/signup, 12 languages, alphabet → words → phrases → sentences curriculum with auto-advancement, sheep-voiced pronunciation (text-to-speech), vocabulary flashcard images, hearts economy, gem shop, milestones, and a weekly league.

Data is stored in a local `data/` folder as JSON files — lightweight and fine for a single-server deployment. For production scale, swap `lib/store.ts` for a real database; the function signatures are already isolated there to make that swap contained to one file.
