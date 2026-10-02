import Phaser from 'phaser';
import {
  ARENA_BOTTOM, ARENA_LEFT, ARENA_RIGHT, ARENA_TOP, CARD_AREA_Y, CASTLE_ATTACK_INTERVAL, CASTLE_DAMAGE, CASTLE_RANGE,
  COLORS, DOUBLE_MANA_AT, H, HAND_SIZE, HUD_HEIGHT, LANES_Y, LANE_HEIGHT, MANA_PER_SEC, MATCH_TIME, MAX_MANA, MID_X, W,
} from '../config';
import { Card, DEFAULT_DECK, SpellCard, Team, UnitCard } from '../data/cards';
import { Ai } from '../battle/Ai';
import { CARD_W, CardView } from '../battle/CardView';
import { Castle } from '../battle/Castle';
import { Hand } from '../battle/Hand';
import { Damageable, Unit } from '../battle/Unit';

interface Projectile {
  obj: Phaser.GameObjects.Arc;
  target: Damageable;
  aim: { x: number; y: number };
  team: Team;
  damage: number;
  splash: number;
  hitsAir: boolean;
}

export type BattleResult = 'win' | 'lose' | 'draw';

const other = (t: Team): Team => (t === 'player' ? 'enemy' : 'player');
const PROJECTILE_SPEED = 650;

export class BattleScene extends Phaser.Scene {
  units: Unit[] = [];
  private projectiles: Projectile[] = [];
  private castles!: Record<Team, Castle>;
  private hands!: Record<Team, Hand>;
  private ai!: Ai;
  private timeLeft = MATCH_TIME;
  private over = false;

  // UI
  private selected: number | null = null;
  private dragging = false;
  private cardViews: CardView[] = [];
  private nextView!: CardView;
  private manaBar!: Phaser.GameObjects.Graphics;
  private manaText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private doubleText!: Phaser.GameObjects.Text;
  private preview!: Phaser.GameObjects.Graphics;
  private ghost!: Phaser.GameObjects.Text;

  constructor() {
    super('Battle');
  }

  init() {
    this.units = [];
    this.projectiles = [];
    this.timeLeft = MATCH_TIME;
    this.over = false;
    this.selected = null;
    this.dragging = false;
    this.cardViews = [];
  }

  create() {
    this.drawArena();
    this.castles = { player: new Castle(this, 'player'), enemy: new Castle(this, 'enemy') };
    this.hands = { player: new Hand(DEFAULT_DECK), enemy: new Hand(DEFAULT_DECK) };
    this.ai = new Ai(this, this.hands.enemy);
    this.createHud();
    this.setupInput();
  }

  update(_time: number, deltaMs: number) {
    if (this.over) return;
    const dt = Math.min(deltaMs / 1000, 0.05);

    this.timeLeft -= dt;
    const rate = MANA_PER_SEC * (this.timeLeft <= DOUBLE_MANA_AT ? 2 : 1);
    this.hands.player.update(dt, rate);
    this.hands.enemy.update(dt, rate);
    this.ai.update(dt);

    for (const u of this.units) if (u.alive) this.updateUnit(u, dt);
    this.updateCastle(this.castles.player, dt);
    this.updateCastle(this.castles.enemy, dt);
    this.updateProjectiles(dt);
    this.removeDead();

    this.refreshHud();
    this.checkEnd();
  }

  // ---------------------------------------------------------------- jogadas

  /** Usa a carta `index` da mão de `team`. Para tropas, só o y (trilha) importa. */
  playCard(team: Team, index: number, x: number, y: number): boolean {
    const hand = this.hands[team];
    if (this.over || !hand.canPlay(index)) return false;
    const card = hand.play(index);
    if (card.kind === 'unit') this.spawnUnits(team, card, this.laneAt(y));
    else this.castSpell(team, card, Phaser.Math.Clamp(x, ARENA_LEFT, ARENA_RIGHT), Phaser.Math.Clamp(y, ARENA_TOP, ARENA_BOTTOM));
    return true;
  }

  laneAt(y: number): number {
    let best = 0;
    LANES_Y.forEach((ly, i) => {
      if (Math.abs(ly - y) < Math.abs(LANES_Y[best] - y)) best = i;
    });
    return best;
  }

  private spawnUnits(team: Team, card: UnitCard, lane: number) {
    const castle = this.castles[team];
    const dir = team === 'player' ? 1 : -1;
    for (let i = 0; i < card.count; i++) {
      const spread = card.count > 1 ? (i - (card.count - 1) / 2) * 30 : 0;
      const x = castle.front + dir * (card.unit.radius + 6 + (i % 2) * 14);
      this.units.push(new Unit(this, team, card.unit, x, LANES_Y[lane] + spread, lane));
    }
  }

