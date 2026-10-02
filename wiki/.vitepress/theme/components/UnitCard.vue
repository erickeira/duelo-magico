<script setup lang="ts">
import { computed, ref as vref } from 'vue';
import { ARENAS, MAX_UNIT_LEVEL, UNITS, unitStatAt } from '@content/index';
import { dps, fmt, rarityOf, ref, roleLabel, worldOf } from './util';

const props = defineProps<{ id: string }>();
const u = UNITS.find((x) => x.id === props.id)!;
const rarity = rarityOf(u.rarity);
const world = worldOf(u.world);
const level = vref(rarity.startLevel);

const hp = computed(() => unitStatAt(u.hp, rarity.startLevel, level.value));
const dmg = computed(() => unitStatAt(u.damage, rarity.startLevel, level.value));
</script>

<template>
  <div class="dm-card" :style="{ borderLeft: `4px solid ${rarity.color}` }">
    <div class="dm-cost" title="Custo em mana">{{ u.cost }}</div>
    <div class="dm-row">
      <span class="dm-icon">{{ u.icon }}</span>
      <div>
        <strong style="font-size: 18px">{{ u.name }}</strong>
        <span v-if="u.count > 1" class="dm-muted"> × {{ u.count }}</span>
        <div class="dm-badges">
          <span class="dm-badge" :style="{ color: rarity.color }">{{ rarity.name }}</span>
          <span class="dm-badge" :style="{ color: world.color }">{{ world.icon }} {{ world.name }}</span>
          <span v-for="r in u.roles" :key="r" class="dm-badge" style="color: var(--vp-c-text-2)">{{ roleLabel(r) }}</span>
          <span v-if="u.targetsAir && !u.flying" class="dm-badge" style="color: #0ea5e9">Acerta voadores</span>
        </div>
      </div>
    </div>
    <p>{{ u.description }}</p>

    <div class="dm-level">
      Nível <strong>{{ level }}</strong>
      <input v-model.number="level" type="range" :min="rarity.startLevel" :max="MAX_UNIT_LEVEL" aria-label="Nível da tropa" />
    </div>
    <div class="dm-stats">
      <div>Vida<b>{{ fmt(hp) }}</b></div>
      <div>Dano<b>{{ fmt(dmg) }}</b></div>
      <div>Intervalo<b>{{ String(u.attackInterval).replace('.', ',') }}s</b></div>
      <div>DPS<b>{{ dps(dmg, u.attackInterval, u.count) }}</b></div>
      <div>Alcance<b>{{ u.range <= 40 ? 'curto' : u.range }}</b></div>
      <div>Velocidade<b>{{ u.speed || 'parada' }}</b></div>
      <div v-if="u.splash">Área<b>{{ u.splash }}</b></div>
      <div v-if="u.lifetime">Duração<b>{{ u.lifetime }}s</b></div>
    </div>

    <p v-if="u.ability"><strong>✦ {{ u.ability.name }}:</strong> {{ u.ability.description }}</p>
    <p>
      <strong style="color: #22c55e">Forte contra:</strong>
      <template v-for="(id, i) in u.strongAgainst" :key="id">{{ i ? ', ' : ' ' }}<a :href="ref(id).href">{{ ref(id).label }}</a></template>
    </p>
    <p>
      <strong style="color: #ef4444">Fraco contra:</strong>
      <template v-for="(id, i) in u.weakAgainst" :key="id">{{ i ? ', ' : ' ' }}<a :href="ref(id).href">{{ ref(id).label }}</a></template>
    </p>
    <p class="dm-muted">Disponível a partir da arena {{ ARENAS[u.arena].icon }} {{ ARENAS[u.arena].name }} ({{ fmt(ARENAS[u.arena].trophies) }} troféus).</p>
  </div>
</template>
