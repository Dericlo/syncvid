SyncVid Website Build 35 — Korean / English

Default language: Korean
Language selector: upper-right corner
Supported languages:
- 한국어
- English

Dedicated PC controller URL:
https://syncvideocgs.web.app/?room=main-room&tokenServer=syncvideocgs-2gke1g&desktop=controller&lang=ko

The desktop=controller parameter is intended for the dedicated Windows controller
launcher. It automatically opens the static password gate and restores Controller
mode. This is a convenience feature, not secure server-side authentication.

Deploy from Git Bash:
cd "$HOME/OneDrive/Documents/web site develop/web video stream for 50 devices"
firebase use syncvid-e1c4b
firebase target:apply hosting syncvideocgs syncvideocgs
firebase deploy --only hosting:syncvideocgs
