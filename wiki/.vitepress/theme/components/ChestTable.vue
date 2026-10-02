<script setup lang="ts">
import { CHESTS } from '@content/index';
import { fmt } from './util';

const time = (min: number) => (min < 60 ? `${min} min` : `${min / 60} h`);
</script>

<template>
  <div class="dm-table-wrap">
    <table>
      <thead>
        <tr><th>Baú</th><th>Chance por vitória</th><th>Abrir em</th><th>Ouro</th><th>Cartas</th><th>Garantido</th><th>Essência</th><th>Fragmentos</th></tr>
      </thead>
      <tbody>
        <tr v-for="c in CHESTS" :key="c.id">
          <td style="white-space: nowrap"><strong>{{ c.icon }} {{ c.name }}</strong></td>
          <td>{{ Math.round(c.dropChance * 100) }}%</td>
          <td>{{ time(c.unlockMinutes) }}</td>
          <td>{{ fmt(c.gold[0]) }}–{{ fmt(c.gold[1]) }}</td>
          <td>{{ c.cards }}</td>
          <td>{{ c.guaranteed }}</td>
          <td>{{ c.essence }}</td>
          <td>{{ c.spellFragments }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
