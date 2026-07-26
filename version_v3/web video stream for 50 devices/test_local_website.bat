@echo off
cd /d "C:\Users\eeric\OneDrive\Documents\web site develop\web video stream for 50 devices\public"
start "" "http://localhost:8000"
python -m http.server 8000