  private castSpell(team: Team, card: SpellCard, x: number, y: number) {
    const color = card.freeze ? 0x93c5fd : 0xf97316;
    const blast = this.add.circle(x, y, card.radius, color, 0.5).setDepth(30).setScale(0.3);
    const icon = this.add.text(x, y, card.icon, { fontSize: '48px' }).setOrigin(0.5).setDepth(31);
    this.tweens.add({ targets: blast, scale: 1, alpha: 0, duration: 450, onComplete: () => blast.destroy() });
    this.tweens.add({ targets: icon, alpha: 0, y: y - 30, duration: 600, onComplete: () => icon.destroy() });

    for (const u of this.units) {
      if (!u.alive || u.team === team) continue;
      if (Phaser.Math.Distance.Between(x, y, u.x, u.y) > card.radius + u.radius) continue;
      u.takeDamage(card.damage);
      if (card.freeze) u.frozen = card.freeze;
    }
    const castle = this.castles[other(team)];
    if (Math.abs(x - castle.front) <= card.radius) castle.takeDamage(card.damage * card.castleDamagePct);
  }

  // ---------------------------------------------------------------- simulação

  private updateUnit(u: Unit, dt: number) {
    if (u.frozen > 0) {
      u.frozen -= dt;
      u.setFrozenLook(u.frozen > 0);
      return;
    }
    u.cooldown -= dt;
    const target = this.findTarget(u);
    if (target) {
      if (u.cooldown <= 0) {
        u.cooldown = u.stats.attackInterval;
        this.attack(u, target);
      }
      return;
    }
    u.x += u.dir * u.stats.speed * dt;
    const enemyFront = this.castles[other(u.team)].front;
    u.x = u.dir > 0 ? Math.min(u.x, enemyFront - u.radius) : Math.max(u.x, enemyFront + u.radius);
  }

  /** Inimigo mais próximo à frente na mesma trilha; senão o castelo, se estiver no alcance. */
  private findTarget(u: Unit): Damageable | null {
    let best: Unit | null = null;
    let bestDist = Infinity;
    for (const e of this.units) {
      if (!e.alive || e.team === u.team || e.lane !== u.lane || !u.canHit(e)) continue;
      const ahead = (e.x - u.x) * u.dir;
      if (ahead < -(e.radius + u.radius)) continue;
      const dist = Math.abs(e.x - u.x) - e.radius - u.radius;
      if (dist <= u.stats.range && dist < bestDist) {
        best = e;
        bestDist = dist;
      }
    }
    if (best) return best;
    const castle = this.castles[other(u.team)];
    return Math.abs(castle.front - u.x) - u.radius <= u.stats.range ? castle : null;
  }

  private attack(u: Unit, target: Damageable) {
    const from = u.aimPoint();
    if (u.stats.range >= 60) {
      this.fire(u.team, from, target, u.stats.damage, u.stats.splash ?? 0, !!u.stats.targetsAir, 0xfde68a);
    } else {
      u.lunge();
      this.hit(u.team, target, target.aimPoint(u.y), u.stats.damage, u.stats.splash ?? 0, !!u.stats.targetsAir);
    }
  }

  private updateCastle(castle: Castle, dt: number) {
    castle.cooldown -= dt;
    if (castle.cooldown > 0) return;
    let best: Unit | null = null;
    let bestDist = CASTLE_RANGE;
    for (const u of this.units) {
      if (!u.alive || u.team === castle.team) continue;
      const d = Math.abs(u.x - castle.front);
      if (d <= bestDist) {
        best = u;
        bestDist = d;
      }
    }
    if (!best) return;
    castle.cooldown = CASTLE_ATTACK_INTERVAL;
    const from = { x: castle.front, y: best.y };
    this.fire(castle.team, from, best, CASTLE_DAMAGE, 0, true, castle.team === 'player' ? 0x93c5fd : 0xfca5a5);
  }

  private fire(team: Team, from: { x: number; y: number }, target: Damageable, damage: number, splash: number, hitsAir: boolean, color: number) {
    const obj = this.add.circle(from.x, from.y, splash ? 7 : 5, color).setDepth(25);
    this.projectiles.push({ obj, target, aim: target.aimPoint(from.y), team, damage, splash, hitsAir });
  }

