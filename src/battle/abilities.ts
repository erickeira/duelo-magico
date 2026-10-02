import { other } from '../config';
import { rarityById, unitById } from '../data/content';
import { scaledStats } from './Loadout';
import type { BattleApi } from './api';
import { Castle } from './Castle';
import type { Unit } from './Unit';

type Target = Unit | Castle;

/** Ganchos de habilidade por id de tropa (ver "Habilidade" nas fichas da wiki). */
export interface AbilityHooks {
  onSpawn?(u: Unit, api: BattleApi): void;
  onTick?(u: Unit, api: BattleApi, dt: number): void;
  /** Substitui o ataque normal quando retorna true. */
  onAttack?(u: Unit, target: Target, api: BattleApi): boolean;
  onHit?(u: Unit, target: Target, dealt: number, api: BattleApi): void;
  onKill?(u: Unit, victim: Unit, api: BattleApi): void;
  onDeath?(u: Unit, api: BattleApi): void;
  modifyDamage?(u: Unit, target: Target, damage: number, api: BattleApi): number;
}

/** Executa `fn` a cada `period` segundos usando um timer guardado na tropa. */
function every(u: Unit, key: string, dt: number, period: number, fn: () => void) {
  const t = ((u.ability[key] as number) ?? 0) + dt;
  if (t >= period) {
    u.ability[key] = t - period;
    fn();
  } else u.ability[key] = t;
}

/** Invoca `count` esqueletos na frente de `u`, tantos níveis acima do inicial quanto a tropa que invoca. */
function raiseSkeletons(u: Unit, api: BattleApi, count: number, ahead: number) {
  const def = unitById('esqueletos')!;
  const summoner = unitById(u.stats.id);
  const bonus = summoner ? u.level - rarityById(summoner.rarity).startLevel : 0;
  const level = rarityById(def.rarity).startLevel + Math.max(0, bonus);
  const stats = scaledStats(def, level);
  for (let i = 0; i < count; i++) {
    const dy = (i - (count - 1) / 2) * 22;
    const s = api.spawnUnit(u.team, stats, u.lane, u.x + u.dir * ahead, { summoned: true, level });
    s.y += dy;
  }
}

