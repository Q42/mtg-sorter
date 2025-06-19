import fs from "fs";
import * as Scry from "scryfall-sdk";

let cardsArray: any[] = [];
let pricesObject: Record<string, any> = {};
let scryfallOracleIdToUuid: Record<string, string> = {};

function normalize(input: string) {
  return input
    .toLowerCase()
    .replace(/["',!/.]/gi, "")
    .replace(/[^a-z0-9]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fillCardsArray() {
  if (cardsArray.length === 0) {
    const cardsData = fs.readFileSync("./server/data/AtomicCards.json", "utf8");
    const cardsJson = JSON.parse(cardsData);
    cardsArray = Object.keys(cardsJson.data).map(
      (cardid: string) => cardsJson.data[cardid][0]
    );
    console.log(`Cards loaded: ${cardsArray.length}`);
  }

  if (Object.keys(pricesObject).length === 0) {
    const pricesData = fs.readFileSync(
      "./server/data/AllPricesToday.json",
      "utf8"
    );
    const pricesJson = JSON.parse(pricesData);
    pricesObject = pricesJson.data;
    console.log(`Prices loaded: ${Object.keys(pricesObject).length}`);
  }

  if (Object.keys(scryfallOracleIdToUuid).length === 0) {
    const scryfallOracleIdToUuidData = fs.readFileSync(
      "./server/data/AllIdentifiers.json",
      "utf8"
    );
    const json = JSON.parse(scryfallOracleIdToUuidData);
    scryfallOracleIdToUuid = Object.keys(json.data).reduce((acc, uuid) => {
      const scryfallOracleId = json.data[uuid].identifiers?.scryfallOracleId;
      acc[scryfallOracleId] = uuid;
      return acc;
    }, {} as Record<string, string>);
    console.log(
      `ScryfallOracleIdToUuid loaded: ${
        Object.keys(scryfallOracleIdToUuid).length
      }`
    );
  }
}

export function getRandomCardName() {
  fillCardsArray();

  const name = cardsArray[Math.floor(Math.random() * cardsArray.length)].name;
  console.log("[MOCK] Sending random card:", name);
  return name;
}

function getUuid(scryfallOracleId: string) {
  return scryfallOracleIdToUuid[scryfallOracleId];
}

export async function getCard(cardName: string) {
  if (!cardName) return null;

  // fillCardsArray();

  // const card = cardsArray.find((card) => {
  //   try {
  //     const names = [
  //       ...card.name.split("//").map(normalize),
  //       normalize(card.name),
  //     ];
  //     return (
  //       names.includes(normalize(cardName)) ||
  //       (card.faceName && normalize(card.faceName) === normalize(cardName))
  //     );
  //   } catch (err) {
  //     throw new Error(
  //       "Unable to find card " + cardName + " in " + JSON.stringify(card)
  //     );
  //   }
  // });

  const cards = await Scry.Cards.search(cardName).waitForAll();
  if (cards.length === 0) {
    console.warn("Unable to find cardd", cardName);
    return null;
  }
  const card = cards[0];
  console.log("found card", card);
  // const card = results.length > 0 ? results[0] : null;

  if (!card) {
    console.warn("Unable to find card", cardName);
    return null;
  }

  console.log("[CARD] Found card:", card.id);

  const uuid = card.id;

  const price = pricesObject[uuid];
  if (price) {
    // card.price = price;
    console.log("[PRICE] Found price for", uuid, price.paper);
  } else {
    console.warn("[PRICE] No price found for", card.id, uuid);
  }

  return card;
}