  private updateProjectiles(dt: number) {
    for (const p of this.projectiles) {
      if (p.target.alive) p.aim = p.target.aimPoint(p.obj.y);
      const dx = p.aim.x - p.obj.x;
      const dy = p.aim.y - p.obj.y;
      const dist = Math.hypot(dx, dy);
      const step = PROJECTILE_SPEED * dt;
      if (dist <= step) {
        this.hit(p.team, p.target, p.aim, p.damage, p.splash, p.hitsAir);
        p.obj.destroy();
      } else {
        p.obj.x += (dx / dist) * step;
        p.obj.y += (dy / dist) * step;
      }
    }
    this.projectiles = this.projectiles.filter((p) => p.obj.active);
  }

  private hit(team: Team, target: Damageable, at: { x: number; y: number }, damage: number, splash: number, hitsAir: boolean) {
    if (target.alive) target.takeDamage(damage);
    if (!splash) return;
    const ring = this.add.circle(at.x, at.y, splash, 0xfde68a, 0.35).setDepth(26);
    this.tweens.add({ targets: ring, alpha: 0, duration: 250, onComplete: () => ring.destroy() });
    for (const u of this.units) {
      if (u === target || !u.alive || u.team === team || (u.flying && !hitsAir)) continue;
      if (Phaser.Math.Distance.Between(at.x, at.y, u.x, u.y) <= splash + u.radius) u.takeDamage(damage);
    }
  }

  private removeDead() {
    for (const u of this.units) {
      if (u.alive) continue;
      const puff = this.add.circle(u.x, u.y, u.radius, 0xffffff, 0.6).setDepth(15);
      this.tweens.add({ targets: puff, scale: 1.8, alpha: 0, duration: 250, onComplete: () => puff.destroy() });
      u.destroy();
    }
    this.units = this.units.filter((u) => u.alive);
  }

  private checkEnd() {
    const { player, enemy } = this.castles;
    let result: BattleResult | null = null;
    if (!enemy.alive) result = 'win';
    else if (!player.alive) result = 'lose';
    else if (this.timeLeft <= 0) {
      result = player.hp > enemy.hp ? 'win' : player.hp < enemy.hp ? 'lose' : 'draw';
    }
    if (!result) return;
    this.over = true;
    this.time.delayedCall(1200, () =>
      this.scene.start('Result', { result, playerHp: Math.ceil(player.hp), enemyHp: Math.ceil(enemy.hp) }),
    );
  }

  // ---------------------------------------------------------------- visual / HUD

