import fs from "fs";

let cardsArray: any[] = [];

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
}

export function getRandomCardName() {
  fillCardsArray();

  return cardsArray[Math.floor(Math.random() * cardsArray.length)].name;
}

export function getCard(cardName: string) {
  if (!cardName) return null;

  fillCardsArray();

  return cardsArray.find((card) => {
    try {
      const names = card.name.split("//").map(normalize);
      return (
        names.includes(normalize(cardName)) ||
        (card.faceName && normalize(card.faceName) === normalize(cardName))
      );
    } catch (err) {
      throw new Error(
        "Unable to find card " + cardName + " in " + JSON.stringify(card)
      );
    }
  });
}
