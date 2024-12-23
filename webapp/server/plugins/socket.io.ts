import { Server as Engine } from "engine.io";
import { Server } from "socket.io";
import { defineEventHandler } from "h3";
import { whatCardIsInFrontOfTheCamera } from "../ocr";
import { getCard, getRandomCardName } from "../cards";
import { Card, Contraption, Pile } from "../piles";
import { ESP } from "../esp";

let currentContraption: Contraption | undefined;

const pickupCard = async (esp: ESP) => {
  await esp.send("arm 0");
  await new Promise((r) => setTimeout(r, 1500));
  await esp.send("vac 1");
  await new Promise((r) => setTimeout(r, 1500));
  await esp.send("arm -90");
  await new Promise((r) => setTimeout(r, 4500));
  // await shake(esp);
};

const shake = async (esp: ESP) => {
  // repeat 3 times
  // for (let i = 0; i < 3; i++) {
  await esp.send("arm -70");
  await new Promise((r) => setTimeout(r, 500));
  await esp.send("arm -90");
  await new Promise((r) => setTimeout(r, 500));
  await esp.send("arm -70");
  await new Promise((r) => setTimeout(r, 500));
  await esp.send("arm -90");
  await new Promise((r) => setTimeout(r, 500));
  await esp.send("arm -70");
  await new Promise((r) => setTimeout(r, 500));
  await esp.send("arm -90");
  await new Promise((r) => setTimeout(r, 500));
  // }
};

const turnToPile = async (esp: ESP, pileIndex: number) => {
  let degrees = Math.round(pileIndex * 191.5);
  await esp.send("plate " + degrees);
  await new Promise((r) => setTimeout(r, 3000));
};

const dropCard = async (esp: ESP) => {
  await esp.send("arm 0");
  await new Promise((r) => setTimeout(r, 3000));
  await esp.send("vac 0");
  await new Promise((r) => setTimeout(r, 1000));
  await esp.send("arm -90");
  await new Promise((r) => setTimeout(r, 3000));
};

const turnToColorPile = async (esp: ESP, color: string) => {
  if (color === "R") {
    await turnToPile(esp, 4);
  } else if (color === "G") {
    await turnToPile(esp, 1);
  } else if (color === "U") {
    await turnToPile(esp, 2);
  } else if (color === "W") {
    await turnToPile(esp, 3);
  } else if (color === "B") {
    await turnToPile(esp, 5);
  } else {
    await turnToPile(esp, 6);
  }
};

const sortByColor = async (esp: ESP) => {
  const cardName = await whatCardIsInFrontOfTheCamera();
  // const cardName = getRandomCardName();
  const card = getCard(cardName);
  if (!card) return;

  const color = new Card().determine(card).color;
  await pickupCard(esp);
  await turnToColorPile(esp, color!);
  await dropCard(esp);
  await turnToPile(esp, 0);
  await sortByColor(esp);
};

export default defineNitroPlugin((nitroApp) => {
  const engine = new Engine();
  const io = new Server();

  io.bind(engine);

  console.log("Socket.io server is running");
  const esp = new ESP();

  io.on("connection", (socket) => {
    console.log("user connected");

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });

    function sendContraption() {
      if (!currentContraption) return;
      socket.send("contraption", currentContraption.toJSON());
    }

    // send it when user connects
    sendContraption();

    socket.on("message", async (data, arg) => {
      console.log("received message", data);

      if (data === "what-card") {
        const cardName = await whatCardIsInFrontOfTheCamera();
        // const cardName = getRandomCardName();
        const card = getCard(cardName);
        const price = new Card().determine(card).price;
        socket.send("what-card", {
          name: cardName,
          price,
          card,
        });
      }

      if (data === "pause") {
        await esp.send("pause");
        await esp.send("vac 0");
      }

      if (data === "light-on") {
        await esp.send("lamp 1");
      }

      if (data === "light-off") {
        await esp.send("lamp 0");
      }

      if (data === "restart") {
        currentContraption = new Contraption(
          [
            new Pile(10),
            new Pile(0),
            new Pile(0),
            new Pile(0),
            new Pile(0),
            new Pile(0),
            new Pile(0),
            new Pile(0),
          ],
          esp
        );
        await esp.send("home");
        await esp.send("vac 0");
        await esp.send("arm -90");
        sendContraption();
      }

      if (data === "demo") {
        console.log("starting demo");
        await pickupCard(esp);
        await turnToPile(esp, 4);
        await dropCard(esp);
      }

      if (data === "demo-2") {
        const cardName = await whatCardIsInFrontOfTheCamera();
        // const cardName = getRandomCardName();
        const card = getCard(cardName);
        const color = new Card().determine(card).color;
        await pickupCard(esp);
        await turnToColorPile(esp, color!);
        await dropCard(esp);
        await turnToPile(esp, 0);
      }

      if (data === "sort-by-color") {
        await sortByColor(esp);
      }

      if (!currentContraption) return;

      switch (data) {
        case "pick-up-card":
          await currentContraption.pickUpCard();
          break;
        case "drop-card":
          await currentContraption.dropCard();
          break;
        case "determine-card":
          await currentContraption.determineCard();
          break;
        case "turn-to-pile":
          await currentContraption.turnToPile(arg);
          break;
        case "distribute":
          if (!currentContraption.currentPile.topCard.isKnown) {
            await currentContraption.determineCard();
            sendContraption();
            await new Promise((r) => setTimeout(r, 1500));
          }
          if (!currentContraption.cardInTheAir) {
            await currentContraption.pickUpCard();
            sendContraption();
          }
          const pile = currentContraption.getPileForColor(
            currentContraption.cardInTheAir?.color
          );
          if (currentContraption.currentPileIndex !== pile) {
            await currentContraption.turnToPile(pile);
            sendContraption();
            await new Promise((r) => setTimeout(r, 1500));
          }
          await currentContraption.dropCard();
          sendContraption();
          await currentContraption.turnToPile(0);
          break;
      }

      sendContraption();
    });
  });

  nitroApp.router.use(
    "/socket.io/",
    defineEventHandler({
      handler(event) {
        engine.handleRequest(event.node.req as any, event.node.res);
        event._handled = true;
      },
      websocket: {
        open(peer) {
          // @ts-expect-error private method and property
          engine.prepare(peer._internal.nodeReq);
          // @ts-expect-error private method and property
          engine.onWebSocket(
            (peer as any)._internal.nodeReq,
            (peer as any)._internal.nodeReq.socket,
            peer.websocket
          );
        },
      },
    })
  );
});
