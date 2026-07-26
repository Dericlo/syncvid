# SyncVid Build 30 — Android sound recovery

This build removes the need to close and reopen the tablet website before sound starts.

- Repeatedly calls LiveKit `room.startAudio()` after Viewer connection and audio-track subscription.
- Retries audio after page focus, visibility restore, network restore, and real tablet touch.
- Exposes `window.syncVidStartViewerMedia()` for the Android WebView host.
- Keeps the small Enable sound button as a fallback when Android autoplay policy requires one real touch.

Deploy with `deploy_website.bat`.
