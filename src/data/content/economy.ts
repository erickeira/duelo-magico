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
  guaranteed: string;
  essence: number;
  spellFragments: number;
}

export const CHESTS: ChestDef[] = [
  { id: 'madeira', name: 'Baú de Madeira', icon: '📦', unlockMinutes: 5, dropChance: 0.6, gold: [20, 40], cards: 6, guaranteed: '—', essence: 2, spellFragments: 1 },
  { id: 'prata', name: 'Baú de Prata', icon: '🥈', unlockMinutes: 30, dropChance: 0.3, gold: [60, 100], cards: 15, guaranteed: '2 raras', essence: 6, spellFragments: 3 },
  { id: 'ouro', name: 'Baú de Ouro', icon: '🥇', unlockMinutes: 120, dropChance: 0.09, gold: [200, 320], cards: 40, guaranteed: '6 raras + 1 épica', essence: 20, spellFragments: 8 },
  { id: 'divino', name: 'Baú Divino', icon: '👑', unlockMinutes: 480, dropChance: 0.01, gold: [600, 900], cards: 90, guaranteed: '1 lendária', essence: 60, spellFragments: 25 },
];

/** Por vitória contra a IA. */
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

/** Coleção inicial do jogador. */
export const STARTING_COLLECTION = {
  units: ['cavaleiro', 'arqueiras', 'lanceiros', 'esqueletos', 'diabretes', 'carnical', 'aprendiz', 'elemental-agua', 'golem'],
  god: 'ignar',
  spells: ['cometa-rubro'],
  gold: 100,
};
