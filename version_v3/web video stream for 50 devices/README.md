# SyncVid — Latest Root Website

This package contains the current website files inside `public`:

- `public/index.html`
- `public/app.js`
- `public/style.css`

## Layout

When connected as Controller, the page order is:

1. Controller — always open
2. Step 1 — collapsible
3. Connection Status — collapsible

When connected as Viewer, the Viewer video is displayed first, followed by Step 1 and Connection Status.

Inside Controller:

- Video Preview and Playback is always visible.
- Source and Publishing is collapsible.
- Playback Schedule is collapsible.

The root URL is the latest website address:

```text
https://syncvideocgs.web.app/
```

Old version parameters such as `?v=22` are removed automatically.

## Deploy

Double-click `deploy_website.bat`, or run:

```cmd
cd /d "C:\Users\eeric\OneDrive\Documents\web site develop\web video stream for 50 devices"
if exist ".firebase" rmdir /s /q ".firebase"
firebase deploy --only hosting:syncvideocgs
start https://syncvideocgs.web.app/
```

Close old SyncVid tabs after deployment and reopen the root URL.
