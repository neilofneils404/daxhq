# DAX HQ

A tiny static browser game for `daxhq.com`: move the mouse like a saber,
deflect incoming plasma, parry enemy blade swipes, and wreck boss rounds.

## Files

- `index.html`
- `styles.css`
- `script.js`

## Features

- custom DAX HQ intro/logo screen
- mouse and touch saber controls
- enemy blaster bolts and saber swipe attacks
- boss rounds with names, health bars, and counterplay
- local best-score saving

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

## Upload To Namecheap

Upload the contents of this folder into your `public_html` directory.

There is no build step, no backend, and no npm install required.
