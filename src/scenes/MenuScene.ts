import Phaser from 'phaser';
import { COLORS, H, W } from '../config';
import { button } from './ui';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b1020);
    this.add.text(W / 2, 300, '🏰', { fontSize: '120px' }).setOrigin(0.5);
    this.add
      .text(W / 2, 450, 'DUELO MÁGICO', { fontSize: '64px', fontStyle: 'bold', color: '#facc15' })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 520, 'Estratégia em tempo real em 3 trilhas', { fontSize: '24px', color: '#cbd5e1' })
      .setOrigin(0.5);

    button(this, W / 2, 700, 'BATALHAR', COLORS.player, () => this.scene.start('Battle'));

    const howTo = [
      'Arraste uma carta para uma trilha para invocar tropas.',
      'Feitiços podem ser soltos em qualquer ponto.',
      'Destrua o castelo inimigo ou tenha mais vida em 3:00.',
      'No último minuto a mana enche em dobro!',
    ];
    this.add
      .text(W / 2, 920, howTo.join('\n'), { fontSize: '22px', color: '#94a3b8', align: 'center', lineSpacing: 12 })
      .setOrigin(0.5);
  }
}
