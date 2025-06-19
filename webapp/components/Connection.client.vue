<script setup>
const url = ref("");

setInterval(() => {
  url.value = `http://192.168.178.61/capture?dt=${Date.now()}`;
}, 1000);
</script>

<template>
  <div id="preview">
    <img :src="url" crossorigin id="stream" width="400" class="rotated" />
  </div>
</template>

<style lang="css" scoped>
#preview {
  position: fixed;
  top: 0;
  right: 0;
}

.rotated {
  transform: rotate(180deg);
}
</style>
