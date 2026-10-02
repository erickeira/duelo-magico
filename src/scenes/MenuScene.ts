import Phaser from 'phaser';
import { COLORS, H, W } from '../config';
import { button } from './ui';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b1020);
    this.add.text(W / 2, 130, '🏰', { fontSize: '100px' }).setOrigin(0.5);
    this.add
      .text(W / 2, 250, 'DUELO MÁGICO', { fontSize: '64px', fontStyle: 'bold', color: '#facc15' })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 312, 'Estratégia em tempo real em 3 trilhas', { fontSize: '24px', color: '#cbd5e1' })
      .setOrigin(0.5);

    button(this, W / 2, 420, 'BATALHAR', COLORS.player, () => {
      this.enterFullscreenOnMobile();
      this.scene.start('Battle');
    });

    const howTo = [
      'Arraste uma carta para uma trilha para invocar tropas.  ·  Feitiços podem ser soltos em qualquer ponto.',
      'Destrua o castelo inimigo ou tenha mais vida em 3:00.  ·  No último minuto a mana enche em dobro!',
    ];
    this.add
      .text(W / 2, 580, howTo.join('\n'), { fontSize: '20px', color: '#94a3b8', align: 'center', lineSpacing: 12 })
      .setOrigin(0.5);
  }

  /** No celular, entra em tela cheia e tenta travar em paisagem (só funciona após um toque). */
  private enterFullscreenOnMobile() {
    if (!this.sys.game.device.input.touch || this.scale.isFullscreen) return;
    this.scale.startFullscreen();
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    orientation.lock?.('landscape').catch(() => {});
  }
}
