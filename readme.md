# Server

## ESP firmware

open Arduino studio, find your port and pick the board "adafruit feather esp32 v2". Change "upload speed" to 115200.

install libraries:
- Stepper by Arduino
- Adafruit NeoPixel by Adafruit
- ESP32Servo by Kevin Harrington

```
sudo cu -s 115200 -l /dev/tty.usbserial-57990087871
```

## Server

fucking hell, the nitro server in nuxt can't communicate with the esp.

so starting is:

```
cd server && npm run dev

cd webapp && npm run dev

# for development, also run:
cd server && npm run watch
```

## Card metadata

this splits the files in /webapp/server/data/*.json into a json file per card, for easy readability

```
node data/splitPrices.js
node data/splitCards.js
node data/splitIdentifiers.js
```

outputs to /data/*