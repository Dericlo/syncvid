@echo off
cd /d "C:\Users\xx\xx\Documents\web site develop\web video stream for 50 devices"

if not exist public mkdir public
copy /Y index.html public\index.html
copy /Y app.js public\app.js
copy /Y style.css public\style.css

firebase use syncvid-e1c4b
firebase target:apply hosting syncvideocgs syncvideocgs
firebase deploy --only hosting:syncvideocgs

start https://syncvideocgs.web.app/
pause
