# Server

fucking hell, the nitro server in nuxt can't communicate with the esp.

so starting is:

```
cd server && npm run dev

cd webapp && npm run dev
```

## Card metadata

this splits the files in /webapp/server/data/*.json into a json file per card, for easy readability

```
node data/splitPrices.js
node data/splitCards.js
node data/splitIdentifiers.js
```

outputs to /data/cards and /data/prices