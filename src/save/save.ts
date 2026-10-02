import {
  BATTLE_RULES, CHEST_SLOTS, FREE_CHEST, GODS, STARTING_COLLECTION, chestById, godById, rarityById, spellById, unitById,
  type GodId,
} from '../data/content';
import type { Difficulty } from '../battle/Loadout';

/** Um deck salvo: deus, 2 magias e 8 tropas. */
export interface Deck {
  name: string;
  god: GodId;
  spells: string[];
  units: string[];
}

export interface UnitProgress {
  level: number;
  /** Cartas repetidas acumuladas para o próximo nível. */
  cards: number;
}

export interface SpellProgress {
  level: number;
  fragments: number;
}

export interface ChestSlot {
  type: string;
  /** Momento (ms) em que fica pronto; null = ainda não começou a abrir. */
  readyAt: number | null;
}

export interface Profile {
  gold: number;
  essence: number;
  trophies: number;
  bestTrophies: number;
  xp: number;
  /** Tropas que o jogador tem. */
  units: Record<string, UnitProgress>;
  /** Deuses liberados. */
  gods: Partial<Record<GodId, { level: number }>>;
  /** Nível e fragmentos das magias (a magia está liberada se o deus tiver o nível exigido). */
  spells: Record<string, SpellProgress>;
  chests: (ChestSlot | null)[];
  freeChests: number;
  freeChestNextAt: number;
  /** Batalhas do tutorial concluídas (0 a 4). */
  tutorial: number;
  stats: { wins: number; losses: number; draws: number };
}

export interface SaveData {
  version: 2;
  activeDeck: number;
  decks: Deck[];
  difficulty: Difficulty;
  profile: Profile;
}

const KEY = 'duelo-magico:save';
const DIFFICULTIES: Difficulty[] = ['facil', 'normal', 'dificil'];
const HOUR = 3600_000;

export function newProfile(now = Date.now()): Profile {
  const units: Record<string, UnitProgress> = {};
  for (const id of STARTING_COLLECTION.units) units[id] = { level: rarityById(unitById(id)!.rarity).startLevel, cards: 0 };
  return {
    gold: STARTING_COLLECTION.gold,
    essence: 0,
    trophies: 0,
    bestTrophies: 0,
    xp: 0,
    units,
    gods: { [STARTING_COLLECTION.god]: { level: 1 } },
    spells: {},
    chests: Array.from({ length: CHEST_SLOTS }, () => null),
    freeChests: 1,
    freeChestNextAt: now + FREE_CHEST.everyHours * HOUR,
    tutorial: 0,
    stats: { wins: 0, losses: 0, draws: 0 },
  };
}

/** Deck inicial (só comuns e Ignar), usado para decks novos ou inválidos. */
export function starterDeck(name = 'Fornalha Inicial'): Deck {
  const s = godById('ignar')!.suggestedDecks[0];
  return { name, god: 'ignar', spells: [...s.spells], units: [...s.units] };
}

export function defaultDecks(): Deck[] {
  return Array.from({ length: BATTLE_RULES.savedDecks }, (_, i) => starterDeck(i === 0 ? 'Fornalha Inicial' : `Deck ${i + 1}`));
}

export function isSpellUnlocked(p: Profile, spellId: string): boolean {
  const s = spellById(spellId);
  const god = s && p.gods[s.god];
  return !!s && !!god && god.level >= s.godLevel;
}

/** Remove o que não existe ou o jogador ainda não tem; corrige limites. */
export function sanitizeDeck(raw: Partial<Deck> | undefined, fallback: Deck, p: Profile): Deck {
  if (!raw || typeof raw !== 'object') return { ...fallback, spells: [...fallback.spells], units: [...fallback.units] };
  const god = godById(String(raw.god)) && p.gods[raw.god as GodId] ? (raw.god as GodId) : fallback.god;
  const godSpells = godById(god)!.spells;
  const spells = [...new Set((raw.spells ?? []).filter((id) => godSpells.includes(id) && isSpellUnlocked(p, id)))].slice(0, BATTLE_RULES.spellsPerMatch);
  const units = [...new Set((raw.units ?? []).filter((id) => !!unitById(id) && !!p.units[id]))].slice(0, BATTLE_RULES.deckSize);
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 24) : fallback.name;
  return { name, god, spells, units };
}

