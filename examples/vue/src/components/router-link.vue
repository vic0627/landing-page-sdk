<template>
  <a :href>
    <slot />
  </a>
</template>

<script setup lang="ts">
import { manifestResolver, getPageContext } from '@landing-page-sdk/utils-browser';
import manifest from 'virtual:route-manifest';
import { ref } from 'vue';

const href = ref('/');
const props = defineProps<{
  to: string;
  locale?: string;
}>();

const { route: fromRoute, site, lang: fromLocale } = getPageContext();

href.value = manifestResolver(manifest, {
  site,
  fromLocale,
  fromRoute: fromRoute!,
  toLocale: props.locale ?? fromLocale,
  toRoute: props.to,
});
</script>
