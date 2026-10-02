import {
  FREE_CHEST, GODS, RARITIES, RARITY_WEIGHTS, UNITS, arenaForTrophies, chestById, rarityById, type Rarity, type UnitDef,
} from '../data/content';
import type { Profile, SaveData } from '../save/save';
import { addChest } from './progress';

const HOUR = 3600_000;

export interface ChestReward {
  chest: string;
  gold: number;
  essence: number;
  /** Cartas por tropa; `isNew` = a tropa acabou de entrar na coleção. */
  cards: { id: string; count: number; isNew: boolean }[];
  fragments: { id: string; count: number }[];
}

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const between = ([min, max]: [number, number]) => min + Math.floor(Math.random() * (max - min + 1));

/** Sorteia o conteúdo de um baú para a arena atual do jogador. */
export function rollChest(p: Profile, type: string): ChestReward {
  const def = chestById(type)!;
  const arena = arenaForTrophies(p.trophies);
  const pool = UNITS.filter((u) => u.arena <= arena);
  const byRarity = (r: Rarity) => pool.filter((u) => u.rarity === r);
  const available = RARITIES.map((r) => r.id).filter((r) => byRarity(r).length);

  const drawn: UnitDef[] = [];
  // Garantidos: se a raridade ainda não existe nesta arena, cai a melhor disponível.
  for (const r of RARITIES) {
    for (let i = 0; i < (def.guaranteed[r.id] ?? 0); i++) {
      const rarity = byRarity(r.id).length ? r.id : available[available.length - 1];
      drawn.push(pick(byRarity(rarity)));
    }
  }
  const total = available.reduce((s, r) => s + RARITY_WEIGHTS[r], 0);
  while (drawn.length < def.cards) {
    let roll = Math.random() * total;
    const rarity = available.find((r) => (roll -= RARITY_WEIGHTS[r]) < 0) ?? available[0];
    drawn.push(pick(byRarity(rarity)));
  }
  const counts = new Map<string, number>();
  for (const u of drawn) counts.set(u.id, (counts.get(u.id) ?? 0) + 1);
  const cards = [...counts].map(([id, count]) => ({ id, count, isNew: !p.units[id] })).sort((a, b) => b.count - a.count);

  // Fragmentos: magias dos deuses já liberados, em até 2 montes.
  const spellPool = GODS.filter((g) => p.gods[g.id]).flatMap((g) => g.spells);
  const fragments: { id: string; count: number }[] = [];
  if (spellPool.length && def.spellFragments > 0) {
    const first = Math.ceil(def.spellFragments / 2);
    fragments.push({ id: pick(spellPool), count: first });
    if (def.spellFragments - first > 0) fragments.push({ id: pick(spellPool), count: def.spellFragments - first });
  }

  return { chest: type, gold: between(def.gold), essence: def.essence, cards, fragments };
}

/** Soma a recompensa ao perfil. Tropas novas entram no nível inicial da raridade. */
export function grantChest(p: Profile, r: ChestReward) {
  p.gold += r.gold;
  p.essence += r.essence;
  for (const c of r.cards) {
    const owned = p.units[c.id];
    if (owned) owned.cards += c.count;
    else p.units[c.id] = { level: rarityById(UNITS.find((u) => u.id === c.id)!.rarity).startLevel, cards: c.count - 1 };
  }
  for (const f of r.fragments) {
    p.spells[f.id] ??= { level: 1, fragments: 0 };
    p.spells[f.id].fragments += f.count;
  }
}

// ------------------------------------------------------------ espaços de baú

export type SlotState = 'empty' | 'locked' | 'unlocking' | 'ready';

export function slotState(p: Profile, i: number, now = Date.now()): SlotState {
  const c = p.chests[i];
  if (!c) return 'empty';
  if (c.readyAt === null) return 'locked';
  return c.readyAt <= now ? 'ready' : 'unlocking';
}

/** Só um baú abre por vez. */
export function isUnlocking(p: Profile, now = Date.now()): boolean {
  return p.chests.some((_, i) => slotState(p, i, now) === 'unlocking');
}

export function startUnlock(s: SaveData, i: number, now = Date.now()): boolean {
  const p = s.profile;
  const c = p.chests[i];
  if (!c || c.readyAt !== null || isUnlocking(p, now)) return false;
  c.readyAt = now + chestById(c.type)!.unlockMinutes * 60_000;
  return true;
}

export function openChest(s: SaveData, i: number, now = Date.now()): ChestReward | null {
  const p = s.profile;
  if (slotState(p, i, now) !== 'ready') return null;
  const reward = rollChest(p, p.chests[i]!.type);
  grantChest(p, reward);
  p.chests[i] = null;
  return reward;
}

// ------------------------------------------------------------ baú grátis

/** Acumula baús grátis pelo tempo passado (até o máximo). */
export function tickFreeChests(p: Profile, now = Date.now()) {
  const period = FREE_CHEST.everyHours * HOUR;
  while (p.freeChests < FREE_CHEST.maxStored && now >= p.freeChestNextAt) {
    p.freeChests++;
    p.freeChestNextAt += period;
  }
  // Cheio: o relógio fica parado até o jogador pegar um.
  if (p.freeChests >= FREE_CHEST.maxStored && p.freeChestNextAt < now) p.freeChestNextAt = now;
}

export function claimFreeChest(s: SaveData, now = Date.now()): ChestReward | null {
  const p = s.profile;
  tickFreeChests(p, now);
  if (p.freeChests <= 0) return null;
  if (p.freeChests >= FREE_CHEST.maxStored) p.freeChestNextAt = now + FREE_CHEST.everyHours * HOUR;
  p.freeChests--;
  const reward = rollChest(p, FREE_CHEST.chest);
  grantChest(p, reward);
  return reward;
}

export { addChest };
