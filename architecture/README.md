# DJ NEXUS — architecture

This folder explains how the site is built, how visitor actions flow through the code, and how to update GitHub and Vercel by hand.

Live app: `https://dj-nexus-blond.vercel.app`  
GitHub: `https://github.com/monikdeveloper/dj-nexus`  
Vercel project: `monik-dev/dj-nexus`

Do not put Gmail passwords, App Passwords, or tokens in this folder or in git.

---

## 1. What this project is

A **single-page DJ portfolio**. There is no React, Vue, Next.js, or Three.js.

| Layer | What it does |
| --- | --- |
| `index.html` | One page: nav, hero, journey, projects, mixes, contact, footer |
| `css/style.css` | Motion, vinyl deck, smoke/lighting layers, form highlight styles |
| Tailwind CDN | Layout and colors (`darkMode: class`) |
| jQuery 3.7.1 | Events, AJAX, DOM helpers |
| `js/*.js` | Theme, 3D vinyl, smoke, lighting, form, PWA |
| `api/contact.js` | Vercel serverless function — Gmail SMTP |
| `service-worker.js` + `manifest.json` | Installable PWA |

The browser loads HTML/CSS/JS as static files. The only backend is `/api/contact`, which exists **on Vercel**, not in `npx serve`.

---

## 2. Folder map

```
DJ/
├── index.html                 # whole site
├── css/style.css              # custom CSS
├── js/
│   ├── dom.js                 # one global DOM object (all selectors)
│   ├── theme.js               # light / dark
│   ├── lighting.js            # hero concert beams + audio-reactive live mode
│   ├── hero3d.js              # vinyl click → spin + play Afterglow
│   ├── smoke.js               # hero haze (idle + denser when music plays)
│   └── main.js                # nav, gallery, mixes, contact form, PWA
├── api/
│   └── contact.js             # POST booking → Gmail SMTP (Nodemailer)
├── assets/
│   ├── images/                # hero, gallery, icons, PWA icons
│   └── audio/afterglow-edit.wav
├── architecture/              # this documentation
├── manifest.json              # PWA
├── service-worker.js          # cache + offline
├── vercel.json                # Vercel: clean URLs, function timeout, SW headers
├── package.json               # nodemailer for the API
└── .env.example               # env var NAMES only (never real secrets)
```

---

## 3. How the page boots

Scripts at the bottom of `index.html`:

1. jQuery  
2. `dom.js` — builds `window.DOM` (`$('#hero')`, `$('#contact-form')`, …)  
3. `theme.js`  
4. `lighting.js`  
5. `hero3d.js`  
6. `smoke.js`  
7. `main.js` — `$(function () { ... })` starts everything  

`main.js` then calls:

- `Theme.init()`
- `Lighting.init()`
- `Hero3D.init()`
- `Smoke.init()`
- nav, mobile menu, scroll reveal, gallery tabs, lightbox, mix players, **contact form**, PWA / service worker

Other modules must use `DOM.xxx`. They should not query the page again.

---

## 4. Main user flows

### 4.1 Theme

`js/theme.js` reads `localStorage` key `nexus-theme`.  
A tiny inline script in `<head>` applies dark/light **before paint** so the page does not flash the wrong mode.

### 4.2 Hero vinyl + music

1. Visitor clicks `#vinyl-deck`.  
2. `Hero3D` starts/stops `assets/audio/afterglow-edit.wav`.  
3. The platter spins in CSS; the tonearm drops.  
4. `#hero` gets class `vinyl-live`.  
5. `Smoke.setLive(true)` — more haze.  
6. `Lighting.setLive(true)` + `Lighting.attachAudio(audio)` — beams follow bass (Web Audio analyser).  
7. Click again to pause.

Smoke only runs while `#hero` is on screen (`IntersectionObserver`). Scroll away and it stops.

### 4.3 Contact form → Gmail (live Vercel only)

All fields are required: name, email, mobile, event date, message.  
Blue “required” labels are not shown. Empty fields get a red outline **only after Submit**.

```
Browser
  → validate in js/main.js
  → POST JSON /api/contact
Vercel Node function (api/contact.js)
  → read GMAIL_USER + GMAIL_APP_PASSWORD from Vercel env
  → Nodemailer SMTP smtp.gmail.com:465
  → inbox BOOKING_TO (defaults to the same Gmail)
  → Reply-To = visitor email
```

