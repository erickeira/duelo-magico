<script setup lang="ts">
// Mostra um número de BATTLE_RULES dentro do texto: <Rule k="matchSeconds" />
import { BATTLE_RULES } from '@content/index';

const props = defineProps<{ k: keyof typeof BATTLE_RULES }>();
const value = String(BATTLE_RULES[props.k]).replace('.', ',');
</script>

<template><strong>{{ value }}</strong></template>
