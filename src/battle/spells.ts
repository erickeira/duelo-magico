import { ARENA_BOTTOM, ARENA_LEFT, ARENA_RIGHT, ARENA_TOP, LANES_Y, LANE_HEIGHT, other, type Team } from '../config';
import { SPELL_GROWTH_PER_LEVEL, type SpellDef } from '../data/content';
import type { ArenaEffect, BattleApi } from './api';
import type { Unit, UnitStats } from './Unit';

export interface SpellTarget {
  x: number;
  y: number;
  lane: number;
  /** Tropa aliada escolhida (magias com alvo "aliado"). */
  unit?: Unit;
}

/** Valor de uma chave da magia no nível informado (+10% por nível nas chaves de `scaling`). */
function val(spell: SpellDef, key: string, level: number): number {
  const base = spell.stats[key] ?? 0;
  return spell.scaling.includes(key) ? base * (1 + SPELL_GROWTH_PER_LEVEL * (level - 1)) : base;
}

/** Aliado mais próximo do ponto (para magias com alvo "aliado"). */
export function pickAlly(api: BattleApi, team: Team, x: number, y: number, maxDist = 80): Unit | undefined {
  let best: Unit | undefined;
  let bestD = maxDist;
  for (const u of api.units) {
    if (!u.alive || u.team !== team) continue;
    const d = Math.hypot(u.x - x, u.y - y);
    if (d < bestD) {
      best = u;
      bestD = d;
    }
  }
  return best;
}

// ------------------------------------------------------------------ efeitos reutilizáveis

/** Área no chão que causa dano por segundo (e opcionalmente lentidão) a quem estiver dentro. */
function burningZone(
  api: BattleApi,
  opts: { team: Team; x: number; y: number; radius: number; duration: number; dps: number; slowPct?: number; strip?: boolean; color: number },
): ArenaEffect {
  const g = api.add.graphics().setDepth(4);
  const laneY = LANES_Y[api.laneAt(opts.y)];
  if (opts.strip) g.fillStyle(opts.color, 0.45).fillRect(opts.x - opts.radius / 2, laneY - LANE_HEIGHT / 2 + 10, opts.radius, LANE_HEIGHT - 20);
  else g.fillStyle(opts.color, 0.3).fillCircle(opts.x, opts.y, opts.radius);
  let left = opts.duration;
  let tick = 0;
  return {
    update(dt) {
      left -= dt;
      tick += dt;
      if (tick >= 0.5) {
        tick -= 0.5;
        const victims = opts.strip
          ? api.units.filter((u) => u.alive && u.team !== opts.team && u.lane === api.laneAt(opts.y) && Math.abs(u.x - opts.x) <= opts.radius / 2 + u.radius)
          : api.enemiesInRadius(opts.team, opts.x, opts.y, opts.radius, false);
        for (const u of victims) {
          api.dealDamage(u, opts.dps * 0.5);
          if (opts.slowPct) api.applyStatus(u, 'slow', 0.6, opts.slowPct);
        }
      }
      g.setAlpha(Math.min(1, left));
      return left > 0;
    },
    destroy: () => g.destroy(),
  };
}

/** Algo que atravessa a trilha do castelo de `team` até o castelo inimigo, atingindo cada inimigo uma vez. */
function laneRunner(
  api: BattleApi,
  opts: { team: Team; lane: number; speed: number; icon: string; hitsAir: boolean; onHit: (u: Unit) => void; onCastle?: () => void },
): ArenaEffect {
  const dir = opts.team === 'player' ? 1 : -1;
  const y = LANES_Y[opts.lane];
  const end = opts.team === 'player' ? ARENA_RIGHT : ARENA_LEFT;
  const sprite = api.add.text(opts.team === 'player' ? ARENA_LEFT : ARENA_RIGHT, y, opts.icon, { fontSize: '40px' }).setOrigin(0.5).setDepth(29);
  if (dir < 0) sprite.setFlipX(true);
  const hit = new Set<number>();
  return {
    update(dt) {
      sprite.x += dir * opts.speed * dt;
      for (const u of api.units) {
        if (!u.alive || u.team === opts.team || u.lane !== opts.lane || hit.has(u.uid)) continue;
        if (u.isFlying && !opts.hitsAir) continue;
        if (Math.abs(u.x - sprite.x) <= u.radius + 16) {
          hit.add(u.uid);
          opts.onHit(u);
        }
      }
      if ((sprite.x - end) * dir >= 0) {
        opts.onCastle?.();
        return false;
      }
      return true;
    },
    destroy: () => sprite.destroy(),
  };
}

