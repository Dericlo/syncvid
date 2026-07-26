# SyncVid Build 28 - Android YouTube Viewer Compatibility

Changes:
- YouTube tab capture is limited to 1280x720 at 20 fps.
- YouTube publishing prefers H.264 for older Android tablet hardware decoding.
- VP8 remains configured as a LiveKit backup codec.
- Adaptive Stream is enabled with pixelDensity 1 so tablet viewers do not request unnecessarily large layers.
- Local video publishing remains VP8.

Deploy by running deploy_website.bat.


Build 29 changes
----------------
- Viewer video uses the full tablet width.
- Viewer shell follows the received stream aspect ratio.
- Android tablets no longer show the browser-tab-sharing error.
- YouTube publish is disabled on Android; publish from the PC Controller.
