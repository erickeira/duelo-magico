import Phaser from 'phaser';
import { ARENA_BOTTOM, ARENA_TOP, CASTLE_HP, COLORS, W } from '../config';
import { Team } from '../data/cards';
import { Damageable } from './Unit';

const HEIGHT = 120;

export class Castle implements Damageable {
  hp = CASTLE_HP;
  alive = true;
  readonly flying = false;
  cooldown = 0;
  /** Linha y onde as tropas inimigas param para atacar. */
  readonly front: number;

  private container: Phaser.GameObjects.Container;
  private hpBar: Phaser.GameObjects.Graphics;
  private hpText: Phaser.GameObjects.Text;

  constructor(private scene: Phaser.Scene, readonly team: Team) {
    const isPlayer = team === 'player';
    this.front = isPlayer ? ARENA_BOTTOM : ARENA_TOP;
    const cy = isPlayer ? ARENA_BOTTOM + HEIGHT / 2 : ARENA_TOP - HEIGHT / 2;
    const color = isPlayer ? COLORS.playerDark : COLORS.enemyDark;
    const accent = isPlayer ? COLORS.player : COLORS.enemy;

    this.container = scene.add.container(W / 2, cy).setDepth(5);
    const wall = scene.add.rectangle(0, 0, W - 20, HEIGHT, color).setStrokeStyle(4, accent);
    this.container.add(wall);

    // Ameias na frente voltada para a arena.
    const edge = isPlayer ? -HEIGHT / 2 - 8 : HEIGHT / 2 + 8;
    for (let x = -W / 2 + 30; x < W / 2 - 20; x += 44) {
      this.container.add(scene.add.rectangle(x, edge, 24, 16, accent));
    }

    this.container.add(scene.add.text(0, isPlayer ? 8 : -8, '🏰', { fontSize: '56px' }).setOrigin(0.5));
    this.hpBar = scene.add.graphics();
    this.hpText = scene.add
      .text(0, isPlayer ? 42 : -42, '', { fontSize: '20px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5);
    this.container.add([this.hpBar, this.hpText]);
    this.draw();
  }

  get ratio(): number {
    return Math.max(0, this.hp) / CASTLE_HP;
  }

  aimPoint(fromX: number) {
    return { x: fromX, y: this.front + (this.team === 'player' ? 12 : -12) };
  }

  takeDamage(amount: number) {
    if (!this.alive) return;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) this.alive = false;
    this.draw();
    this.scene.tweens.add({ targets: this.container, x: W / 2 + 4, duration: 40, yoyo: true });
  }

  private draw() {
    const isPlayer = this.team === 'player';
    const y = isPlayer ? 30 : -54;
    const w = 300;
    this.hpBar.clear();
    this.hpBar.fillStyle(0x000000, 0.6).fillRoundedRect(-w / 2, y, w, 24, 6);
    this.hpBar.fillStyle(isPlayer ? 0x60a5fa : 0xf87171).fillRoundedRect(-w / 2, y, Math.max(1, w * this.ratio), 24, 6);
    this.hpText.setY(y + 12).setText(`${Math.ceil(this.hp)}`);
  }
}
