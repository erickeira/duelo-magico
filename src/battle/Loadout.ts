import {
  CASTLE_BASE_HP, GODS, MAX_SPELL_LEVEL, MAX_UNIT_LEVEL, TUTORIAL, UNITS, godById, rarityById, spellById, unitById, unitStatAt,
  type GodId, type UnitDef,
} from '../data/content';
import { playerCastleHp, spellLevel } from '../meta/progress';
import type { Deck, Profile } from '../save/save';
import type { UnitStats } from './Unit';

/** O que um lado leva para a batalha: deus, magias, tropas, níveis e vida do castelo. */
export interface Loadout {
  god: GodId;
  spells: string[];
  spellLevels: number[];
  units: string[];
  unitLevels: Record<string, number>;
  castleHp: number;
}

export type Difficulty = 'facil' | 'normal' | 'dificil' | 'tutorial';

export interface BattleSettings {
  deck: Deck;
  difficulty: Difficulty;
  /** Índice da batalha do tutorial (0–3); ausente em batalhas normais. */
  tutorial?: number;
}

/** Nível das magias forçado pela URL (?nivelMagia=5), útil para testar evoluções. */
function spellLevelOverride(): number | null {
  const v = Number(new URLSearchParams(location.search).get('nivelMagia'));
  return v >= 1 && v <= MAX_SPELL_LEVEL ? Math.floor(v) : null;
}

const startLevel = (def: UnitDef) => rarityById(def.rarity).startLevel;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Atributos da tropa no nível informado (+8% de vida e dano por nível acima do inicial). */
export function scaledStats(def: UnitDef, level: number): UnitStats {
  const start = startLevel(def);
  return { ...def, hp: unitStatAt(def.hp, start, level), damage: unitStatAt(def.damage, start, level) };
}

/** Loadout do jogador a partir do deck e do progresso salvo. */
export function loadoutFromDeck(deck: Deck, p: Profile): Loadout {
  const override = spellLevelOverride();
  const unitLevels: Record<string, number> = {};
  for (const id of deck.units) unitLevels[id] = p.units[id]?.level ?? startLevel(unitById(id)!);
  return {
    god: deck.god,
    spells: [...deck.spells],
    spellLevels: deck.spells.map((id) => override ?? spellLevel(p, id)),
    units: [...deck.units],
    unitLevels,
    castleHp: playerCastleHp(p, deck.god),
  };
}

/** Quantos níveis, em média, as tropas do deck estão acima do nível inicial da raridade. */
function averageBonusLevels(l: Loadout): number {
  const bonus = l.units.map((id) => l.unitLevels[id] - startLevel(unitById(id)!));
  return bonus.length ? bonus.reduce((a, b) => a + b, 0) / bonus.length : 0;
}

/** Contexto do jogador usado para montar uma IA justa. */
export interface MatchContext {
  /** Arena atual: a IA só usa tropas liberadas até ela. */
  arena: number;
  /** Nível do deus do jogador: a IA só usa magias liberadas até ele. */
  godLevel: number;
}

/**
 * Deck da IA: um deck sugerido do deus, trocando as tropas que ainda não existem na arena do jogador
 * por outras permitidas e as magias ainda bloqueadas por comuns do mesmo deus. Níveis iguais aos do
 * jogador (±1 pela dificuldade).
 */
export function enemyLoadout(god: GodId, player: Loadout, difficulty: Difficulty, ctx: MatchContext): Loadout {
  const g = godById(god)!;
  const suggested = g.suggestedDecks[Math.floor(Math.random() * g.suggestedDecks.length)];
  const pool = UNITS.filter((u) => u.arena <= ctx.arena).map((u) => u.id);
  const units = suggested.units.filter((id) => pool.includes(id));
  const fillers = pool.filter((id) => !units.includes(id)).sort(() => Math.random() - 0.5);
  while (units.length < suggested.units.length && fillers.length) units.push(fillers.pop()!);
  const allowedSpells = g.spells.filter((id) => spellById(id)!.godLevel <= ctx.godLevel);
  const spells = suggested.spells.filter((id) => allowedSpells.includes(id));
  for (const id of allowedSpells) if (spells.length < suggested.spells.length && !spells.includes(id)) spells.push(id);
  const deck = { units, spells };
  const offset = difficulty === 'facil' ? -1 : difficulty === 'dificil' ? 1 : 0;
  const bonus = Math.round(averageBonusLevels(player)) + offset;
  const unitLevels: Record<string, number> = {};
  for (const id of deck.units) {
    const s = startLevel(unitById(id)!);
    unitLevels[id] = clamp(s + bonus, s, MAX_UNIT_LEVEL);
  }
  const avgSpell = player.spellLevels.length ? player.spellLevels.reduce((a, b) => a + b, 0) / player.spellLevels.length : 1;
  const spellLvl = clamp(Math.round(avgSpell) + offset, 1, MAX_SPELL_LEVEL);
  return {
    god,
    spells: [...deck.spells],
    spellLevels: deck.spells.map(() => spellLevelOverride() ?? spellLvl),
    units: [...deck.units],
    unitLevels,
    castleHp: player.castleHp,
  };
}

/** Loadouts fixos das batalhas do tutorial (tropas no nível inicial). */
export function tutorialLoadouts(step: number): { player: Loadout; enemy: Loadout } {
  const t = TUTORIAL[step];
  const levels = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, startLevel(unitById(id)!)]));
  return {
    player: { god: t.player.god, spells: [...t.player.spells], spellLevels: t.player.spells.map(() => 1), units: [...t.player.units], unitLevels: levels(t.player.units), castleHp: CASTLE_BASE_HP },
    enemy: { god: t.enemy.god, spells: [], spellLevels: [], units: [...t.enemy.units], unitLevels: levels(t.enemy.units), castleHp: t.enemyCastleHp },
  };
}

export function randomGod(): GodId {
  return GODS[Math.floor(Math.random() * GODS.length)].id;
}
