<script setup lang="ts">
import {
  ACCOUNT_XP_TO_LEVEL, CASTLE_BASE_HP, GOD_CASTLE_HP_PER_LEVEL, GOD_ESSENCE_TO_LEVEL, GODS, MAX_ACCOUNT_LEVEL, MAX_GOD_LEVEL,
  MAX_SPELL_LEVEL, MAX_UNIT_LEVEL, RARITIES, SPELL_FRAGMENTS_TO_LEVEL, SPELL_GOLD_TO_LEVEL, SPELL_GROWTH_PER_LEVEL, SPELLS,
  UNIT_CARDS_TO_LEVEL, UNIT_GOLD_TO_LEVEL, UNIT_GROWTH_PER_LEVEL, UNIT_XP_FOR_LEVEL, castleHpAt,
} from '@content/index';
import { fmt } from './util';

const props = defineProps<{ type: 'unit' | 'spell' | 'god' | 'account' }>();
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const pct = (n: number) => `+${Math.round(n * 100)}%`;
const spellsUnlockedAt = (level: number) => {
  const rar = [...new Set(SPELLS.filter((s) => s.godLevel === level).map((s) => s.rarity))];
  return rar.length ? `magia ${rar.join('/')} (${GODS.length} deuses)` : '';
};
</script>

<template>
  <div class="dm-table-wrap">
    <!-- Tropas -->
    <table v-if="props.type === 'unit'">
      <thead>
        <tr>
          <th>Nível</th>
          <th v-for="r in RARITIES" :key="r.id" :style="{ color: r.color }">Cartas ({{ r.name }})</th>
          <th>Ouro</th>
          <th>XP de conta</th>
          <th>Vida/dano vs. nível 1</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="lvl in range(1, MAX_UNIT_LEVEL)" :key="lvl">
          <td><strong>{{ lvl }}</strong></td>
          <td v-for="r in RARITIES" :key="r.id">
            {{ lvl < r.startLevel ? '—' : lvl === r.startLevel ? 'inicial' : UNIT_CARDS_TO_LEVEL[r.id][lvl] }}
          </td>
          <td>{{ lvl === 1 ? '—' : fmt(UNIT_GOLD_TO_LEVEL[lvl]) }}</td>
          <td>{{ lvl === 1 ? '—' : UNIT_XP_FOR_LEVEL[lvl] }}</td>
          <td>{{ lvl === 1 ? 'base' : pct(UNIT_GROWTH_PER_LEVEL * (lvl - 1)) }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Magias -->
    <table v-else-if="props.type === 'spell'">
      <thead><tr><th>Nível</th><th>Fragmentos</th><th>Ouro</th><th>Poder (dano, cura, escudo, vida)</th><th>Evolução</th></tr></thead>
      <tbody>
        <tr v-for="lvl in range(1, MAX_SPELL_LEVEL)" :key="lvl">
          <td><strong>{{ lvl }}</strong></td>
          <td>{{ lvl === 1 ? 'desbloqueio' : SPELL_FRAGMENTS_TO_LEVEL[lvl] }}</td>
          <td>{{ lvl === 1 ? '—' : fmt(SPELL_GOLD_TO_LEVEL[lvl]) }}</td>
          <td>{{ lvl === 1 ? 'base' : pct(SPELL_GROWTH_PER_LEVEL * (lvl - 1)) }}</td>
          <td>{{ lvl === 3 ? '1ª evolução' : lvl === 5 ? '2ª evolução' : '' }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Deuses -->
    <table v-else-if="props.type === 'god'">
      <thead><tr><th>Nível</th><th>Essência</th><th>Libera</th><th>Vida do castelo</th></tr></thead>
      <tbody>
        <tr v-for="lvl in range(1, MAX_GOD_LEVEL)" :key="lvl">
          <td><strong>{{ lvl }}</strong></td>
          <td>{{ lvl === 1 ? '—' : GOD_ESSENCE_TO_LEVEL[lvl] }}</td>
          <td>{{ spellsUnlockedAt(lvl) || '—' }}</td>
          <td>{{ lvl === 1 ? 'base' : pct(GOD_CASTLE_HP_PER_LEVEL * (lvl - 1)) }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Conta -->
    <table v-else>
      <thead><tr><th>Nível de conta</th><th>XP total</th><th>Vida do castelo (deus nível 1)</th></tr></thead>
      <tbody>
        <tr v-for="lvl in range(1, MAX_ACCOUNT_LEVEL)" :key="lvl">
          <td><strong>{{ lvl }}</strong></td>
          <td>{{ lvl === 1 ? '0' : fmt(ACCOUNT_XP_TO_LEVEL[lvl]) }}</td>
          <td>{{ fmt(castleHpAt(lvl)) }}{{ lvl === 1 ? ` (base ${fmt(CASTLE_BASE_HP)})` : '' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
