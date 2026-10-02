import { GODS, godById, type GodId } from '../data/content';
import type { Deck } from '../save/save';

/** O que um lado leva para a batalha: deus, 2 magias e 8 tropas. */
export interface Loadout {
  god: GodId;
  spells: [string, string];
  units: string[];
  spellLevel: number;
}

export type Difficulty = 'facil' | 'normal' | 'dificil';

export interface BattleSettings {
  deck: Deck;
  difficulty: Difficulty;
}

/** Nível das magias forçado pela URL (?nivelMagia=5), útil para testar evoluções. */
function spellLevelFromUrl(): number {
  const v = Number(new URLSearchParams(location.search).get('nivelMagia'));
  return v >= 1 && v <= 5 ? Math.floor(v) : 1;
}

export function loadoutFromDeck(deck: Deck): Loadout {
  return { god: deck.god, spells: [deck.spells[0], deck.spells[1]], units: [...deck.units], spellLevel: spellLevelFromUrl() };
}

/** Deck da IA: um dos decks sugeridos do deus. */
export function loadoutForGod(god: GodId): Loadout {
  const decks = godById(god)!.suggestedDecks;
  const deck = decks[Math.floor(Math.random() * decks.length)];
  return { god, spells: deck.spells, units: deck.units, spellLevel: spellLevelFromUrl() };
}

export function randomGod(): GodId {
  return GODS[Math.floor(Math.random() * GODS.length)].id;
}
