import {
  ACCOUNT_XP_TO_LEVEL, ARENAS, CHESTS, GOD_ESSENCE_TO_LEVEL, GODS, MAX_ACCOUNT_LEVEL, MAX_GOD_LEVEL, MAX_SPELL_LEVEL,
  MAX_UNIT_LEVEL, SPELL_FRAGMENTS_TO_LEVEL, SPELL_GOLD_TO_LEVEL, UNIT_CARDS_TO_LEVEL, UNIT_GOLD_TO_LEVEL, UNIT_XP_FOR_LEVEL,
  TUTORIAL, VICTORY_REWARD, arenaForTrophies, castleHpAt, godById, spellById, unitById, type GodId,
} from '../data/content';
import { isSpellUnlocked, type Profile, type SaveData } from '../save/save';

export { isSpellUnlocked };

// ------------------------------------------------------------ conta

export function accountLevel(xp: number): number {
  let level = 1;
  for (let l = 2; l <= MAX_ACCOUNT_LEVEL; l++) if (xp >= ACCOUNT_XP_TO_LEVEL[l]) level = l;
  return level;
}

/** XP dentro do nível atual e quanto falta para o próximo (null no máximo). */
export function accountProgress(xp: number): { level: number; current: number; needed: number | null } {
  const level = accountLevel(xp);
  if (level >= MAX_ACCOUNT_LEVEL) return { level, current: xp, needed: null };
  const base = level === 1 ? 0 : ACCOUNT_XP_TO_LEVEL[level];
  return { level, current: xp - base, needed: ACCOUNT_XP_TO_LEVEL[level + 1] - base };
}

export function playerCastleHp(p: Profile, god: GodId): number {
  return castleHpAt(accountLevel(p.xp), p.gods[god]?.level ?? 1);
}

export function currentArena(p: Profile) {
  return ARENAS[arenaForTrophies(p.trophies)];
}

// ------------------------------------------------------------ tropas

export function unitLevel(p: Profile, id: string): number | null {
  return p.units[id]?.level ?? null;
}

export function unitUpgradeCost(p: Profile, id: string): { cards: number; gold: number; level: number } | null {
  const def = unitById(id);
  const owned = p.units[id];
  if (!def || !owned || owned.level >= MAX_UNIT_LEVEL) return null;
  const level = owned.level + 1;
  return { level, cards: UNIT_CARDS_TO_LEVEL[def.rarity][level], gold: UNIT_GOLD_TO_LEVEL[level] };
}

export function canUpgradeUnit(p: Profile, id: string): boolean {
  const c = unitUpgradeCost(p, id);
  return !!c && p.units[id].cards >= c.cards && p.gold >= c.gold;
}

/** Sobe a tropa um nível. Retorna o XP ganho (0 se não foi possível). */
export function upgradeUnit(s: SaveData, id: string): number {
  const p = s.profile;
  const c = unitUpgradeCost(p, id);
  if (!c || !canUpgradeUnit(p, id)) return 0;
  p.units[id].cards -= c.cards;
  p.gold -= c.gold;
  p.units[id].level = c.level;
  const xp = UNIT_XP_FOR_LEVEL[c.level];
  p.xp += xp;
  return xp;
}

// ------------------------------------------------------------ deuses e magias

export function godUpgradeCost(p: Profile, god: GodId): number | null {
  const g = p.gods[god];
  if (!g || g.level >= MAX_GOD_LEVEL) return null;
  return GOD_ESSENCE_TO_LEVEL[g.level + 1];
}

/** Sobe o deus. Retorna as magias liberadas por este nível. */
export function upgradeGod(s: SaveData, god: GodId): string[] {
  const p = s.profile;
  const cost = godUpgradeCost(p, god);
  if (cost === null || p.essence < cost) return [];
  p.essence -= cost;
  const level = ++p.gods[god]!.level;
  return godById(god)!.spells.filter((id) => spellById(id)!.godLevel === level);
}

export function spellLevel(p: Profile, id: string): number {
  return p.spells[id]?.level ?? 1;
}

export function spellUpgradeCost(p: Profile, id: string): { fragments: number; gold: number; level: number } | null {
  const level = spellLevel(p, id);
  if (!isSpellUnlocked(p, id) || level >= MAX_SPELL_LEVEL) return null;
  return { level: level + 1, fragments: SPELL_FRAGMENTS_TO_LEVEL[level + 1], gold: SPELL_GOLD_TO_LEVEL[level + 1] };
}

