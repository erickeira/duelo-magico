<script setup lang="ts">
import { computed, ref as vref } from 'vue';
import { MAX_SPELL_LEVEL, SPELLS, describeSpell } from '@content/index';
import { TARGET_LABELS, godOf, rarityOf } from './util';

const props = defineProps<{ id: string }>();
const s = SPELLS.find((x) => x.id === props.id)!;
const rarity = rarityOf(s.rarity);
const god = godOf(s.god);
const level = vref(1);
const text = computed(() => describeSpell(s, level.value));
</script>

<template>
  <div class="dm-card" :style="{ borderLeft: `4px solid ${rarity.color}` }">
    <div class="dm-row">
      <span class="dm-icon">{{ s.icon }}</span>
      <div>
        <strong style="font-size: 18px">{{ s.name }}</strong>
        <div class="dm-badges">
          <span class="dm-badge" :style="{ color: rarity.color }">{{ rarity.name }}</span>
          <span class="dm-badge" :style="{ color: god.color }">{{ god.icon }} {{ god.name }}</span>
          <span class="dm-badge" style="color: var(--vp-c-text-2)">Alvo: {{ TARGET_LABELS[s.target] }}</span>
        </div>
      </div>
    </div>

    <div class="dm-stats">
      <div>Recarga inicial<b>{{ s.initialCooldown }}s</b></div>
      <div>Recarga<b>{{ s.cooldown }}s</b></div>
      <div v-if="s.radius">Raio<b>{{ s.radius }}</b></div>
      <div>Libera no deus<b>nível {{ s.godLevel }}</b></div>
    </div>

    <div class="dm-level">
      Nível da magia <strong>{{ level }}</strong>
      <input v-model.number="level" type="range" min="1" :max="MAX_SPELL_LEVEL" aria-label="Nível da magia" />
    </div>
    <p>{{ text }}</p>
    <p class="dm-muted" style="margin-bottom: 4px">Evoluções:</p>
    <ul style="margin: 0; font-size: 14px">
      <li v-for="e in s.evolutions" :key="e.level" :style="{ opacity: level >= e.level ? 1 : 0.5 }">
        <strong>Nível {{ e.level }}:</strong> {{ e.description }} <span v-if="level >= e.level">✓</span>
      </li>
    </ul>
  </div>
</template>
