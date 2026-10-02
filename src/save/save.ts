import { BATTLE_RULES, GODS, godById, spellById, unitById, type GodId } from '../data/content';
import type { Difficulty } from '../battle/Loadout';

/** Um deck salvo: deus, 2 magias e 8 tropas. */
export interface Deck {
  name: string;
  god: GodId;
  spells: string[];
  units: string[];
}

export interface SaveData {
  version: 1;
  activeDeck: number;
  decks: Deck[];
  difficulty: Difficulty;
}

const KEY = 'duelo-magico:save';
const DIFFICULTIES: Difficulty[] = ['facil', 'normal', 'dificil'];

/** Os 5 decks iniciais: os decks sugeridos dos deuses, na ordem da wiki. */
export function defaultDecks(): Deck[] {
  const suggested = GODS.flatMap((g) => g.suggestedDecks.map((d) => ({ god: g.id, ...d })));
  return Array.from({ length: BATTLE_RULES.savedDecks }, (_, i) => {
    const d = suggested[i % suggested.length];
    return { name: d.name, god: d.god, spells: [...d.spells], units: [...d.units] };
  });
}

function defaultSave(): SaveData {
  return { version: 1, activeDeck: 0, decks: defaultDecks(), difficulty: 'normal' };
}

/** Remove ids inválidos e corrige o que não bate com as regras (magias do deus, tropas únicas, limites). */
export function sanitizeDeck(raw: Partial<Deck> | undefined, fallback: Deck): Deck {
  if (!raw || typeof raw !== 'object') return { ...fallback, spells: [...fallback.spells], units: [...fallback.units] };
  const god = godById(String(raw.god)) ? (raw.god as GodId) : fallback.god;
  const godSpells = godById(god)!.spells;
  const spells = [...new Set((raw.spells ?? []).filter((id) => godSpells.includes(id) && spellById(id)))].slice(0, BATTLE_RULES.spellsPerMatch);
  const units = [...new Set((raw.units ?? []).filter((id) => !!unitById(id)))].slice(0, BATTLE_RULES.deckSize);
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 24) : fallback.name;
  return { name, god, spells, units };
}

export function isDeckComplete(d: Deck): boolean {
  return d.units.length === BATTLE_RULES.deckSize && d.spells.length === BATTLE_RULES.spellsPerMatch;
}

function load(): SaveData {
  const fresh = defaultSave();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<SaveData> | null;
    if (!raw || raw.version !== 1) return fresh;
    const decks = fresh.decks.map((fallback, i) => sanitizeDeck(raw.decks?.[i], fallback));
    const activeDeck = Number.isInteger(raw.activeDeck) && raw.activeDeck! >= 0 && raw.activeDeck! < decks.length ? raw.activeDeck! : 0;
    const difficulty = DIFFICULTIES.includes(raw.difficulty as Difficulty) ? (raw.difficulty as Difficulty) : 'normal';
    return { version: 1, activeDeck, decks, difficulty };
  } catch {
    return fresh; // localStorage indisponível (aba anônima, bloqueio) ou JSON corrompido
  }
}

let current: SaveData | null = null;

/** Estado salvo atual (carregado na primeira chamada). */
export function getSave(): SaveData {
  current ??= load();
  return current;
}

/** Altera o estado e grava no aparelho. */
export function updateSave(change: (s: SaveData) => void): SaveData {
  const s = getSave();
  change(s);
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Sem armazenamento: o jogo continua funcionando, só não lembra entre sessões.
  }
  return s;
}

export function activeDeck(): Deck {
  const s = getSave();
  return s.decks[s.activeDeck];
}