export function canUpgradeSpell(p: Profile, id: string): boolean {
  const c = spellUpgradeCost(p, id);
  return !!c && (p.spells[id]?.fragments ?? 0) >= c.fragments && p.gold >= c.gold;
}

export function upgradeSpell(s: SaveData, id: string): boolean {
  const p = s.profile;
  const c = spellUpgradeCost(p, id);
  if (!c || !canUpgradeSpell(p, id)) return false;
  p.spells[id] ??= { level: 1, fragments: 0 };
  p.spells[id].fragments -= c.fragments;
  p.gold -= c.gold;
  p.spells[id].level = c.level;
  return true;
}

/** Libera os deuses cujo requisito de troféus foi atingido. Retorna os novos. */
export function syncGodUnlocks(p: Profile): GodId[] {
  const unlocked: GodId[] = [];
  for (const g of GODS) {
    if (!p.gods[g.id] && p.bestTrophies >= g.unlockTrophies) {
      p.gods[g.id] = { level: 1 };
      unlocked.push(g.id);
    }
  }
  return unlocked;
}

// ------------------------------------------------------------ resultado de batalha

export type BattleOutcome = 'win' | 'lose' | 'draw';

export interface BattleRewards {
  trophies: number;
  gold: number;
  essence: number;
  /** Tipo do baú ganho (null se não ganhou ou os espaços estavam cheios). */
  chest: string | null;
  slotsFull: boolean;
  newArena: number | null;
  newGods: GodId[];
  tutorialStep: number | null;
}

function rollChestType(): string {
  let r = Math.random();
  for (const c of CHESTS) {
    if (r < c.dropChance) return c.id;
    r -= c.dropChance;
  }
  return CHESTS[0].id;
}

/** Coloca um baú no primeiro espaço livre. Retorna false se estiverem todos ocupados. */
export function addChest(p: Profile, type: string): boolean {
  const i = p.chests.findIndex((c) => !c);
  if (i < 0) return false;
  p.chests[i] = { type, readyAt: null };
  return true;
}

/** Aplica as recompensas de uma partida ao perfil. */
export function applyBattleResult(s: SaveData, outcome: BattleOutcome, tutorialStep: number | null): BattleRewards {
  const p = s.profile;
  const before = arenaForTrophies(p.trophies);
  const rewards: BattleRewards = { trophies: 0, gold: 0, essence: 0, chest: null, slotsFull: false, newArena: null, newGods: [], tutorialStep: null };

  if (tutorialStep !== null) {
    // Tutorial: sem troféus; cada vitória avança um passo e dá ouro. Ao concluir, ganha um baú de prata.
    if (outcome === 'win' && tutorialStep === p.tutorial) {
      p.tutorial++;
      rewards.tutorialStep = p.tutorial;
      rewards.gold = VICTORY_REWARD.goldBase;
      p.gold += rewards.gold;
      if (p.tutorial >= TUTORIAL.length) {
        if (addChest(p, 'prata')) rewards.chest = 'prata';
        else rewards.slotsFull = true;
      }
    }
    return rewards;
  }

  if (outcome === 'win') {
    p.stats.wins++;
    rewards.trophies = VICTORY_REWARD.trophiesWin;
    rewards.gold = VICTORY_REWARD.goldBase + VICTORY_REWARD.goldPerArena * before;
    rewards.essence = VICTORY_REWARD.essence;
    const type = rollChestType();
    if (addChest(p, type)) rewards.chest = type;
    else rewards.slotsFull = true;
  } else if (outcome === 'lose') {
    p.stats.losses++;
    // Nunca cai abaixo do piso da arena atual.
    const floor = ARENAS[before].trophies;
    rewards.trophies = Math.max(floor - p.trophies, VICTORY_REWARD.trophiesLoss);
  } else {
    p.stats.draws++;
    rewards.gold = VICTORY_REWARD.goldDraw;
  }

  p.trophies += rewards.trophies;
  p.bestTrophies = Math.max(p.bestTrophies, p.trophies);
  p.gold += rewards.gold;
  p.essence += rewards.essence;
  const after = arenaForTrophies(p.trophies);
  if (after > before) rewards.newArena = after;
  rewards.newGods = syncGodUnlocks(p);
  return rewards;
}
