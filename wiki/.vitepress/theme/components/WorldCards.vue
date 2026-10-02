<script setup lang="ts">
import { withBase } from 'vitepress';
import { UNITS, WORLDS } from '@content/index';
</script>

<template>
  <div class="dm-grid">
    <div v-for="w in WORLDS" :key="w.id" class="dm-card" :style="{ borderTop: `4px solid ${w.color}` }">
      <div class="dm-row">
        <span class="dm-icon">{{ w.icon }}</span>
        <div>
          <a :href="withBase(`/tropas/${w.id}`)"><strong style="font-size: 18px">{{ w.name }}</strong></a>
          <div class="dm-muted">{{ w.theme }}</div>
        </div>
      </div>
      <p>{{ w.description }}</p>
      <p style="margin-bottom: 0"><strong style="color: #22c55e">Forças</strong></p>
      <ul style="margin: 0; font-size: 14px"><li v-for="s in w.strengths" :key="s">{{ s }}</li></ul>
      <p style="margin-bottom: 0"><strong style="color: #ef4444">Fraquezas</strong></p>
      <ul style="margin: 0; font-size: 14px"><li v-for="s in w.weaknesses" :key="s">{{ s }}</li></ul>
      <p style="font-size: 22px; margin-bottom: 0">
        <span v-for="u in UNITS.filter((x) => x.world === w.id)" :key="u.id" :title="u.name">{{ u.icon }}</span>
      </p>
    </div>
  </div>
</template>
