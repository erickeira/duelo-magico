import Phaser from 'phaser';
import { COLORS, H, W } from '../config';
import type { BattleSettings } from '../battle/Loadout';
import type { BattleResult } from './BattleScene';
import { button } from './ui';

interface ResultData {
  result: BattleResult;
  playerHp: number;
  enemyHp: number;
  settings: BattleSettings;
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
    this.add.text(W / 2, 200, title, { fontSize: '88px', fontStyle: 'bold', color }).setOrigin(0.5);
    this.add
      .text(W / 2, 310, `Seu castelo: ${data.playerHp}   ·   Castelo da IA: ${data.enemyHp}`, {
        fontSize: '26px', color: '#cbd5e1',
      })
      .setOrigin(0.5);
    button(this, W / 2, 440, 'JOGAR DE NOVO', COLORS.player, () => this.scene.start('Battle', { ...data.settings }));
    button(this, W / 2, 560, 'MENU', 0x374151, () => this.scene.start('Menu', { ...data.settings }));
  }
}
