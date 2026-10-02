import Phaser from 'phaser';
import { ARENA_ART, ARENA_BOTTOM, ARENA_LEFT, ARENA_RIGHT, ARENA_TOP, CASTLE_HP, COLORS, HUD_HEIGHT, W, type Team } from '../config';
import { arenaKey } from '../scenes/PreloadScene';
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
    // No cenário pintado, as praças nas pontas das trilhas já são a base do castelo; sem ele, desenha um bloco.
    if (!scene.textures.exists(arenaKey(ARENA_ART.id))) {
      this.container.add(scene.add.rectangle(0, 0, WIDTH - 10, height, color).setStrokeStyle(4, accent));
      // Ameias na frente voltada para a arena.
      const edge = isPlayer ? WIDTH / 2 + 4 : -WIDTH / 2 - 4;
      for (let y = -height / 2 + 24; y < height / 2 - 10; y += 44) {
        this.container.add(scene.add.rectangle(edge, y, 16, 24, accent));
      }
      this.container.add(scene.add.text(0, 0, '🏰', { fontSize: '64px' }).setOrigin(0.5));
    }

    // A vida fica no HUD superior: jogador à esquerda, IA à direita.
    this.hpBar = scene.add.graphics().setDepth(61);
    this.hpText = scene.add
      .text(0, HUD_HEIGHT / 2, '', { fontFamily: '"Lilita One", sans-serif', fontSize: '20px', color: '#ffffff', stroke: '#000000', strokeThickness: 4 })
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
    const g = this.hpBar;
    g.fillStyle(0x000000, 0.7).fillRoundedRect(x0 - 3, y - 3, HP_BAR_W + 6, 30, 9);
    const [light, dark] = isPlayer ? [0x93c5fd, 0x1d4ed8] : [0xfca5a5, 0xb91c1c];
    // A barra da IA esvazia em direção à borda direita, espelhando a do jogador.
    if (fill >= 1) {
      const fx = isPlayer ? x0 : x0 + HP_BAR_W - fill;
      g.fillGradientStyle(light, light, dark, dark, 1).fillRoundedRect(fx, y, Math.max(12, fill), 24, 7);
      g.fillStyle(0xffffff, 0.28).fillRoundedRect(fx + 4, y + 3, Math.max(4, fill - 8), 6, 3);
    }
    g.lineStyle(2, 0xf5c451, 1).strokeRoundedRect(x0 - 3, y - 3, HP_BAR_W + 6, 30, 9);
    this.hpText.setX(x0 + HP_BAR_W / 2).setText(`${Math.ceil(this.hp)}`);
  }
}
