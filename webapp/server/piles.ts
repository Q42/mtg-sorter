import { getCard } from "./cards";
import { ESP } from "./esp";
import { mockCardList, whatCardIsInFrontOfTheCamera } from "./ocr";

export type COLOR = "G" | "U" | "W" | "B" | "R";

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
    await this.esp.send("1");
    this.currentPileIndex = pileIndex;
  }

  async pickUpCard() {
    console.log("Picking up card on pile", this.currentPileIndex);
    if (this.cardInTheAir) {
      throw new Error(
        "Already a card in the air. Card: " + this.cardInTheAir.toString()
      );
    }
    await this.esp.send("2");
    this.cardInTheAir = this.currentPile.cards.pop();
  }

  async dropCard() {
    console.log("Dropping card on pile", this.currentPileIndex);

    if (!this.cardInTheAir) {
      throw new Error("No card in the air.");
    }

    await this.esp.send("3");
    this.currentPile.cards.push(this.cardInTheAir);
    this.cardInTheAir = undefined;
  }

  async determineCard() {
    console.log("Determining card on pile", this.currentPileIndex);
    // const name = await whatCardIsInFrontOfTheCamera();
    const name = mockCardList[Math.floor(Math.random() * mockCardList.length)]; // TODO FOR NOW

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
