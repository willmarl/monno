#!/bin/bash
# Desktop Notification Script
# Shows a desktop notification using kdialog
# This is a toy example to demonstrate calling Bash from Node.js worker

# Get message from argument
MESSAGE="BullMQ job request has been received"

# Try kdialog first (KDE)
if command -v kdialog &> /dev/null; then
    kdialog --msgbox "$MESSAGE"
    exit 0
fi

# Fallback to notify-send (GNOME/generic Linux)
if command -v notify-send &> /dev/null; then
    notify-send "Worker Notification" "$MESSAGE"
    exit 0
fi

# Fallback to echo if no GUI available
echo "Notification: $MESSAGE"
exit 0
