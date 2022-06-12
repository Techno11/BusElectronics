#!/bin/sh

cd /home/libre

NODE_ENV=production \
PORT=8008 \
HOST=0.0.0.0 \
DATA_SERIAL_PORT=/dev/ttyUSB0 \
DATA_BAUD=115200 \
UPDATE_SERIAL_PORT=/dev/ttyS4 \
./busgui
