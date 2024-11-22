import { getPrice } from "./piles";

async function main() {
  const price = getPrice({
    price: {
      paper: {
        tcgplayer: {
          buylist: {},
          retail: {
            foil: {
              "2024-11-21": 4.96,
            },
          },
          currency: "USD",
        },
        cardmarket: {
          buylist: {},
          retail: {
            foil: {
              "2024-11-21": 6.02,
            },
          },
          currency: "EUR",
        },
        cardkingdom: {
          buylist: {
            foil: {
              "2024-11-21": 3.5,
            },
          },
          retail: {},
          currency: "USD",
        },
      },
    },
  });
  console.log("GOT PRICE", price);
}

main().then(() => console.log("Done!"));
