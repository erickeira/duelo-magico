<script setup lang="ts">
import { withBase } from 'vitepress';
import { GODS, SPELLS } from '@content/index';
import { fmt } from './util';
</script>

<template>
  <div class="dm-grid">
    <a v-for="g in GODS" :key="g.id" :href="withBase(`/deuses/${g.id}`)" class="dm-card" style="text-decoration: none; color: inherit"
       :style="{ borderTop: `4px solid ${g.color}` }">
      <div class="dm-row">
        <span class="dm-icon">{{ g.icon }}</span>
        <div>
          <strong style="font-size: 18px">{{ g.name }}</strong>
          <div class="dm-muted">{{ g.title }}</div>
        </div>
      </div>
      <div class="dm-badges">
        <span class="dm-badge" :style="{ color: g.color }">{{ g.element }}</span>
        <span class="dm-badge" style="color: var(--vp-c-text-2)">Dificuldade {{ '★'.repeat(g.difficulty) }}{{ '☆'.repeat(3 - g.difficulty) }}</span>
        <span class="dm-badge" style="color: var(--vp-c-text-2)">{{ g.unlockTrophies ? `🏆 ${fmt(g.unlockTrophies)}` : 'Inicial' }}</span>
      </div>
      <p>{{ g.summary }}</p>
      <p style="font-size: 22px; margin: 0">
        <span v-for="id in g.spells" :key="id" :title="SPELLS.find((s) => s.id === id)?.name">{{ SPELLS.find((s) => s.id === id)?.icon }} </span>
      </p>
    </a>
  </div>
</template>
