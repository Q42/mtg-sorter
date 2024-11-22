var fs = require("fs");

const data = fs.readFileSync(
  "./webapp/server/data/AllIdentifiers.json",
  "utf-8"
);

const json = JSON.parse(data);

console.log(json.meta);
console.log("Got cards:", Object.keys(json.data).length);

for (const card of Object.keys(json.data)) {
  // console.log(card);

  const cardJson = json.data[card];

  fs.writeFileSync(
    "./data/identifiers/" + card + ".json",
    JSON.stringify(cardJson, null, 2)
  );
}
