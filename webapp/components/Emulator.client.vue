<script setup>
import { socket } from "./socket";

const isConnected = ref(false);
const transport = ref("N/A");

if (socket.connected) {
  onConnect();
}

function onConnect() {
  isConnected.value = true;
  transport.value = socket.io.engine.transport.name;

  socket.io.engine.on("upgrade", (rawTransport) => {
    transport.value = rawTransport.name;
  });

  // socket.send('webuser');
}

function onDisconnect() {
  isConnected.value = false;
  transport.value = "N/A";
}

const card = ref({});
const contraption = ref({});
const turnToPile = ref(0);

socket.on("connect", onConnect);
socket.on("disconnect", onDisconnect);
socket.on("message", (type, data) => {
  console.log("received", type, data);

  if (type === "what-card") {
    card.value = data;
  }
  if (type === "contraption") {
    contraption.value = data;
  }
});

onBeforeUnmount(() => {
  socket.off("connect", onConnect);
  socket.off("disconnect", onDisconnect);
});
</script>

<template>
  <div>
    <button
      @click="
        card = {};
        socket.send('what-card');
      "
    >
      What card is this?
    </button>
    <pre style="white-space: pre-wrap">
      {{ JSON.stringify(card, null, 2) }}
    </pre>

    <div>
      <button @click="socket.send('pause')">pause</button>
      <button @click="socket.send('restart')">
        reset (dont forget to put start positions)</button
      ><br />
      <button @click="socket.send('demo')">DEMO</button><br />
      <button @click="socket.send('demo-2')">DEMO 2</button>
      <button @click="socket.send('sort-by-color')">sort by color</button>
      <button @click="socket.send('distribute')">Distribute 1!</button>
      <button @click="socket.send('pick-up-card')">Pick up card</button><br />
      <button @click="socket.send('drop-card')">Drop card</button>
      <button @click="socket.send('determine-card')">Determine card</button>
      <button @click="socket.send('light-on')">light on</button>
      <button @click="socket.send('light-off')">light off</button>
      <input type="number" v-model="turnToPile" /><button
        @click="socket.send('turn-to-pile', turnToPile)"
      >
        Turn to pile
      </button>
    </div>

    <Contraption :contraption="contraption" />
  </div>
</template>
