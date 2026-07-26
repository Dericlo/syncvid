# SyncVid Build 29 — Tablet Viewer Width Fix

## Changes

- Viewer video uses the full available tablet width.
- The viewer video container follows the received stream aspect ratio.
- Android tablets do not attempt YouTube browser-tab sharing.
- YouTube publishing is disabled on Android and must be started from the PC Controller.
- Tablet Viewer connections remain automatic for `main-room`.

## Deploy website

```cmd
cd /d "C:\Users\eeric\OneDrive\Documents\web site develop\web video stream for 50 devices"
firebase deploy --only hosting:syncvideocgs
```

Open on PC Controller:

```text
https://syncvideocgs.web.app/
```

Viewer URL:

```text
https://syncvideocgs.web.app/?room=main-room&role=viewer&tokenServer=syncvideocgs-2gke1g
```