  private drawArena() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b1020);
    this.add.rectangle(W / 2, (ARENA_TOP + ARENA_BOTTOM) / 2, W, ARENA_BOTTOM - ARENA_TOP, COLORS.grass);
    const g = this.add.graphics();
    for (const y of LANES_Y) {
      g.fillStyle(COLORS.lane, 0.55).fillRect(ARENA_LEFT, y - LANE_HEIGHT / 2 + 25, ARENA_RIGHT - ARENA_LEFT, LANE_HEIGHT - 50);
    }
    g.lineStyle(3, 0xffffff, 0.25);
    for (let y = ARENA_TOP + 10; y < ARENA_BOTTOM; y += 30) g.lineBetween(MID_X, y, MID_X, y + 15);
    this.preview = this.add.graphics().setDepth(40);
  }

  private createHud() {
    this.add.rectangle(W / 2, HUD_HEIGHT / 2, W, HUD_HEIGHT, COLORS.ui).setDepth(60);
    this.add.text(20, HUD_HEIGHT / 2, 'VOCÊ', { fontSize: '18px', fontStyle: 'bold', color: '#60a5fa' })
      .setOrigin(0, 0.5).setDepth(61);
    this.add.text(W - 20, HUD_HEIGHT / 2, 'IA', { fontSize: '18px', fontStyle: 'bold', color: '#f87171' })
      .setOrigin(1, 0.5).setDepth(61);
    this.timerText = this.add
      .text(W / 2, HUD_HEIGHT / 2 - 6, '', { fontSize: '30px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5).setDepth(61);
    this.doubleText = this.add
      .text(W / 2, HUD_HEIGHT - 8, 'MANA x2', { fontSize: '14px', fontStyle: 'bold', color: '#c084fc' })
      .setOrigin(0.5).setDepth(61).setVisible(false);

    this.add.rectangle(W / 2, (CARD_AREA_Y + H) / 2, W, H - CARD_AREA_Y, COLORS.ui).setDepth(45);
    this.manaBar = this.add.graphics().setDepth(50);
    this.manaText = this.add
      .text(W - 300, CARD_AREA_Y + 24, '', { fontSize: '22px', fontStyle: 'bold', color: '#e9d5ff' })
      .setOrigin(0, 0.5).setDepth(51);

    const cardY = CARD_AREA_Y + 100;
    const firstX = W / 2 - 1.5 * (CARD_W + 14);
    for (let i = 0; i < HAND_SIZE; i++) {
      const view = new CardView(this, firstX + i * (CARD_W + 14), cardY);
      view.setInteractive({ useHandCursor: true });
      view.on('pointerdown', () => this.selectCard(i));
      this.cardViews.push(view);
    }
    const nextX = firstX - CARD_W - 40;
    this.nextView = new CardView(this, nextX, cardY + 12, true);
    this.add.text(nextX, cardY - 52, 'Próxima', { fontSize: '16px', color: '#9ca3af' }).setOrigin(0.5).setDepth(51);

    this.ghost = this.add.text(0, 0, '', { fontSize: '56px' }).setOrigin(0.5).setDepth(70).setAlpha(0.8).setVisible(false);
    this.refreshHud();
  }

  private refreshHud() {
    const hand = this.hands.player;
    const t = Math.max(0, Math.ceil(this.timeLeft));
    this.timerText.setText(`${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`);
    this.doubleText.setVisible(this.timeLeft <= DOUBLE_MANA_AT);

    const x0 = 300;
    const w = W - 620;
    const y = CARD_AREA_Y + 14;
    this.manaBar.clear();
    this.manaBar.fillStyle(0x000000, 0.6).fillRoundedRect(x0, y, w, 20, 8);
    this.manaBar.fillStyle(COLORS.mana).fillRoundedRect(x0, y, Math.max(1, (w * hand.mana) / MAX_MANA), 20, 8);
    this.manaBar.lineStyle(2, 0x0b1020);
    for (let i = 1; i < MAX_MANA; i++) this.manaBar.lineBetween(x0 + (w * i) / MAX_MANA, y, x0 + (w * i) / MAX_MANA, y + 20);
    this.manaText.setX(x0 + w + 12).setText(String(Math.floor(hand.mana)));

    hand.hand.forEach((card, i) => {
      const view = this.cardViews[i];
      view.setCard(card);
      view.setPlayable(hand.canPlay(i));
      view.setSelected(this.selected === i);
    });
    this.nextView.setCard(hand.next);
  }

  // ---------------------------------------------------------------- input

  private setupInput() {
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.dragging && p.isDown) this.ghost.setPosition(p.x, p.y).setVisible(p.y < CARD_AREA_Y);
      this.drawPreview(p);
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      const wasDragging = this.dragging;
      this.dragging = false;
      this.ghost.setVisible(false);
      if (wasDragging && this.inArena(p)) this.tryPlay(p);
      this.drawPreview(p);
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (!over.length && this.selected !== null && this.inArena(p)) this.tryPlay(p);
    });
  }

  private selectCard(i: number) {
    this.selected = i;
    this.dragging = true;
    this.ghost.setText(this.hands.player.hand[i].icon);
    this.refreshHud();
  }

  private inArena(p: Phaser.Input.Pointer) {
    return p.y > HUD_HEIGHT && p.y < CARD_AREA_Y;
  }

  private tryPlay(p: Phaser.Input.Pointer) {
    if (this.selected === null) return;
    // Feitiços podem ir em qualquer ponto; tropas sempre saem do castelo na trilha escolhida.
    if (this.playCard('player', this.selected, p.x, p.y)) {
      this.selected = null;
      this.refreshHud();
    } else {
      this.flashNoMana();
    }
  }

  private flashNoMana() {
    const txt = this.add
      .text(W / 2, CARD_AREA_Y - 30, 'Mana insuficiente', { fontSize: '26px', fontStyle: 'bold', color: '#e9d5ff' })
      .setOrigin(0.5).setDepth(80);
    this.tweens.add({ targets: txt, alpha: 0, y: '-=30', duration: 700, onComplete: () => txt.destroy() });
  }

  private drawPreview(p: Phaser.Input.Pointer) {
    this.preview.clear();
    if (this.selected === null || !this.inArena(p)) return;
    const card: Card = this.hands.player.hand[this.selected];
    if (card.kind === 'spell') {
      this.preview.lineStyle(3, 0xffffff, 0.8).strokeCircle(p.x, p.y, card.radius);
      this.preview.fillStyle(0xffffff, 0.12).fillCircle(p.x, p.y, card.radius);
    } else {
      const y = LANES_Y[this.laneAt(p.y)];
      this.preview.fillStyle(0xffffff, 0.15).fillRect(ARENA_LEFT, y - LANE_HEIGHT / 2 + 25, MID_X - ARENA_LEFT, LANE_HEIGHT - 50);
    }
  }
}
