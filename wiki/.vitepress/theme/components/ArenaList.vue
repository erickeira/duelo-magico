<script setup lang="ts">
import { ARENAS, GODS, UNITS } from '@content/index';
import { fmt, ref } from './util';

const godsAt = (index: number) =>
  GODS.filter((g) => {
    const next = ARENAS[index + 1]?.trophies ?? Infinity;
    return g.unlockTrophies >= ARENAS[index].trophies && g.unlockTrophies < next;
  });
</script>

<template>
  <div class="dm-table-wrap">
    <table>
      <thead><tr><th>Arena</th><th>Troféus</th><th>Libera</th></tr></thead>
      <tbody>
        <tr v-for="a in ARENAS" :key="a.index">
          <td style="white-space: nowrap"><strong>{{ a.icon }} {{ a.index + 1 }}. {{ a.name }}</strong><div class="dm-muted">{{ a.description }}</div></td>
          <td>{{ fmt(a.trophies) }}</td>
          <td>
            <template v-for="(u, i) in UNITS.filter((x) => x.arena === a.index)" :key="u.id">{{ i ? ', ' : '' }}<a :href="ref(u.id).href">{{ ref(u.id).label }}</a></template>
            <template v-for="g in godsAt(a.index)" :key="g.id"><br />Deus: <strong>{{ g.icon }} {{ g.name }}</strong> ({{ fmt(g.unlockTrophies) }} troféus)</template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
