import { GODS, godById, type GodId } from '../data/content';

/** O que um lado leva para a batalha: deus, 2 magias e 8 tropas. */
export interface Loadout {
  god: GodId;
  spells: [string, string];
  units: string[];
  spellLevel: number;
}

export type Difficulty = 'facil' | 'normal' | 'dificil';

export interface BattleSettings {
  god: GodId;
  difficulty: Difficulty;
}

/** Nível das magias forçado pela URL (?nivelMagia=5), útil para testar evoluções. */
function spellLevelFromUrl(): number {
  const v = Number(new URLSearchParams(location.search).get('nivelMagia'));
  return v >= 1 && v <= 5 ? Math.floor(v) : 1;
}

/** Até existir a tela de deck (v0.3), cada deus usa o primeiro deck sugerido. */
export function loadoutForGod(god: GodId): Loadout {
  const deck = godById(god)!.suggestedDecks[0];
  return { god, spells: deck.spells, units: deck.units, spellLevel: spellLevelFromUrl() };
}

export function randomGod(): GodId {
  return GODS[Math.floor(Math.random() * GODS.length)].id;
}
