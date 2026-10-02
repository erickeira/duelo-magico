<script setup lang="ts">
import { computed, ref as vref } from 'vue';
import { UNITS, WORLDS } from '@content/index';
import { unitLink } from './util';

// Linha = atacante, coluna = alvo. ✓ = a linha é forte contra a coluna; ✗ = fraca.
const world = vref('solar');
const rows = computed(() => UNITS.filter((u) => !world.value || u.world === world.value));

function cell(rowId: string, colId: string) {
  const row = UNITS.find((u) => u.id === rowId)!;
  const col = UNITS.find((u) => u.id === colId)!;
  if (row.strongAgainst.includes(colId) || col.weakAgainst.includes(rowId)) return 'win';
  if (row.weakAgainst.includes(colId) || col.strongAgainst.includes(rowId)) return 'lose';
  return '';
}
</script>

<template>
  <div class="dm-filters">
    <select v-model="world" aria-label="Mundo das linhas">
      <option value="">Linhas: todos os mundos</option>
      <option v-for="w in WORLDS" :key="w.id" :value="w.id">Linhas: {{ w.icon }} {{ w.name }}</option>
    </select>
  </div>
  <div class="dm-table-wrap">
    <table class="dm-matrix">
      <thead>
        <tr>
          <th></th>
          <th v-for="c in UNITS" :key="c.id" :title="c.name">{{ c.icon }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in rows" :key="r.id">
          <th style="text-align: left; white-space: nowrap"><a :href="unitLink(r.id)">{{ r.icon }} {{ r.name }}</a></th>
          <td v-for="c in UNITS" :key="c.id" :class="cell(r.id, c.id)" :title="`${r.name} × ${c.name}`">
            {{ r.id === c.id ? '·' : cell(r.id, c.id) === 'win' ? '✓' : cell(r.id, c.id) === 'lose' ? '✗' : '' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p class="dm-muted">Passe o mouse (ou toque) nos ícones para ver os nomes. ✓ verde: a tropa da linha vence a da coluna. ✗ vermelho: perde.</p>
</template>
