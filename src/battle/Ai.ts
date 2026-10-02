import Phaser from 'phaser';
import { ARENA_LEFT, ARENA_RIGHT, LANES_Y, MAX_MANA, MID_X, other, type Team } from '../config';
import type { SpellDef, UnitDef } from '../data/content';
import type { BattleScene } from '../scenes/BattleScene';
import type { Hand } from './Hand';
import type { Difficulty } from './Loadout';
import type { Unit } from './Unit';

interface Profile {
  reaction: [number, number];
  /** Mana mínima para iniciar um ataque. */
  attackMana: number;
  usesSpells: 'comuns' | 'todas';
  /** Escolhe a resposta pelo "forte contra" das tropas. */
  usesCounters: boolean;
  /** Multiplicador dos limites de valor das magias (maior = mais exigente). */
  spellBar: number;
}

const PROFILES: Record<Difficulty, Profile> = {
  facil: { reaction: [1.5, 2.5], attackMana: 9.5, usesSpells: 'comuns', usesCounters: false, spellBar: 1.6 },
  normal: { reaction: [0.5, 1.3], attackMana: 8.5, usesSpells: 'todas', usesCounters: false, spellBar: 1 },
  dificil: { reaction: [0.3, 0.8], attackMana: 7.5, usesSpells: 'todas', usesCounters: true, spellBar: 0.8 },
};

/**
 * Jogador controlado pelo computador. Usa as mesmas regras do jogador: mesma mana, mão,
 * zona de invocação e magias com recarga. Normalmente joga como 'enemy' (direita), mas
 * pode controlar qualquer lado — útil para simular IA × IA no balanceamento. Ver wiki/ia.md.
 */
export class Ai {
  private thinkIn = 1.5;
  private profile: Profile;

  constructor(private scene: BattleScene, private hand: Hand, difficulty: Difficulty, private team: Team = 'enemy') {
    this.profile = PROFILES[difficulty];
  }

  update(dt: number) {
    this.thinkIn -= dt;
    if (this.thinkIn > 0) return;
    const [min, max] = this.profile.reaction;
    this.thinkIn = min + Math.random() * (max - min);

    if (this.trySpells()) return;
    if (this.tryDefend()) return;
    this.tryAttack();
  }

  // ------------------------------------------------------------ leitura da arena

  private get foes(): Unit[] {
    return this.scene.units.filter((u) => u.alive && u.team === other(this.team));
  }

  private get mine(): Unit[] {
    return this.scene.units.filter((u) => u.alive && u.team === this.team);
  }

  /** 0 no castelo do adversário, 1 no castelo desta IA. */
  private progress(u: Unit) {
    const p = (u.x - ARENA_LEFT) / (ARENA_RIGHT - ARENA_LEFT);
    return this.team === 'enemy' ? p : 1 - p;
  }

  private laneThreat() {
    const threat = [0, 0, 0];
    const air = [false, false, false];
    const ids: string[][] = [[], [], []];
    for (const f of this.foes) {
      threat[f.lane] += f.hp * (0.5 + this.progress(f));
      if (f.isFlying) air[f.lane] = true;
      ids[f.lane].push(f.stats.id);
    }
    const defense = [0, 0, 0];
    for (const m of this.mine) defense[m.lane] += m.hp;
    return { threat, air, ids, defense };
  }

  private playable(): { card: UnitDef; index: number }[] {
    return this.hand.hand.map((card, index) => ({ card, index })).filter((p) => p.card.cost <= this.hand.mana);
  }

  // ------------------------------------------------------------ magias

  private trySpells(): boolean {
    const slots = this.scene.spells[this.team];
    for (let i = 0; i < slots.length; i++) {
      const def = slots[i].def;
      if (this.scene.spellRemaining(this.team, i) > 0) continue;
      if (this.profile.usesSpells === 'comuns' && def.rarity !== 'comum') continue;
      const spot = this.spellTarget(def);
      if (spot && this.scene.castSpellAt(this.team, i, spot.x, spot.y)) return true;
    }
    return false;
  }

