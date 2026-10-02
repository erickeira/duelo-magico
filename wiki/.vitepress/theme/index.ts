import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import './custom.css';

import ArenaList from './components/ArenaList.vue';
import ChestTable from './components/ChestTable.vue';
import CounterMatrix from './components/CounterMatrix.vue';
import DeckList from './components/DeckList.vue';
import GodGrid from './components/GodGrid.vue';
import GodHeader from './components/GodHeader.vue';
import LevelTable from './components/LevelTable.vue';
import Rule from './components/Rule.vue';
import SpellCard from './components/SpellCard.vue';
import SpellTable from './components/SpellTable.vue';
import UnitCard from './components/UnitCard.vue';
import UnitTable from './components/UnitTable.vue';
import WorldCards from './components/WorldCards.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    const components = {
      ArenaList, ChestTable, CounterMatrix, DeckList, GodGrid, GodHeader, LevelTable,
      Rule, SpellCard, SpellTable, UnitCard, UnitTable, WorldCards,
    };
    for (const [name, component] of Object.entries(components)) app.component(name, component);
  },
} satisfies Theme;
