<script setup lang="ts">
import { computed, ref as vref } from 'vue';
import { GODS, SPELLS, describeSpell } from '@content/index';
import { TARGET_LABELS, godOf, rarityOf, spellLink } from './util';

const props = defineProps<{ god?: string }>();
const god = vref(props.god ?? '');
const rows = computed(() => SPELLS.filter((s) => !god.value || s.god === god.value));
</script>

<template>
  <div v-if="!props.god" class="dm-filters">
    <select v-model="god" aria-label="Deus">
      <option value="">Todos os deuses</option>
      <option v-for="g in GODS" :key="g.id" :value="g.id">{{ g.icon }} {{ g.name }}</option>
    </select>
  </div>
  <div class="dm-table-wrap">
    <table>
      <thead>
        <tr>
          <th>Magia</th>
          <th v-if="!props.god">Deus</th>
          <th>Raridade</th>
          <th>Alvo</th>
          <th>Recarga inicial / recarga</th>
          <th>Deus nível</th>
          <th>Efeito (nível 1)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in rows" :key="s.id">
          <td style="white-space: nowrap"><a :href="spellLink(s.id)">{{ s.icon }} {{ s.name }}</a></td>
          <td v-if="!props.god" style="white-space: nowrap">{{ godOf(s.god).icon }} {{ godOf(s.god).name }}</td>
          <td :style="{ color: rarityOf(s.rarity).color, fontWeight: 600 }">{{ rarityOf(s.rarity).name }}</td>
          <td>{{ TARGET_LABELS[s.target] }}</td>
          <td style="white-space: nowrap">{{ s.initialCooldown }}s / {{ s.cooldown }}s</td>
          <td>{{ s.godLevel }}</td>
          <td class="dm-muted">{{ describeSpell(s, 1) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
