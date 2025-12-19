<template>
  <div class="card">
    <button type="button" @click="increment">count is {{ counter }}</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const counter = ref(0);

function increment() {
  counter.value++;
}
</script>
