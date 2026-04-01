<template>
  <div class="rules-page-container">
    <ClientOnly>
      <StrategyIndicatorsComp />
    </ClientOnly>
  </div>
</template>

<script setup>
import StrategyIndicatorsComp from '~/components/StrategyIndicatorsComp.vue';

useHead({
  title: 'Strategy Indicators - Trade Bot'
});
</script>

<style scoped>
.rules-page-container {
  padding: 0rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
