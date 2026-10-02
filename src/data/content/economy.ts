import type { GodId, Rarity } from './types';
import { ARENAS } from './units';

/** Economia da v1 (offline, sem compras). */

export const CURRENCIES = [
  { id: 'ouro', name: 'Ouro', icon: '🪙', use: 'Subir tropas e magias de nível.' },
  { id: 'essencia', name: 'Essência Divina', icon: '✴️', use: 'Subir deuses de nível (desbloqueia magias e aumenta a vida do castelo).' },
  { id: 'fragmentos', name: 'Fragmentos de Magia', icon: '🔹', use: 'Cada magia tem os próprios fragmentos; usados para subi-la de nível.' },
  { id: 'cartas', name: 'Cartas de Tropa', icon: '🃏', use: 'Cada tropa tem as próprias cartas; repetidas sobem o nível.' },
  { id: 'trofeus', name: 'Troféus', icon: '🏆', use: 'Medem a sua força; liberam arenas, tropas e deuses.' },
];

export interface ChestDef {
  id: string;
  name: string;
  icon: string;
  unlockMinutes: number;
  /** Chance (0–1) de vir de uma vitória. */
  dropChance: number;
  gold: [number, number];
  cards: number;
  /** Cartas garantidas por raridade (o resto é sorteado por RARITY_WEIGHTS). */
  guaranteed: Partial<Record<Rarity, number>>;
  essence: number;
  spellFragments: number;
}

export const CHESTS: ChestDef[] = [
  { id: 'madeira', name: 'Baú de Madeira', icon: '📦', unlockMinutes: 5, dropChance: 0.6, gold: [20, 40], cards: 6, guaranteed: {}, essence: 2, spellFragments: 1 },
  { id: 'prata', name: 'Baú de Prata', icon: '🥈', unlockMinutes: 30, dropChance: 0.3, gold: [60, 100], cards: 15, guaranteed: { rara: 2 }, essence: 6, spellFragments: 3 },
  { id: 'ouro', name: 'Baú de Ouro', icon: '🥇', unlockMinutes: 120, dropChance: 0.09, gold: [200, 320], cards: 40, guaranteed: { rara: 6, epica: 1 }, essence: 20, spellFragments: 8 },
  { id: 'divino', name: 'Baú Divino', icon: '👑', unlockMinutes: 480, dropChance: 0.01, gold: [600, 900], cards: 90, guaranteed: { lendaria: 1 }, essence: 60, spellFragments: 25 },
];

export const chestById = (id: string) => CHESTS.find((c) => c.id === id);

/** Chance relativa de cada raridade nas cartas sorteadas (só entre tropas já liberadas pela arena). */
export const RARITY_WEIGHTS: Record<Rarity, number> = { comum: 70, rara: 22, epica: 7, lendaria: 1 };

/** Recompensas por partida contra a IA. */
export const VICTORY_REWARD = {
  goldBase: 20,
  goldPerArena: 5,
  goldDraw: 10,
  trophiesWin: 30,
  trophiesLoss: -15,
  trophiesDraw: 0,
  essence: 1,
};

/** Espaços de baú; vitórias com os espaços cheios não dão baú. */
export const CHEST_SLOTS = 4;

/** Baú grátis: um a cada 4h, acumula até 2. */
export const FREE_CHEST = { everyHours: 4, maxStored: 2, chest: 'madeira' };

/** Coleção inicial do jogador. As magias liberadas vêm do nível do deus. */
export const STARTING_COLLECTION: { units: string[]; god: GodId; gold: number } = {
  units: ['cavaleiro', 'arqueiras', 'lanceiros', 'esqueletos', 'diabretes', 'carnical', 'aprendiz', 'elemental-agua', 'golem'],
  god: 'ignar',
  gold: 100,
};

/** Índice da arena para uma quantidade de troféus. */
export function arenaForTrophies(trophies: number): number {
  let idx = 0;
  for (const a of ARENAS) if (trophies >= a.trophies) idx = a.index;
  return idx;
}
