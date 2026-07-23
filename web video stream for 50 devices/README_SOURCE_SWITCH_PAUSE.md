# SyncVid Website Build 34 — Source Switch Pause

## Change

Only one controller preview source plays at a time:

- Local video → YouTube: the local video pauses and its current position is saved.
- YouTube → Local video: the YouTube player pauses.
- The newly selected source does not start until Play or Publish is pressed.

All Build 33 password, Android compatibility, viewer, schedule, and LiveKit features remain.

## Deploy with Git Bash

```bash
cd "$HOME/OneDrive/Documents/web site develop/web video stream for 50 devices"
cp -f "/path/to/SyncVid_Website_v34_Source_Switch_Pause/public/index.html" public/index.html
cp -f "/path/to/SyncVid_Website_v34_Source_Switch_Pause/public/app.js" public/app.js
cp -f "/path/to/SyncVid_Website_v34_Source_Switch_Pause/public/style.css" public/style.css
firebase deploy --only hosting:syncvideocgs
```

Refresh with Ctrl+Shift+R.