`npx serve` has **no** `/api/contact`. Local static preview cannot send mail. Use the deployed URL after env vars are set.

Hobby plan: SMTP ports **465 and 587** are open; port **25** is blocked. Function timeout is 10 seconds (`vercel.json`).

---

## 5. Environment variables (secrets)

Set these in **Vercel → Project → Settings → Environment Variables**.  
Never commit them. `.gitignore` already ignores `.env` and `.env.local`.

| Name | Purpose |
| --- | --- |
| `GMAIL_USER` | Gmail that logs into SMTP (example: `monik.developer@gmail.com`) |
| `GMAIL_APP_PASSWORD` | 16-character **App Password** (not the Google login password) |
| `BOOKING_TO` | Inbox that receives bookings (usually the same Gmail) |

Gmail setup:

1. Google Account → Security → 2-Step Verification **on**.  
2. App passwords → create one for Mail.  
3. Paste that 16-character value into `GMAIL_APP_PASSWORD`.  
4. Redeploy so the function sees the new vars.

---

## 6. How to update GitHub manually

Repo: `https://github.com/monikdeveloper/dj-nexus`  
Branch: `main`.

From the project folder (`C:\Users\DELL\Desktop\DJ`):

```bash
git status
git add .
git commit -m "Describe the change"
git push origin main
```

Do **not** add `.env`, App Passwords, or `node_modules`.

If GitHub is connected to Vercel, a push to `main` starts a production deploy automatically.

---

## 7. How to update Vercel manually

### A. Dashboard (no CLI)

1. Open [vercel.com](https://vercel.com) and the `dj-nexus` project.  
2. **Settings → Environment Variables** — add or edit `GMAIL_*` / `BOOKING_TO`. Check Production (and Preview if you want).  
3. **Deployments → ⋯ on latest → Redeploy** after changing env vars.  
4. Or **Deployments → Create Deployment** from `main`.

To ship code without git: **Deploy** and upload the project folder. Prefer git push so GitHub and Vercel stay in sync.

### B. Vercel CLI

```bash
npx vercel login
npx vercel link
npx vercel env ls
npx vercel env add GMAIL_USER production,preview,development --value "you@gmail.com" --yes
npx vercel env add GMAIL_APP_PASSWORD production,preview,development --value "your-app-password" --sensitive --yes
npx vercel --prod
```

`--prod` deploys production from the current folder even if git is behind.

### C. After a deploy

Open `https://dj-nexus-blond.vercel.app/#contact`, fill every field, Submit.  
A booking email should arrive at `monik.developer@gmail.com`. Check Spam the first time. Hard-refresh (Ctrl+F5) if the PWA cache is old.

---

## 8. Local preview

```bash
npx --yes serve -l 4173
```

Open `http://localhost:4173`. Hero, vinyl, smoke, and form **validation** work. Mail send needs Vercel.

To test the API on your machine:

```bash
npx vercel env pull .env.local
npx vercel dev
```

---

## 9. PWA / cache

`service-worker.js` uses a cache name such as `nexus-cache-v19`.  
After CSS/JS changes, bump that name and the `?v=` query strings in `index.html` so phones do not keep stale files.

HTML is fetched **network-first**. Other GET assets are cache-first. POST to `/api/contact` is not cached.

---

## 10. Quick change list

| Want to change | Edit |
| --- | --- |
| Copy, sections, form labels | `index.html` |
| Vinyl, smoke, form errors look | `css/style.css` |
| Form validation / AJAX | `js/main.js` |
| Vinyl + song | `js/hero3d.js`, `assets/audio/` |
| Haze | `js/smoke.js` |
| Stage lights | `js/lighting.js` |
| Mail body / SMTP | `api/contact.js` |
| Hosting headers / timeout | `vercel.json` |
| Booking inbox | Vercel env `BOOKING_TO` |

---

## 11. If mail fails

| Symptom | Likely cause |
| --- | --- |
| “Mail API is only live on Vercel” | Opening localhost / old deploy without `api/` |
| “Mail is not configured yet” | Missing env vars, or no redeploy after adding them |
| Gmail SMTP error | Wrong App Password, 2FA off, or Google blocking the login |
| `[object Object]` on old builds | Error JSON was printed as an object; current `js/main.js` shows the message string |

After fixing env vars, always **Redeploy**.
