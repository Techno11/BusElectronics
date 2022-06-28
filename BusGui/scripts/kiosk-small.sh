#!/bin/bash

# Disable Screen Blanking
DISPLAY=:0 xset s noblank
DISPLAY=:0 xset s off

# Rotate Touchscreen Coordinates
# DISPLAY=:0 xinput set-prop 'wch.cn USB2IIC_CTP_CONTROL' 'Coordinate Transformation Matrix' -1 0 1 0 -1 1 0 0 1

# hide mouse after .5 sec. to hide instantly, remove -idle
#unclutter -idle 0.5 -root &
# Remove warning bar things from showing in chrome
# sed -i 's/"exited_cleanly":false/"exited-cleanly":true/' /home/bus/.config/chromium/Default/Preferences
# sed -i '/"exit_type":"Crashed"/"exit_type":"Normal"/' /home/bus/.config/chromium/Default/Preferences

# Start Chromium
DISPLAY=:0 /usr/bin/chromium-browser --noerrdialogs --disable-infobars --kiosk http://192.168.1.100:8008 &
