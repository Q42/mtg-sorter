import { Server as Engine } from "engine.io";
import { Server } from "socket.io";
import { defineEventHandler } from "h3";
import { whatCardIsInFrontOfTheCamera } from "../ocr";
import { getCard } from "../cards";
import { Contraption, Pile } from "../piles";
import { ESP } from "../esp";

let currentContraption: Contraption | undefined;

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
        const card = getCard(cardName);
        socket.send("what-card", { name: cardName, card });
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
        sendContraption();
      }

      if (!currentContraption) return;

      switch (data) {
        case "pick-up-card":
          currentContraption.pickUpCard();
          break;
        case "drop-card":
          currentContraption.dropCard();
          break;
        case "determine-card":
          await currentContraption.determineCard();
          break;
        case "turn-to-pile":
          currentContraption.turnToPile(arg);
          break;
        case "distribute":
          currentContraption.determineCard();
          sendContraption();
          await new Promise((r) => setTimeout(r, 500));
          currentContraption.pickUpCard();
          sendContraption();
          await new Promise((r) => setTimeout(r, 500));
          const pile = currentContraption.getPileForColor(
            currentContraption.cardInTheAir?.color
          );
          currentContraption.turnToPile(pile);
          sendContraption();
          await new Promise((r) => setTimeout(r, 500));
          currentContraption.dropCard();
          sendContraption();
          await new Promise((r) => setTimeout(r, 500));
          currentContraption.turnToPile(0);
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
