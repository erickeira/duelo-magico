import Phaser from 'phaser';
import { COLORS, H, W } from '../config';
import type { BattleResult } from './BattleScene';
import { button } from './ui';

interface ResultData {
  result: BattleResult;
  playerHp: number;
  enemyHp: number;
}

const TITLES: Record<BattleResult, [string, string]> = {
  win: ['VITÓRIA!', '#facc15'],
  lose: ['DERROTA', '#f87171'],
  draw: ['EMPATE', '#cbd5e1'],
};

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  create(data: ResultData) {
    const [title, color] = TITLES[data.result];
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b1020);
    this.add.text(W / 2, 380, title, { fontSize: '88px', fontStyle: 'bold', color }).setOrigin(0.5);
    this.add
      .text(W / 2, 500, `Seu castelo: ${data.playerHp}   ·   Castelo da IA: ${data.enemyHp}`, {
        fontSize: '26px', color: '#cbd5e1',
      })
      .setOrigin(0.5);
    button(this, W / 2, 700, 'JOGAR DE NOVO', COLORS.player, () => this.scene.start('Battle'));
    button(this, W / 2, 820, 'MENU', 0x374151, () => this.scene.start('Menu'));
  }
}
