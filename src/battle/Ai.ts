import Phaser from 'phaser';
import { ARENA_LEFT, ARENA_RIGHT, LANES_Y, MID_X } from '../config';
import { SpellCard, UnitCard } from '../data/cards';
import type { BattleScene } from '../scenes/BattleScene';
import { Hand } from './Hand';

/**
 * Oponente simples: usa feitiços em grupos de tropas, defende a trilha mais
 * ameaçada e ataca quando acumula mana.
 */
export class Ai {
  private thinkIn = 1.5;

  constructor(private scene: BattleScene, private hand: Hand) {}

  update(dt: number) {
    this.thinkIn -= dt;
    if (this.thinkIn > 0) return;
    this.thinkIn = 0.5 + Math.random() * 0.8;

    const playable = this.hand.hand
      .map((card, index) => ({ card, index }))
      .filter((p) => p.card.cost <= this.hand.mana);
    if (!playable.length) return;

    const foes = this.scene.units.filter((u) => u.alive && u.team === 'player');
    const mine = this.scene.units.filter((u) => u.alive && u.team === 'enemy');

    // 1) Feitiço no melhor agrupamento de inimigos.
    for (const { card, index } of playable) {
      if (card.kind !== 'spell') continue;
      const spot = this.bestSpellSpot(card, foes);
      if (spot) {
        this.scene.playCard('enemy', index, spot.x, spot.y);
        return;
      }
    }

    const units = playable.filter((p): p is { card: UnitCard; index: number } => p.card.kind === 'unit');
    if (!units.length) return;

    // 2) Defender: ameaça cresce conforme a tropa se aproxima do castelo da IA.
    const threat = [0, 0, 0];
    const air = [false, false, false];
    for (const f of foes) {
      const progress = (f.x - ARENA_LEFT) / (ARENA_RIGHT - ARENA_LEFT);
      threat[f.lane] += f.hp * (0.5 + progress);
      if (f.flying) air[f.lane] = true;
    }
    const defense = [0, 0, 0];
    for (const m of mine) defense[m.lane] += m.hp;

    const lane = threat.indexOf(Math.max(...threat));
    if (threat[lane] > 0 && threat[lane] > defense[lane] * 0.8) {
      let options = units;
      if (air[lane]) {
        const antiAir = units.filter((p) => p.card.unit.targetsAir);
        if (antiAir.length) options = antiAir;
      }
      const pick = options.reduce((a, b) => (b.card.cost > a.card.cost ? b : a));
      this.scene.playCard('enemy', pick.index, ARENA_RIGHT, LANES_Y[lane]);
      return;
    }

    // 3) Atacar quando a mana está quase cheia.
    if (this.hand.mana >= 8.5) {
      const pick = units[Math.floor(Math.random() * units.length)];
      const weakest = threat.indexOf(Math.min(...threat));
      const attackLane = defense.some((d) => d > 0) && Math.random() < 0.5 ? defense.indexOf(Math.max(...defense)) : weakest;
      this.scene.playCard('enemy', pick.index, ARENA_RIGHT, LANES_Y[attackLane]);
    }
  }

  private bestSpellSpot(card: SpellCard, foes: BattleScene['units']) {
    let best: { x: number; y: number } | null = null;
    let bestValue = 0;
    for (const center of foes) {
      let hp = 0;
      let count = 0;
      for (const f of foes) {
        if (Phaser.Math.Distance.Between(center.x, center.y, f.x, f.y) <= card.radius) {
          hp += Math.min(f.hp, card.damage);
          count++;
        }
      }
      // Congelar só vale a pena quando as tropas já estão no lado da IA (direita).
      const value = card.freeze ? (center.x > MID_X - 80 ? count : 0) : hp;
      if (value > bestValue) {
        bestValue = value;
        best = { x: center.x, y: center.y };
      }
    }
    const enough = card.freeze ? bestValue >= 3 : bestValue >= 450;
    return enough ? best : null;
  }
}
