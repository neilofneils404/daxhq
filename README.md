# DAX HQ

A tiny static browser game for `daxhq.com`: move the mouse like a saber,
deflect incoming plasma, parry enemy blade swipes, and wreck boss rounds.

## Files

- `index.html`
- `styles.css`
- `script.js`

## Features

- custom DAX HQ intro/logo screen
- quick first-run tutorial with skip and replay
- mouse and touch saber controls
- enemy blaster bolts and saber swipe attacks
- boss rounds with names, health bars, and counterplay
- local best-score, loadout, and tutorial state saving
- static analytics hooks that no-op unless an analytics surface exists

## Analytics hooks

`script.js` includes a tiny non-blocking `analytics.track()` wrapper.
By default it does nothing user-visible and requires no backend.

If one of these globals exists, events are forwarded automatically:

- `window.plausible(eventName, { props })`
- `window.gtag("event", eventName, detail)`
- `window.dataLayer.push({ event, detail, timestamp })`

It also dispatches a browser event for custom integrations:

- `document.addEventListener("daxhq:analytics", (event) => ...)`

Tracked events:

- `game_start`
- `game_restart`
- `boss_reached`
- `boss_defeated`
- `game_over`
- `tutorial_started`
- `tutorial_completed`
- `tutorial_skipped`
- `sound_toggle`

## Run It Locally

From `/Users/neil/Projects/daxhq`:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Refresh The Social Card

From `/Users/neil/Projects/daxhq`:

```bash
./generate-social-preview.sh
```

This serves the folder locally, waits for the preview page to finish loading,
and writes a fresh `social-preview.png`.

## Deploy / Cloudflare Pages

This project stays fully static and Cloudflare Pages-safe.

- no build step required
- no backend, SSR, auth, or server state
- persistence uses `localStorage`
- analytics hooks gracefully no-op unless a supported client-side surface exists

You can upload it as plain static files or deploy the folder directly to Cloudflare Pages.

## Upload To Namecheap

Upload the contents of this folder into your `public_html` directory.