export function isDeckComplete(d: Deck): boolean {
  return d.units.length === BATTLE_RULES.deckSize && d.spells.length === BATTLE_RULES.spellsPerMatch;
}

function num(v: unknown, min: number, max = Number.MAX_SAFE_INTEGER, fallback = min): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.floor(v))) : fallback;
}

function sanitizeProfile(raw: Partial<Profile> | undefined): Profile {
  const p = newProfile();
  if (!raw || typeof raw !== 'object') return p;
  p.gold = num(raw.gold, 0, undefined, p.gold);
  p.essence = num(raw.essence, 0);
  p.trophies = num(raw.trophies, 0);
  p.bestTrophies = Math.max(p.trophies, num(raw.bestTrophies, 0));
  p.xp = num(raw.xp, 0);
  for (const [id, u] of Object.entries(raw.units ?? {})) {
    const def = unitById(id);
    if (def) p.units[id] = { level: num(u?.level, rarityById(def.rarity).startLevel, 10), cards: num(u?.cards, 0) };
  }
  for (const g of GODS) {
    const lvl = raw.gods?.[g.id]?.level;
    if (lvl !== undefined) p.gods[g.id] = { level: num(lvl, 1, 10) };
  }
  for (const [id, s] of Object.entries(raw.spells ?? {})) {
    if (spellById(id)) p.spells[id] = { level: num(s?.level, 1, 5), fragments: num(s?.fragments, 0) };
  }
  p.chests = Array.from({ length: CHEST_SLOTS }, (_, i) => {
    const c = raw.chests?.[i];
    return c && chestById(c.type) ? { type: c.type, readyAt: typeof c.readyAt === 'number' ? c.readyAt : null } : null;
  });
  p.freeChests = num(raw.freeChests, 0, FREE_CHEST.maxStored, p.freeChests);
  p.freeChestNextAt = num(raw.freeChestNextAt, 0, undefined, p.freeChestNextAt);
  p.tutorial = num(raw.tutorial, 0, 4);
  p.stats = { wins: num(raw.stats?.wins, 0), losses: num(raw.stats?.losses, 0), draws: num(raw.stats?.draws, 0) };
  return p;
}

function load(): SaveData {
  const profile = newProfile();
  const fresh: SaveData = { version: 2, activeDeck: 0, decks: defaultDecks(), difficulty: 'normal', profile };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as (Omit<Partial<SaveData>, 'version'> & { version?: number }) | null;
    if (!raw || (raw.version !== 1 && raw.version !== 2)) return fresh;
    // v1 não tinha perfil: começa do zero, mas aproveita os decks no que for válido.
    const p = raw.version === 2 ? sanitizeProfile(raw.profile) : profile;
    const decks = fresh.decks.map((fallback, i) => {
      const d = sanitizeDeck(raw.decks?.[i], fallback, p);
      // Na migração da v1, decks com tropas ainda não conquistadas voltam ao deck inicial.
      return raw.version === 1 && !isDeckComplete(d) ? starterDeck(d.name) : d;
    });
    const activeDeck = Number.isInteger(raw.activeDeck) && raw.activeDeck! >= 0 && raw.activeDeck! < decks.length ? raw.activeDeck! : 0;
    const difficulty = DIFFICULTIES.includes(raw.difficulty as Difficulty) ? (raw.difficulty as Difficulty) : 'normal';
    return { version: 2, activeDeck, decks, difficulty, profile: p };
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

export function getProfile(): Profile {
  return getSave().profile;
}

/** Altera o estado e grava no aparelho. */
export function updateSave<T = void>(change: (s: SaveData) => T): T {
  const s = getSave();
  const result = change(s);
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Sem armazenamento: o jogo continua funcionando, só não lembra entre sessões.
  }
  return result;
}

/** Apaga todo o progresso (usado em Ajustes e nos testes). */
export function resetSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignora */
  }
  current = null;
}

export function activeDeck(): Deck {
  const s = getSave();
  return s.decks[s.activeDeck];
}
