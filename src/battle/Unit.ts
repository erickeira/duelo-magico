import Phaser from 'phaser';
import { COLORS } from '../config';
import { Team, UnitStats } from '../data/cards';

export interface Damageable {
  team: Team;
  alive: boolean;
  flying: boolean;
  takeDamage(amount: number): void;
  /** Ponto de mira; `along` é a coordenada y de quem atira (usada pelo castelo). */
  aimPoint(along: number): { x: number; y: number };
}

const FLY_OFFSET = 22;

export class Unit extends Phaser.GameObjects.Container implements Damageable {
  hp: number;
  readonly maxHp: number;
  alive = true;
  cooldown = 0;
  frozen = 0;
  readonly flying: boolean;
  readonly radius: number;

  private hpBar: Phaser.GameObjects.Graphics;
  private disc: Phaser.GameObjects.Arc;
  private ice: Phaser.GameObjects.Arc;

  constructor(
    scene: Phaser.Scene,
    readonly team: Team,
    readonly stats: UnitStats,
    x: number,
    y: number,
    readonly lane: number,
  ) {
    super(scene, x, y);
    this.hp = this.maxHp = stats.hp;
    this.flying = !!stats.flying;
    this.radius = stats.radius;

    const lift = this.flying ? -FLY_OFFSET : 0;
    const color = team === 'player' ? COLORS.player : COLORS.enemy;
    const dark = team === 'player' ? COLORS.playerDark : COLORS.enemyDark;

    if (this.flying) this.add(scene.add.ellipse(0, 6, this.radius * 1.6, this.radius * 0.7, 0x000000, 0.3));
    this.disc = scene.add.circle(0, lift, this.radius, color).setStrokeStyle(3, dark);
    const icon = scene.add.text(0, lift, stats.icon, { fontSize: `${Math.round(this.radius * 1.2)}px` }).setOrigin(0.5);
    this.ice = scene.add.circle(0, lift, this.radius + 4, 0x93c5fd, 0.55).setVisible(false);
    this.hpBar = scene.add.graphics();
    this.add([this.disc, icon, this.ice, this.hpBar]);
    this.drawHp();

    scene.add.existing(this);
    this.setDepth(this.flying ? 20 : 10);
    this.setScale(0.2);
    scene.tweens.add({ targets: this, scale: 1, duration: 180, ease: 'Back.Out' });
  }

  /** Sentido do avanço no eixo X: jogador vai para a direita, IA para a esquerda. */
  get dir(): number {
    return this.team === 'player' ? 1 : -1;
  }

  canHit(target: Damageable): boolean {
    return !target.flying || !!this.stats.targetsAir;
  }

  aimPoint() {
    return { x: this.x, y: this.y + (this.flying ? -FLY_OFFSET : 0) };
  }

  takeDamage(amount: number) {
    if (!this.alive) return;
    this.hp -= amount;
    this.drawHp();
    this.disc.setFillStyle(0xffffff);
    this.scene.time.delayedCall(70, () => {
      if (this.active) this.disc.setFillStyle(this.team === 'player' ? COLORS.player : COLORS.enemy);
    });
    if (this.hp <= 0) this.alive = false;
  }

  setFrozenLook(on: boolean) {
    this.ice.setVisible(on);
  }

  lunge() {
    this.scene.tweens.add({ targets: this.disc, x: this.dir * 8, duration: 80, yoyo: true });
  }

  private drawHp() {
    const w = this.radius * 2;
    const top = (this.flying ? -FLY_OFFSET : 0) - this.radius - 10;
    const pct = Math.max(0, this.hp / this.maxHp);
    this.hpBar.clear();
    this.hpBar.fillStyle(0x000000, 0.6).fillRect(-w / 2, top, w, 5);
    this.hpBar.fillStyle(this.team === 'player' ? 0x60a5fa : 0xf87171).fillRect(-w / 2, top, w * pct, 5);
  }
}
