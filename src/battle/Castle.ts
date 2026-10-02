import Phaser from 'phaser';
import { ARENA_BOTTOM, ARENA_LEFT, ARENA_RIGHT, ARENA_TOP, CASTLE_HP, COLORS, HUD_HEIGHT, W, type Team } from '../config';
import { Damageable } from './Unit';

const WIDTH = 150;
const HP_BAR_W = 380;

export class Castle implements Damageable {
  hp: number;
  alive = true;
  readonly isFlying = false;
  cooldown = 0;
  /** Linha x onde as tropas inimigas param para atacar. */
  readonly front: number;

  private container: Phaser.GameObjects.Container;
  private baseX: number;
  private hpBar: Phaser.GameObjects.Graphics;
  private hpText: Phaser.GameObjects.Text;

  constructor(private scene: Phaser.Scene, readonly team: Team, readonly maxHp = CASTLE_HP) {
    this.hp = maxHp;
    const isPlayer = team === 'player';
    this.front = isPlayer ? ARENA_LEFT : ARENA_RIGHT;
    const height = ARENA_BOTTOM - ARENA_TOP;
    this.baseX = isPlayer ? ARENA_LEFT - WIDTH / 2 : ARENA_RIGHT + WIDTH / 2;
    const color = isPlayer ? COLORS.playerDark : COLORS.enemyDark;
    const accent = isPlayer ? COLORS.player : COLORS.enemy;

    this.container = scene.add.container(this.baseX, (ARENA_TOP + ARENA_BOTTOM) / 2).setDepth(5);
    this.container.add(scene.add.rectangle(0, 0, WIDTH - 10, height, color).setStrokeStyle(4, accent));

    // Ameias na frente voltada para a arena.
    const edge = isPlayer ? WIDTH / 2 + 4 : -WIDTH / 2 - 4;
    for (let y = -height / 2 + 24; y < height / 2 - 10; y += 44) {
      this.container.add(scene.add.rectangle(edge, y, 16, 24, accent));
    }
    this.container.add(scene.add.text(0, 0, '🏰', { fontSize: '64px' }).setOrigin(0.5));

    // A vida fica no HUD superior: jogador à esquerda, IA à direita.
    this.hpBar = scene.add.graphics().setDepth(61);
    this.hpText = scene.add
      .text(0, HUD_HEIGHT / 2, '', { fontSize: '20px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(62);
    this.draw();
  }

  get ratio(): number {
    return Math.max(0, this.hp) / this.maxHp;
  }

  aimPoint(alongY: number) {
    return { x: this.front + (this.team === 'player' ? -12 : 12), y: alongY };
  }

  takeDamage(amount: number, shake = true) {
    if (!this.alive) return;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) this.alive = false;
    this.draw();
    if (shake) this.scene.tweens.add({ targets: this.container, x: this.baseX + 4, duration: 40, yoyo: true });
  }

  heal(amount: number) {
    if (!this.alive) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.draw();
  }

  private draw() {
    const isPlayer = this.team === 'player';
    const x0 = isPlayer ? 70 : W - 70 - HP_BAR_W;
    const y = HUD_HEIGHT / 2 - 12;
    const fill = HP_BAR_W * this.ratio;
    this.hpBar.clear();
    this.hpBar.fillStyle(0x000000, 0.6).fillRoundedRect(x0, y, HP_BAR_W, 24, 6);
    this.hpBar.fillStyle(isPlayer ? 0x60a5fa : 0xf87171);
    // A barra da IA esvazia em direção à borda direita, espelhando a do jogador.
    if (fill >= 1) this.hpBar.fillRoundedRect(isPlayer ? x0 : x0 + HP_BAR_W - fill, y, fill, 24, 6);
    this.hpText.setX(x0 + HP_BAR_W / 2).setText(`${Math.ceil(this.hp)}`);
  }
}
