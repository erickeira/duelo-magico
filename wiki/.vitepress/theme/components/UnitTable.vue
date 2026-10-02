<script setup lang="ts">
import { computed, ref as vref } from 'vue';
import { RARITIES, ROLE_LABELS, UNITS, WORLDS, type UnitDef } from '@content/index';
import { dps, fmt, rarityOf, roleLabel, unitLink, worldOf } from './util';

const props = defineProps<{ world?: string }>();

const world = vref(props.world ?? '');
const rarity = vref('');
const role = vref('');
const search = vref('');
const sortKey = vref<keyof UnitDef | 'dps'>('cost');
const sortDir = vref(1);

const rows = computed(() => {
  const q = search.value.trim().toLowerCase();
  return UNITS.filter(
    (u) =>
      (!world.value || u.world === world.value) &&
      (!rarity.value || u.rarity === rarity.value) &&
      (!role.value || u.roles.includes(role.value as UnitDef['roles'][number])) &&
      (!q || u.name.toLowerCase().includes(q)),
  ).sort((a, b) => {
    const va = sortKey.value === 'dps' ? dps(a.damage, a.attackInterval, a.count) : (a[sortKey.value] as number | string);
    const vb = sortKey.value === 'dps' ? dps(b.damage, b.attackInterval, b.count) : (b[sortKey.value] as number | string);
    return (va > vb ? 1 : va < vb ? -1 : 0) * sortDir.value;
  });
});

function sortBy(key: keyof UnitDef | 'dps') {
  if (sortKey.value === key) sortDir.value *= -1;
  else {
    sortKey.value = key;
    sortDir.value = 1;
  }
}
const arrow = (key: string) => (sortKey.value === key ? (sortDir.value > 0 ? ' ▲' : ' ▼') : '');
</script>

<template>
  <div class="dm-filters">
    <select v-if="!props.world" v-model="world" aria-label="Mundo">
      <option value="">Todos os mundos</option>
      <option v-for="w in WORLDS" :key="w.id" :value="w.id">{{ w.icon }} {{ w.name }}</option>
    </select>
    <select v-model="rarity" aria-label="Raridade">
      <option value="">Todas as raridades</option>
      <option v-for="r in RARITIES" :key="r.id" :value="r.id">{{ r.name }}</option>
    </select>
    <select v-model="role" aria-label="Papel">
      <option value="">Todos os papéis</option>
      <option v-for="(label, id) in ROLE_LABELS" :key="id" :value="id">{{ label }}</option>
    </select>
    <input v-model="search" placeholder="Buscar tropa…" aria-label="Buscar tropa" />
  </div>
  <div class="dm-table-wrap">
    <table>
      <thead>
        <tr>
          <th style="cursor: pointer" @click="sortBy('name')">Tropa{{ arrow('name') }}</th>
          <th v-if="!props.world">Mundo</th>
          <th>Raridade</th>
          <th style="cursor: pointer" @click="sortBy('cost')">Custo{{ arrow('cost') }}</th>
          <th style="cursor: pointer" @click="sortBy('hp')">Vida{{ arrow('hp') }}</th>
          <th style="cursor: pointer" @click="sortBy('dps')">DPS total{{ arrow('dps') }}</th>
          <th style="cursor: pointer" @click="sortBy('range')">Alcance{{ arrow('range') }}</th>
          <th style="cursor: pointer" @click="sortBy('speed')">Veloc.{{ arrow('speed') }}</th>
          <th>Papéis</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in rows" :key="u.id">
          <td><a :href="unitLink(u.id)">{{ u.icon }} {{ u.name }}</a><span v-if="u.count > 1" class="dm-muted"> ×{{ u.count }}</span></td>
          <td v-if="!props.world">{{ worldOf(u.world).icon }} {{ worldOf(u.world).name }}</td>
          <td :style="{ color: rarityOf(u.rarity).color, fontWeight: 600 }">{{ rarityOf(u.rarity).name }}</td>
          <td>{{ u.cost }}</td>
          <td>{{ fmt(u.hp) }}<span v-if="u.count > 1" class="dm-muted"> cada</span></td>
          <td>{{ dps(u.damage, u.attackInterval, u.count) }}</td>
          <td>{{ u.range <= 40 ? 'corpo a corpo' : u.range }}</td>
          <td>{{ u.speed || '—' }}</td>
          <td class="dm-muted">{{ u.roles.map(roleLabel).join(', ') }}<span v-if="u.targetsAir"> · acerta voadores</span></td>
        </tr>
      </tbody>
    </table>
  </div>
  <p class="dm-muted">{{ rows.length }} tropa(s). Valores no nível inicial da raridade. DPS total = dano ÷ intervalo × cópias.</p>
</template>
