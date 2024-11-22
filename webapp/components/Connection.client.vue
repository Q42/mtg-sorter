<script setup>
const url = ref('');

setInterval(() => {
  url.value = `http://10.71.16.46/capture?dt=${Date.now()}`;
}, 10 * 1000);
</script>

<template>
  <div id="preview">
    <img :src="url" crossorigin id="stream" width="400" />
  </div>
</template>

<style lang="css" scoped>
#preview {
  position: fixed;
  top: 0;
  right: 0;
}
</style>