export const ABILITIES: Record<string, AbilityHooks> = {
  cleriga: {
    // Prece: cura 60 a cada 2s num raio de 90.
    onTick(u, api, dt) {
      every(u, 'prece', dt, 2, () => {
        for (const a of api.alliesInRadius(u.team, u.x, u.y, 90)) if (a.hp < a.maxHp) api.heal(a, 60);
        api.pulse(u.x, u.y, 90, 0x86efac, 0.25);
      });
    },
  },

  'grifo-real': {
    // Mergulho: dano dobrado no primeiro ataque contra cada alvo.
    modifyDamage(u, target, damage) {
      const hit = (u.ability.hit as Set<number | string>) ?? new Set();
      u.ability.hit = hit;
      const key = target instanceof Castle ? 'castelo' : target.uid;
      if (hit.has(key)) return damage;
      hit.add(key);
      return damage * 2;
    },
  },

  'campea-do-sol': {
    // Grito do Amanhecer: +25% dano e velocidade de ataque para a trilha por 8s.
    onSpawn(u, api) {
      for (const a of api.unitsInLane(u.team, u.lane)) {
        a.addBuff({ damagePct: 25, attackSpeedPct: 25, movePct: 0, until: api.now + 8 });
      }
      api.pulse(u.x, u.y, 140, 0xfacc15, 0.3);
    },
  },

  carnical: {
    // Banquete: cura 30% do dano causado.
    onHit(u, _t, dealt, api) {
      api.heal(u, dealt * 0.3);
    },
  },

  'bomba-ossos': {
    // Detonação: explode no primeiro alvo terrestre e morre.
    onAttack(u, target, api) {
      const at = target instanceof Castle ? target.aimPoint(u.y) : { x: target.x, y: target.y };
      const radius = u.stats.splash ?? 70;
      for (const e of api.enemiesInRadius(u.team, at.x, at.y, radius, false)) api.dealDamage(e, u.stats.damage * u.damageMult(api.now), u);
      const castle = api.castles[other(u.team)];
      if (target instanceof Castle || Math.abs(castle.front - at.x) <= radius) api.dealDamage(castle, u.stats.damage * u.damageMult(api.now), u);
      api.pulse(at.x, at.y, radius, 0xf97316, 0.6);
      u.hp = 0;
      u.alive = false;
      return true;
    },
  },

  necromante: {
    // Levantar Mortos: 2 esqueletos a cada 7s.
    onTick(u, api, dt) {
      every(u, 'mortos', dt, 7, () => raiseSkeletons(u, api, 2, 30));
    },
  },

  ceifador: {
    // Colheita: +10% de dano por abate (máx. +50%).
    onKill(u) {
      u.kills++;
    },
    modifyDamage(u, _t, damage) {
      return damage * (1 + Math.min(0.5, 0.1 * u.kills));
    },
  },

  'colosso-carne': {
    // Explosão Pútrida: vira 4 esqueletos ao morrer.
    onDeath(u, api) {
      raiseSkeletons(u, api, 4, 0);
    },
  },

  'dragao-osseo': {
    // Sopro Necrótico: alvo recebe 50% menos cura e escudo por 5s.
    onHit(_u, target, _d, api) {
      if (!(target instanceof Castle)) api.applyStatus(target, 'healReduction', 5);
    },
  },

  'elemental-agua': {
    // Correnteza: 20% de lentidão por 2s.
    onHit(_u, target, _d, api) {
      if (!(target instanceof Castle)) api.applyStatus(target, 'slow', 2, 20);
    },
  },

  fada: {
    // Pó Prismático: escudo de 120 no aliado mais ferido a cada 4s.
    onTick(u, api, dt) {
      every(u, 'po', dt, 4, () => {
        const hurt = api
          .alliesInRadius(u.team, u.x, u.y, u.stats.range + 20)
          .filter((a) => a !== u && a.hp < a.maxHp)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (hurt) api.addShield(hurt, 120, 8);
      });
    },
  },

  'torre-cristal': {
    // Feixe Concentrado: dano dobra a cada 2s no mesmo alvo (até 4x).
    modifyDamage(u, target, damage, api) {
      const key = target instanceof Castle ? 'castelo' : target.uid;
      const lastHit = (u.ability.lastHit as number) ?? -99;
      if (u.ability.beamTarget !== key || api.now - lastHit > 1.2) {
        u.ability.beamTarget = key;
        u.ability.beamStart = api.now;
      }
      u.ability.lastHit = api.now;
      const held = api.now - (u.ability.beamStart as number);
      return damage * (held >= 4 ? 4 : held >= 2 ? 2 : 1);
    },
  },

  arquimaga: {
    // Distorção do Tempo: inimigos da trilha 30% mais lentos (movimento e ataque) por 3s, a cada 8s.
    onTick(u, api, dt) {
      every(u, 'tempo', dt, 8, () => {
        const foes = api.unitsInLane(other(u.team), u.lane);
        if (!foes.length) {
          u.ability.tempo = 8; // tenta de novo assim que aparecer alguém
          return;
        }
        for (const e of foes) {
          api.applyStatus(e, 'slow', 3, 30);
          api.applyStatus(e, 'attackSlow', 3, 30);
        }
        api.pulse(u.x, u.y, 60, 0xc4b5fd, 0.5);
      });
    },
  },
};

/** Aura de Proteção do Paladino: aliados num raio de 100 recebem 20% menos dano. */
export function auraDamageMult(target: Unit, api: BattleApi): number {
  const guarded = api.units.some(
    (p) => p.alive && p.team === target.team && p.stats.id === 'paladino' && Math.hypot(p.x - target.x, p.y - target.y) <= 100,
  );
  return guarded ? 0.8 : 1;
}