  /** Decide onde lançar cada tipo de magia; null = não vale a pena agora. */
  private spellTarget(def: SpellDef): { x: number; y: number } | null {
    const bar = this.profile.spellBar;
    const foes = this.foes;
    const mine = this.mine;

    switch (def.id) {
      case 'cometa-rubro':
      case 'sopro-vulcao':
      case 'martelo-celeste':
        return this.bestCluster(foes, def.radius ?? 80, (us) => us.reduce((s, u) => s + Math.min(u.hp, def.stats.dano), 0), 420 * bar);
      case 'prisao-cristal':
      case 'raizes':
        return this.bestCluster(
          foes.filter((u) => this.progress(u) > 0.45),
          def.radius ?? 80,
          (us) => us.length * 150 + us.reduce((s, u) => s + u.hp, 0) * 0.1,
          500 * bar,
        );
      case 'vento-gelido':
      case 'lancas-gelo':
      case 'investida-alce': {
        const lane = this.bestLane(foes, (us) => us.reduce((s, u) => s + u.hp * (0.5 + this.progress(u)), 0));
        return lane && lane.value >= 900 * bar ? { x: MID_X, y: LANES_Y[lane.lane] } : null;
      }
      case 'brado-guerra': {
        const lane = this.bestLane(mine, (us) => (us.length >= 3 ? us.reduce((s, u) => s + (1 - this.progress(u)), 0) : 0));
        return lane && lane.value >= 1.2 * bar ? { x: MID_X, y: LANES_Y[lane.lane] } : null;
      }
      case 'falange-luz':
      case 'revoada':
      case 'chamado-ancestral': {
        const { threat } = this.laneThreat();
        const lane = threat.indexOf(Math.max(...threat));
        return threat[lane] >= 600 * bar ? { x: MID_X, y: LANES_Y[lane] } : null;
      }
      case 'forca-selvagem':
      case 'coracao-glacial': {
        const engaged = mine.filter((m) => foes.some((f) => f.lane === m.lane && Math.abs(f.x - m.x) < 160) && !m.isBuilding);
        const best = engaged.sort((a, b) => b.maxHp - a.maxHp)[0];
        return best && best.maxHp >= 500 * bar ? { x: best.x, y: best.y } : null;
      }
      case 'escudo-aurora':
      case 'bencao-luz':
        return this.bestCluster(
          mine.filter((m) => foes.some((f) => f.lane === m.lane && Math.abs(f.x - m.x) < 200)),
          def.radius ?? 100,
          (us) => (us.length >= 2 ? us.reduce((s, u) => s + (u.maxHp - u.hp) + 100, 0) : 0),
          450 * bar,
        );
      case 'juizo-cinzas':
      case 'era-gelo':
        return foes.length >= 5 * bar || foes.filter((f) => this.progress(f) > 0.5).length >= 3 * bar ? { x: MID_X, y: LANES_Y[1] } : null;
      case 'alvorada':
        return mine.length >= 5 * bar ? { x: MID_X, y: LANES_Y[1] } : null;
      default:
        return null;
    }
  }

  /** Centro (numa das tropas) que maximiza `value` dentro do raio. */
  private bestCluster(units: Unit[], radius: number, value: (us: Unit[]) => number, threshold: number) {
    let best: { x: number; y: number } | null = null;
    let bestValue = 0;
    for (const c of units) {
      const inside = units.filter((u) => Phaser.Math.Distance.Between(c.x, c.y, u.x, u.y) <= radius);
      const v = value(inside);
      if (v > bestValue) {
        bestValue = v;
        best = { x: c.x, y: c.y };
      }
    }
    return bestValue >= threshold ? best : null;
  }

  private bestLane(units: Unit[], value: (us: Unit[]) => number) {
    let best: { lane: number; value: number } | null = null;
    for (let lane = 0; lane < LANES_Y.length; lane++) {
      const v = value(units.filter((u) => u.lane === lane));
      if (!best || v > best.value) best = { lane, value: v };
    }
    return best;
  }

  // ------------------------------------------------------------ tropas

  private tryDefend(): boolean {
    const units = this.playable();
    if (!units.length) return false;
    const { threat, air, ids, defense } = this.laneThreat();
    const lane = threat.indexOf(Math.max(...threat));
    if (threat[lane] <= 0 || threat[lane] <= defense[lane] * 0.8) return false;

    let options = units;
    if (air[lane]) {
      const antiAir = units.filter((p) => p.card.targetsAir);
      if (antiAir.length) options = antiAir;
    }
    let pick: { card: UnitDef; index: number };
    if (this.profile.usesCounters) {
      const score = (c: UnitDef) => ids[lane].filter((id) => c.strongAgainst.includes(id)).length * 10 + c.cost;
      pick = options.reduce((a, b) => (score(b.card) > score(a.card) ? b : a));
    } else if (this.profile.attackMana > 9) {
      pick = options[Math.floor(Math.random() * options.length)];
    } else {
      pick = options.reduce((a, b) => (b.card.cost > a.card.cost ? b : a));
    }
    // Defende perto do próprio castelo, onde a torre ajuda.
    const home = this.team === 'enemy' ? ARENA_RIGHT - 40 : ARENA_LEFT + 40;
    return this.scene.playCard(this.team, pick.index, home, LANES_Y[lane]);
  }

  private tryAttack() {
    const units = this.playable().filter((p) => !p.card.roles.includes('construcao'));
    if (!units.length) return;
    const { threat, defense } = this.laneThreat();
    // No difícil, reforça um empurrão em andamento com mana sobrando.
    const pushing = defense.indexOf(Math.max(...defense));
    const reinforce = this.profile.usesCounters && defense[pushing] > 600 && this.hand.mana >= MAX_MANA - 3;
    if (this.hand.mana < this.profile.attackMana && !reinforce) return;

    const pick = units[Math.floor(Math.random() * units.length)];
    const weakest = threat.indexOf(Math.min(...threat));
    const lane = reinforce || (defense.some((d) => d > 0) && Math.random() < 0.5) ? pushing : weakest;
    // Ataca o mais à frente que a zona de invocação permitir.
    this.scene.playCard(this.team, pick.index, MID_X, LANES_Y[lane]);
  }
}
