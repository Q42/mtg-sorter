<script setup>
const props = defineProps(['contraption'])
</script>

<template>
  <div>
    <p>Current Pile: {{ contraption.currentPile }}</p>
    <p>In the air: {{ contraption.cardInTheAir }}</p>
    <ul class="piles">
      <li :class="`pile ${ props.contraption.currentPile === pile.index ? 'active' : '' }`" v-for="pile in props.contraption.piles">
        <h3>Pile {{  pile.index }} ({{ pile.cards.length }})</h3>
        <ul class="cards">
          <li v-for="card in pile.cards" class="card">
            Card {{ card.index }}: {{ card.name }}
          </li>
        </ul>
      </li>
    </ul>
    <!-- <pre style="white-space: pre-wrap;">
      {{ JSON.stringify(props.contraption, null, 2) }}
    </pre> -->
  </div>
</template>

<style>

ul.piles {
  list-style-type: none;
  padding: 0;
  margin: 30px 0;
  display:flex;
  width: 100%;
  justify-content: center;
}

ul.piles li.pile {
  border: 3px dashed green;
  margin: 0 10px;
}
ul.piles li.pile.active {
  border: 3px dashed red;
  margin: 0 10px;
}

ul.cards {
  list-style-type: none;
  padding: 0;
}
ul.cards li.card {
  background-color: lightblue;
  margin: 0 10px;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 10px;
}

</style>