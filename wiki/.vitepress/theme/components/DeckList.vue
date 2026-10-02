<script setup lang="ts">
import { GODS, UNITS } from '@content/index';
import { ref } from './util';

const props = defineProps<{ god: string }>();
const g = GODS.find((x) => x.id === props.god)!;
const avgCost = (ids: string[]) =>
  (ids.reduce((sum, id) => sum + (UNITS.find((u) => u.id === id)?.cost ?? 0), 0) / ids.length).toFixed(1).replace('.', ',');
</script>

<template>
  <div v-for="d in g.suggestedDecks" :key="d.name" class="dm-card" style="margin: 12px 0">
    <strong style="font-size: 17px">{{ d.name }}</strong>
    <span class="dm-muted"> · custo médio {{ avgCost(d.units) }} de mana</span>
    <p style="margin-bottom: 4px"><strong>Tropas:</strong></p>
    <div class="dm-badges">
      <a v-for="id in d.units" :key="id" :href="ref(id).href" class="dm-badge" style="color: var(--vp-c-text-1); text-decoration: none">{{ ref(id).label }}</a>
    </div>
    <p style="margin-bottom: 4px"><strong>Magias:</strong></p>
    <div class="dm-badges">
      <a v-for="id in d.spells" :key="id" :href="ref(id).href" class="dm-badge" :style="{ color: g.color, textDecoration: 'none' }">{{ ref(id).label }}</a>
    </div>
    <p><strong>Plano de jogo:</strong> {{ d.plan }}</p>
  </div>
</template>
