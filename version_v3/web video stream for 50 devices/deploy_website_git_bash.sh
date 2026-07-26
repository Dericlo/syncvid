#!/usr/bin/env bash
set -e

cd "$HOME/OneDrive/Documents/web site develop/web video stream for 50 devices"

firebase use syncvid-e1c4b
firebase target:apply hosting syncvideocgs syncvideocgs
firebase deploy --only hosting:syncvideocgs

printf '\nDeployment complete: https://syncvideocgs.web.app/\n'
