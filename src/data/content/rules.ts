/** Regras da batalha da versão alvo (o protótipo atual ainda usa src/config.ts). */
export const BATTLE_RULES = {
  matchSeconds: 180,
  doubleManaLastSeconds: 60,
  overtimeSeconds: 60,
  /** Na prorrogação, cada castelo perde esta % da vida máxima por segundo... */
  overtimeDrainPctPerSec: 0.5,
  /** ...e a perda aumenta esta % a cada 10s. */
  overtimeDrainRampPct: 0.5,
  maxMana: 10,
  startMana: 5,
  secondsPerMana: 1.4,
  deckSize: 8,
  handSize: 4,
  spellsPerMatch: 2,
  savedDecks: 5,
  lanes: 3,
  castleRange: 240,
  castleDamage: 45,
  castleAttackInterval: 0.9,
};
