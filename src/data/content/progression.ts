import type { Rarity } from './types';

/** Nível máximo de tropas, deuses e conta. Magias vão até 5. */
export const MAX_UNIT_LEVEL = 10;
export const MAX_GOD_LEVEL = 10;
export const MAX_SPELL_LEVEL = 5;
export const MAX_ACCOUNT_LEVEL = 10;

/** Crescimento de vida e dano das tropas por nível acima do inicial da raridade. */
export const UNIT_GROWTH_PER_LEVEL = 0.08;

/** Vida/dano de uma tropa no nível `level`, partindo do valor base no nível inicial da raridade. */
export function unitStatAt(base: number, startLevel: number, level: number): number {
  return Math.round(base * (1 + UNIT_GROWTH_PER_LEVEL * (level - startLevel)));
}

/**
 * Cartas repetidas necessárias para chegar a cada nível, por raridade.
 * Chave = nível de destino.
 */
export const UNIT_CARDS_TO_LEVEL: Record<Rarity, Record<number, number>> = {
  comum: { 2: 2, 3: 4, 4: 10, 5: 20, 6: 50, 7: 100, 8: 200, 9: 400, 10: 800 },
  rara: { 4: 2, 5: 4, 6: 10, 7: 20, 8: 50, 9: 100, 10: 200 },
  epica: { 6: 2, 7: 4, 8: 10, 9: 20, 10: 50 },
  lendaria: { 8: 1, 9: 2, 10: 4 },
};

/** Ouro para subir uma tropa até o nível de destino (igual para todas as raridades). */
export const UNIT_GOLD_TO_LEVEL: Record<number, number> = {
  2: 5, 3: 20, 4: 50, 5: 150, 6: 400, 7: 1000, 8: 2000, 9: 4000, 10: 8000,
};

/** XP de conta ganha ao subir uma tropa até o nível de destino. */
export const UNIT_XP_FOR_LEVEL: Record<number, number> = {
  2: 4, 3: 5, 4: 6, 5: 10, 6: 25, 7: 50, 8: 100, 9: 200, 10: 400,
};

/** Essência divina para subir o deus até o nível de destino. */
export const GOD_ESSENCE_TO_LEVEL: Record<number, number> = {
  2: 10, 3: 20, 4: 40, 5: 80, 6: 150, 7: 300, 8: 500, 9: 800, 10: 1200,
};

/** Bônus de vida do castelo por nível do deus (o deus "abençoa" o castelo). */
export const GOD_CASTLE_HP_PER_LEVEL = 0.02;

/** Fragmentos e ouro para subir uma magia até o nível de destino. */
export const SPELL_FRAGMENTS_TO_LEVEL: Record<number, number> = { 2: 5, 3: 15, 4: 40, 5: 100 };
export const SPELL_GOLD_TO_LEVEL: Record<number, number> = { 2: 100, 3: 400, 4: 1500, 5: 5000 };
export const SPELL_GROWTH_PER_LEVEL = 0.1;

/** XP total para chegar a cada nível de conta. */
export const ACCOUNT_XP_TO_LEVEL: Record<number, number> = {
  2: 20, 3: 50, 4: 100, 5: 200, 6: 400, 7: 800, 8: 1500, 9: 3000, 10: 5000,
};

/** Vida base do castelo e crescimento por nível de conta. */
export const CASTLE_BASE_HP = 3000;
export const CASTLE_HP_PER_ACCOUNT_LEVEL = 0.06;

export function castleHpAt(accountLevel: number, godLevel = 1): number {
  return Math.round(
    CASTLE_BASE_HP * (1 + CASTLE_HP_PER_ACCOUNT_LEVEL * (accountLevel - 1)) * (1 + GOD_CASTLE_HP_PER_LEVEL * (godLevel - 1)),
  );
}