function delayed(seconds: number, fn: () => void): ArenaEffect {
  let left = seconds;
  return {
    update(dt) {
      left -= dt;
      if (left <= 0) {
        fn();
        return false;
      }
      return true;
    },
    destroy() {},
  };
}

function summonStats(id: string, name: string, icon: string, s: Partial<UnitStats>): UnitStats {
  return {
    id, name, icon, roles: ['corpo-a-corpo'],
    hp: 100, damage: 10, attackInterval: 1, range: 12, speed: 45, radius: 15,
    ...s,
  };
}

function summonInLane(api: BattleApi, team: Team, lane: number, stats: UnitStats, count: number, duration: number, setup?: (u: Unit) => void) {
  const castle = api.castles[team];
  const dir = team === 'player' ? 1 : -1;
  for (let i = 0; i < count; i++) {
    const u = api.spawnUnit(team, stats, lane, castle.front + dir * (stats.radius + 10 + (i % 2) * 18), { summoned: true, duration });
    u.y += (i - (count - 1) / 2) * 20;
    setup?.(u);
  }
}

// ------------------------------------------------------------------ magias

type Caster = (api: BattleApi, team: Team, s: SpellDef, L: number, t: SpellTarget) => void;

const CASTERS: Record<string, Caster> = {
  // ---------------- Ignar
  'cometa-rubro'(api, team, s, L, t) {
    const r = (s.radius ?? 90) * (L >= 5 ? 1.25 : 1);
    for (const e of api.enemiesInRadius(team, t.x, t.y, r)) api.dealDamage(e, val(s, 'dano', L));
    const castle = api.castles[other(team)];
    if (Math.abs(castle.front - t.x) <= r) api.dealDamage(castle, val(s, 'danoCastelo', L));
    api.pulse(t.x, t.y, r, 0xf97316, 0.6);
    if (L >= 3) api.addEffect(burningZone(api, { team, x: t.x, y: t.y, radius: r, duration: 3, dps: 30, color: 0xea580c }));
  },
  'brado-guerra'(api, team, s, L, t) {
    const until = api.now + (L >= 5 ? 9 : s.stats.duracao);
    for (const a of api.unitsInLane(team, t.lane)) {
      a.addBuff({ damagePct: L >= 3 ? 20 : 0, attackSpeedPct: s.stats.velocidadeAtaquePct, movePct: s.stats.movimentoPct, until });
    }
    api.pulse((ARENA_LEFT + ARENA_RIGHT) / 2, LANES_Y[t.lane], 470, 0xf97316, 0.2);
  },
  'muralha-fogo'(api, team, s, L, t) {
    api.addEffect(burningZone(api, {
      team, x: t.x, y: t.y, radius: s.radius ?? 40, strip: true, color: 0xf97316,
      duration: L >= 5 ? 12 : s.stats.duracao, dps: val(s, 'danoPorSegundo', L), slowPct: L >= 3 ? 30 : 0,
    }));
  },
  'sopro-vulcao'(api, team, s, L, t) {
    const r = s.radius ?? 60;
    for (const e of api.enemiesInRadius(team, t.x, t.y, r)) {
      api.dealDamage(e, val(s, 'dano', L));
      api.knockback(e, s.stats.empurrao * (L >= 5 ? 2 : 1));
      if (L >= 3) api.applyStatus(e, 'stun', 1);
    }
    api.pulse(t.x, t.y, r, 0xdc2626, 0.7);
  },
  'juizo-cinzas'(api, team, s, L) {
    const meteor = (lane: number) => {
      const target = api.mostAdvanced(other(team), lane);
      if (!target) return;
      const { x, y } = target;
      const r = s.radius ?? 80;
      for (const e of api.enemiesInRadius(team, x, y, r)) api.dealDamage(e, val(s, 'dano', L));
      api.pulse(x, y, r, 0xf97316, 0.7);
      if (L >= 3) api.addEffect(burningZone(api, { team, x, y, radius: r, duration: 3, dps: 40, color: 0xea580c }));
    };
    for (let lane = 0; lane < LANES_Y.length; lane++) {
      meteor(lane);
      if (L >= 5) api.addEffect(delayed(1, () => meteor(lane)));
    }
  },

  // ---------------- Solenne
  'escudo-aurora'(api, team, s, L, t) {
    const r = (s.radius ?? 100) * (L >= 3 ? 1.3 : 1);
    const onBreak = L >= 5 ? (u: Unit) => api.heal(u, 100) : undefined;
    for (const a of api.alliesInRadius(team, t.x, t.y, r)) api.addShield(a, val(s, 'escudo', L), s.stats.duracao, onBreak);
    api.pulse(t.x, t.y, r, 0xfef3c7, 0.4);
  },
  'martelo-celeste'(api, team, s, L, t) {
    const r = s.radius ?? 50;
    const hit = api.enemiesInRadius(team, t.x, t.y, r);
    for (const e of hit) {
      api.dealDamage(e, val(s, 'dano', L));
      api.applyStatus(e, 'stun', L >= 3 ? 2.5 : s.stats.atordoamento);
    }
    if (L >= 5) {
      for (const e of api.enemiesInRadius(team, t.x, t.y, 100)) if (!hit.includes(e)) api.dealDamage(e, val(s, 'dano', L) * 0.5);
      api.pulse(t.x, t.y, 100, 0xfacc15, 0.25);
    }
    api.pulse(t.x, t.y, r, 0xfacc15, 0.7);
  },
  'bencao-luz'(api, team, s, L, t) {
    const r = s.radius ?? 120;
    const allies = api.alliesInRadius(team, t.x, t.y, r);
    for (const a of allies) {
      api.heal(a, val(s, 'cura', L));
      if (L >= 5) a.clearStatus('slow', 'attackSlow', 'freeze', 'stun', 'root', 'healReduction');
    }
    if (L >= 3) api.castles[team].heal(150);
    let left = s.stats.duracao;
    let tick = 0;
    api.addEffect({
      update(dt) {
        left -= dt;
        tick += dt;
        if (tick >= 1) {
          tick -= 1;
          for (const a of allies) if (a.alive) api.heal(a, val(s, 'regeneracao', L));
        }
        return left > 0;
      },
      destroy() {},
    });
    api.pulse(t.x, t.y, r, 0xf9a8d4, 0.4);
  },
  'falange-luz'(api, team, s, L, t) {
    const stats = summonStats('lanceiro-luz', 'Lanceiro de Luz', '🗡️', {
      hp: val(s, 'vida', L), damage: val(s, 'dano', L), attackInterval: 0.9, range: 35, speed: 50, radius: 15, targetsAir: L >= 5,
    });
    summonInLane(api, team, t.lane, stats, L >= 3 ? 4 : s.stats.soldados, s.stats.duracao, (u) => {
      if (L >= 5) u.damageTakenMult = 0.8;
    });
  },
  alvorada(api, team, s, L) {
    for (const a of api.units.filter((u) => u.alive && u.team === team)) {
      api.heal(a, (a.maxHp * s.stats.curaPct) / 100);
      a.addBuff({ damagePct: s.stats.danoPct, attackSpeedPct: 0, movePct: 0, until: api.now + s.stats.duracao });
      if (L >= 5) api.applyStatus(a, 'ccImmune', s.stats.duracao);
    }
    if (L >= 3) api.castles[team].heal(api.castles[team].maxHp * 0.05);
    api.pulse((ARENA_LEFT + ARENA_RIGHT) / 2, (ARENA_TOP + ARENA_BOTTOM) / 2, 520, 0xfde68a, 0.25);
  },

  // ---------------- Hyela
  'vento-gelido'(api, team, s, L, t) {
    for (const e of api.unitsInLane(other(team), t.lane)) {
      api.dealDamage(e, val(s, 'dano', L));
      api.applyStatus(e, 'slow', s.stats.duracao, L >= 3 ? 55 : s.stats.lentidaoPct);
      if (L >= 5) api.knockback(e, 40);
    }
    api.pulse((ARENA_LEFT + ARENA_RIGHT) / 2, LANES_Y[t.lane], 470, 0x7dd3fc, 0.25);
  },
  'lancas-gelo'(api, team, s, L, t) {
    const count = L >= 3 ? 4 : s.stats.lancas;
    for (let i = 0; i < count; i++) {
      api.addEffect(delayed(i * 0.35, () =>
        api.addEffect(laneRunner(api, {
          team, lane: t.lane, speed: 750, icon: '🧊', hitsAir: true,
          onHit: (u) => {
            api.dealDamage(u, val(s, 'dano', L));
            if (L >= 5) api.applyStatus(u, 'freeze', 0.5);
          },
        })),
      ));
    }
  },
  'prisao-cristal'(api, team, s, L, t) {
    const r = s.radius ?? 100;
    const dur = L >= 3 ? 4 : s.stats.congelamento;
    for (const e of api.enemiesInRadius(team, t.x, t.y, r)) {
      api.dealDamage(e, val(s, 'dano', L));
      api.applyStatus(e, 'freeze', dur);
      if (L >= 5) api.applyStatus(e, 'vulnerable', dur, 25);
    }
    api.pulse(t.x, t.y, r, 0x93c5fd, 0.6);
  },
  'coracao-glacial'(api, team, s, L, t) {
    const ally = t.unit;
    if (!ally || !ally.alive) return;
    const dur = L >= 5 ? 15 : s.stats.duracao;
    const onBreak =
      L >= 3
        ? (u: Unit) => {
            for (const e of api.enemiesInRadius(team, u.x, u.y, 80)) api.applyStatus(e, 'freeze', 1.5);
            api.pulse(u.x, u.y, 80, 0x93c5fd, 0.6);
          }
        : undefined;
    api.addShield(ally, val(s, 'vidaExtra', L), dur, onBreak);
    api.applyStatus(ally, 'chillArmor', dur, s.stats.lentidaoPct);
  },
  'era-gelo'(api, team, s, L) {
    const dur = L >= 3 ? 3.5 : s.stats.congelamento;
    for (const e of api.units.filter((u) => u.alive && u.team !== team)) {
      api.dealDamage(e, val(s, 'dano', L));
      api.applyStatus(e, 'freeze', dur);
      if (L >= 5 && e.isBuilding) api.dealDamage(e, e.maxHp * 0.3);
    }
    api.pulse((ARENA_LEFT + ARENA_RIGHT) / 2, (ARENA_TOP + ARENA_BOTTOM) / 2, 520, 0xbfdbfe, 0.3);
  },

  // ---------------- Thalor
  raizes(api, team, s, L, t) {
    const r = s.radius ?? 80;
    const dur = s.stats.prisao;
    const caught = api.enemiesInRadius(team, t.x, t.y, r, L >= 3);
    for (const e of caught) {
      api.dealDamage(e, val(s, 'dano', L));
      api.applyStatus(e, 'root', dur);
      if (L >= 3 && e.stats.flying) api.applyStatus(e, 'grounded', dur);
    }
    if (L >= 5) {
      let left = dur;
      let tick = 0;
      api.addEffect({
        update(dt) {
          left -= dt;
          tick += dt;
          if (tick >= 0.5) {
            tick -= 0.5;
            for (const e of caught) if (e.alive && e.has('root', api.now)) api.dealDamage(e, 20);
          }
          return left > 0;
        },
        destroy() {},
      });
    }
    api.pulse(t.x, t.y, r, 0x16a34a, 0.6);
  },
  'forca-selvagem'(api, _team, s, L, t) {
    const ally = t.unit;
    if (!ally || !ally.alive) return;
    const until = L >= 5 ? Number.POSITIVE_INFINITY : api.now + s.stats.duracao;
    ally.addBuff({ damagePct: s.stats.danoPct, attackSpeedPct: 0, movePct: 0, until, hpBonus: (ally.stats.hp * s.stats.vidaPct) / 100 });
    if (L >= 3) api.applyStatus(ally, 'steadfast', L >= 5 ? 1e9 : s.stats.duracao);
    ally.setScale(1.3);
    if (L < 5) api.addEffect(delayed(s.stats.duracao, () => ally.active && ally.setScale(1)));
  },
  revoada(api, team, s, L, t) {
    const stats = summonStats('corvo-espirito', 'Corvo-espírito', '🐦‍⬛', {
      roles: ['voador'], hp: val(s, 'vida', L), damage: val(s, 'dano', L), attackInterval: 0.9, range: 60, speed: 65, radius: 11,
      flying: true, targetsAir: true,
    });
    summonInLane(api, team, t.lane, stats, L >= 3 ? 6 : s.stats.corvos, s.stats.duracao, (u) => {
      if (L >= 5) api.applyStatus(u, 'slowingAttacks', 1e9);
    });
  },
  'investida-alce'(api, team, s, L, t) {
    const run = (lane: number) =>
      api.addEffect(laneRunner(api, {
        team, lane, speed: 520, icon: '🫎', hitsAir: false,
        onHit: (u) => {
          api.dealDamage(u, val(s, 'dano', L));
          api.knockback(u, s.stats.empurrao);
          if (L >= 3) api.applyStatus(u, 'stun', 1);
        },
        onCastle: () => api.dealDamage(api.castles[other(team)], val(s, 'danoCastelo', L)),
      }));
    run(t.lane);
    if (L >= 5) {
      const neighbors = [t.lane - 1, t.lane + 1].filter((l) => l >= 0 && l < LANES_Y.length);
      const busiest = neighbors.sort((a, b) => api.unitsInLane(other(team), b).length - api.unitsInLane(other(team), a).length)[0];
      if (busiest !== undefined) run(busiest);
    }
  },
  'chamado-ancestral'(api, team, s, L, t) {
    const stats = summonStats('guardiao-ancestral', 'Guardião Ancestral', '🌳', {
      roles: ['tanque'], hp: val(s, 'vida', L), damage: val(s, 'dano', L), attackInterval: 1.4, range: 16, speed: 28, radius: 30, splash: 50,
    });
    const castle = api.castles[team];
    const dir = team === 'player' ? 1 : -1;
    const g = api.spawnUnit(team, stats, t.lane, castle.front + dir * 40, {
      summoned: true,
      duration: s.stats.duracao,
      onExpire: L >= 5 ? (u) => { for (const a of api.unitsInLane(team, u.lane)) api.heal(a, 300); } : undefined,
    });
    if (L >= 3) api.applyStatus(g, 'taunt', s.stats.duracao);
  },
};

export function castSpell(api: BattleApi, team: Team, spell: SpellDef, level: number, target: SpellTarget): void {
  CASTERS[spell.id]?.(api, team, spell, level, target);
}

/** Uma magia com alvo "aliado" só pode ser lançada sobre uma tropa sua. */
export function needsAlly(spell: SpellDef) {
  return spell.target === 'aliado';
}
