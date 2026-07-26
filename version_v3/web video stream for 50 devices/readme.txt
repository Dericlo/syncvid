WEB VIDEO STREAM FOR 50 DEVICES — VERSION 23

TARGET FOLDER:
C:\Users\eeric\OneDrive\Documents\web site develop\web video stream for 50 devices

WEBSITE:
https://syncvideocgs.web.app/?v=23

VERSION 23:
- Lower viewer delay with minimum LiveKit playout buffering.
- Step 1, Controller, and Connection status are dropdown/hideable cards.
- Video preview and playback always remain visible inside the open Controller card.
- Source and schedule are smaller dropdown sections.
- Existing session restore and weekday schedule remain enabled.

DEPLOY:
firebase deploy --only hosting:syncvideocgs

Firebase Functions are not used.
