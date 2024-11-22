var fs = require("fs");

const data = fs.readFileSync("../server/data/AtomicCards.json", "utf-8");

const json = JSON.parse(data);

console.log(json.meta);
console.log("Got cards:", Object.keys(json.data).length);

for (const card of Object.keys(json.data)) {
  // console.log(card);

  const cardsJson = json.data[card];

  if (cardsJson.length !== 1) {
    console.warn("Card has more than one entry:", card);
  }

  const cardJson = cardsJson[0];
  const id = cardJson.identifiers.scryfallOracleId;

  fs.writeFileSync(
    "./cards/" + id + ".json",
    JSON.stringify(cardJson, null, 2)
  );
}

// const text = JSON.stringify(json, null, 2);

// fs.writeFile("AtomicCards-formatted.json", text);
