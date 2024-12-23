import { getCard, getRandomCardName } from "./cards";
import { ESP } from "./esp";
import { whatCardIsInFrontOfTheCamera } from "./ocr";

export type COLOR = "G" | "U" | "W" | "B" | "R";

export function getPrice(data: any) {
  const date = "2024-11-21";
  const paper = data?.price?.paper;
  // console.log("paper", paper);
  if (!paper) return null;
  const prices: { currency: string; price: number }[] = [];

  for (const key2 of Object.keys(paper)) {
    const pp = paper[key2];
    console.log("pp", pp);
    const { currency } = pp;
    const price = pp.retail?.normal?.[date] ?? pp.buylist?.normal?.[date];
    console.log("price", price);
    if (price) {
      prices.push({ currency, price });
    }
  }

  if (prices.length < 1) {
    for (const key2 of Object.keys(paper)) {
      const pp2 = paper[key2];
      console.log("pp2", pp2);
      const { currency } = pp2;
      const price = pp2.retail?.foil?.[date] ?? pp2.buylist?.foil?.[date];
      console.log("price", price);
      if (price) {
        prices.push({ currency, price });
      }
    }
  }

  if (prices.length > 1) {
    console.log("Multiple prices", prices);
    // sort by price desc
    prices.sort((a, b) => b.price - a.price);
  }

  return prices[0];
}

export class Card {
  private data: any = {};

  constructor() {}

  determine(data: any) {
    if (this.data.name && this.data.name !== data.name) {
      throw new Error(
        `Card already has a name, ${this.data.name} vs ${data.name}`
      );
    }
    this.data = data;
    return this;
  }

  get isKnown() {
    return this.data.name !== undefined;
  }

  get name() {
    return this.data.name ?? null;
  }

  get color() {
    const colors = (this.data.colorIdentity ?? []) as COLOR[];
    if (colors.length !== 1) return null;
    return colors[0];
  }

  get price() {
    return getPrice(this.data);
  }

  get colorName() {
    if (this.data.colorIdentity.length > 1) return "Multicolor";
    if (!this.color) return "Colorless";
    return {
      G: "Green",
      U: "Blue",
      W: "White",
      B: "Black",
      R: "Red",
    }[this.color];
  }

  toString() {
    if (!this.isKnown) return "Unknown card";
    return `${this.name} (${this.colorName})`;
  }
}

export class Pile {
  /** last card is the top card */
  public cards: Card[];

  constructor(amount: number) {
    this.cards = new Array(amount).fill(null).map(() => new Card());
  }

  get topCard() {
    return this.cards[this.cards.length - 1];
  }

  /** there are no more cards in this pile, remove all cards */
  isEmpty() {
    for (const card of this.cards) {
      if (card.isKnown) {
        throw new Error(
          "There is still a known card in the pile that you believe is empty. Card: " +
            card.toString()
        );
      }
    }

    this.cards = [];
  }
}

export class Contraption {
  currentPileIndex = 0;
  cardInTheAir: Card | undefined = undefined;

  constructor(public piles: Pile[], public esp: ESP) {}

  get allCards() {
    return [
      ...this.piles.flatMap((pile) => pile.cards),
      this.cardInTheAir,
    ].filter(Boolean);
  }

  getPileForColor(color: COLOR | null | undefined) {
    if (!color) return this.piles.length - 1;
    const current = this.piles.findIndex(
      (pile, i) => i !== 0 && pile.cards.every((card) => card.color === color)
    );
    return current === -1
      ? this.piles.findIndex((p) => p.cards.length === 0)
      : current;
  }

  get currentPile() {
    return this.piles[this.currentPileIndex];
  }

  async turnToPile(pileIndex: number) {
    console.log("Turning to pile", pileIndex);

    let degrees = Math.round(pileIndex * 191.5);

    await this.esp.send("plate " + degrees);
    await new Promise((r) => setTimeout(r, 3000));
    this.currentPileIndex = pileIndex;
  }

  async pickUpCard() {
    console.log("Picking up card on pile", this.currentPileIndex);
    // if (this.cardInTheAir) {
    //   throw new Error(
    //     "Already a card in the air. Card: " + this.cardInTheAir.toString()
    //   );
    // }
    await this.esp.send("arm 0");
    await new Promise((r) => setTimeout(r, 1500));
    await this.esp.send("vac 1");
    await new Promise((r) => setTimeout(r, 1500));
    await this.esp.send("arm -90");
    await new Promise((r) => setTimeout(r, 3000));
    this.cardInTheAir = this.currentPile.cards.pop();
  }

  async dropCard() {
    console.log("Dropping card on pile", this.currentPileIndex);

    if (!this.cardInTheAir) {
      throw new Error("No card in the air.");
    }

    await this.esp.send("arm 0");
    await new Promise((r) => setTimeout(r, 3000));
    await this.esp.send("vac 0");
    await new Promise((r) => setTimeout(r, 1000));
    await this.esp.send("arm -90");
    await new Promise((r) => setTimeout(r, 3000));
    this.currentPile.cards.push(this.cardInTheAir);
    this.cardInTheAir = undefined;
  }

  async determineCard() {
    console.log("Determining card on pile", this.currentPileIndex);
    const name = await whatCardIsInFrontOfTheCamera();
    // const name = getRandomCardName(); // TODO FOR NOW

    if (!name) {
      this.currentPile.isEmpty();
      console.log("Pile is empty", this.currentPileIndex);
    } else {
      const cardData = getCard(name);
      if (!cardData) {
        console.error("No card data found for", name);
        return;
      }
      const topCard = this.currentPile.topCard;
      topCard.determine(cardData);
      console.log("Determined: " + topCard.toString());
    }
  }

  toJSON() {
    return {
      currentPile: this.currentPileIndex,
      cardInTheAir: this.cardInTheAir?.toString(),
      totalPrice: this.allCards.reduce((acc, card) => {
        const price = card?.price;
        if (price) {
          acc += price.price;
        }
        return acc;
      }, 0),
      piles: this.piles.map((pile, i) => ({
        index: i,
        cards: pile.cards.map((card, j) => ({
          index: j,
          name: card.toString(),
        })),
      })),
    };
  }
}
