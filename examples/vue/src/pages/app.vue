<template>
  <div>
    <div class="flex justify-evenly">
      <vite-logo />
      <vue-logo />
    </div>
    <h1>Hello {{ $t('title') }}!</h1>
    <counter />
    <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
  </div>
</template>

<script setup lang="ts">
import counter from '@/components/counter';
import viteLogo from '@/components/vite-logo';
import vueLogo from '@/components/vue-logo';
import useI18n from '@/composables/use-i18n';

const $t = useI18n();
</script>
