<script setup lang="ts">
import { GODS } from '@content/index';
import { fmt } from './util';

const props = defineProps<{ id: string }>();
const g = GODS.find((x) => x.id === props.id)!;
</script>

<template>
  <div class="dm-card" :style="{ borderTop: `4px solid ${g.color}`, marginTop: '16px' }">
    <div class="dm-row">
      <span style="font-size: 56px; line-height: 1">{{ g.icon }}</span>
      <div>
        <div style="font-size: 26px; font-weight: 700">{{ g.name }}</div>
        <div class="dm-muted" style="font-size: 16px">{{ g.title }}</div>
        <div class="dm-badges">
          <span class="dm-badge" :style="{ color: g.color }">{{ g.element }}</span>
          <span class="dm-badge" style="color: var(--vp-c-text-2)">Dificuldade {{ '★'.repeat(g.difficulty) }}{{ '☆'.repeat(3 - g.difficulty) }}</span>
          <span class="dm-badge" style="color: var(--vp-c-text-2)">{{ g.unlockTrophies ? `Libera com 🏆 ${fmt(g.unlockTrophies)} troféus` : 'Deus inicial' }}</span>
        </div>
      </div>
    </div>
    <p style="font-size: 15px">{{ g.summary }}</p>
    <h3 style="margin-top: 16px">História</h3>
    <p v-for="(p, i) in g.lore" :key="i" style="font-size: 15px">{{ p }}</p>
    <h3 style="margin-top: 16px">Como jogar</h3>
    <ul><li v-for="(p, i) in g.playstyle" :key="i">{{ p }}</li></ul>
  </div>
</template>
