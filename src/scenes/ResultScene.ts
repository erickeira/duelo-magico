import Phaser from 'phaser';
import { COLORS, H, W } from '../config';
import { ARENAS, TUTORIAL, chestById, godById } from '../data/content';
import type { BattleSettings } from '../battle/Loadout';
import type { BattleRewards } from '../meta/progress';
import { getProfile } from '../save/save';
import type { BattleResult } from './BattleScene';
import { button } from './ui';

interface ResultData {
  result: BattleResult;
  playerHp: number;
  enemyHp: number;
  settings: BattleSettings;
  rewards: BattleRewards;
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
    const r = data.rewards;
    const p = getProfile();
    const tutorial = data.settings.tutorial;

    this.add.rectangle(W / 2, H / 2, W, H, 0x0b1020);
    this.add.text(W / 2, 90, title, { fontSize: '80px', fontStyle: 'bold', color }).setOrigin(0.5);
    this.add
      .text(W / 2, 165, `Seu castelo: ${data.playerHp}   ·   Castelo da IA: ${data.enemyHp}`, { fontSize: '22px', color: '#cbd5e1' })
      .setOrigin(0.5);

    // Recompensas e novidades, aparecendo uma a uma.
    const lines: [string, string][] = [];
    if (tutorial !== undefined) {
      if (r.tutorialStep !== null) {
        lines.push([r.tutorialStep >= TUTORIAL.length ? '🎓 Tutorial concluído! Agora as batalhas valem troféus.' : `✅ ${TUTORIAL[tutorial].title} concluído`, '#4ade80']);
      } else if (data.result !== 'win') lines.push(['Tente de novo: vença para avançar no tutorial.', '#fde68a']);
    } else {
      const sign = r.trophies > 0 ? '+' : '';
      lines.push([`🏆 ${sign}${r.trophies} troféus   (total ${p.trophies})`, r.trophies >= 0 ? '#fde68a' : '#f87171']);
    }
    if (r.gold) lines.push([`🪙 +${r.gold} ouro`, '#ffffff']);
    if (r.essence) lines.push([`✴️ +${r.essence} essência divina`, '#e9d5ff']);
    if (r.chest) {
      const c = chestById(r.chest)!;
      lines.push([`${c.icon} ${c.name} ganho! Abra na tela inicial.`, '#4ade80']);
    } else if (r.slotsFull) lines.push(['Espaços de baú cheios: abra um baú para ganhar o próximo.', '#fb923c']);
    if (r.newArena !== null) {
      const a = ARENAS[r.newArena];
      lines.push([`🎉 Nova arena: ${a.icon} ${a.name}! Novas tropas nos baús.`, '#facc15']);
    }
    for (const id of r.newGods) {
      const g = godById(id)!;
      lines.push([`🎉 Novo deus liberado: ${g.icon} ${g.name}, ${g.title}`, g.color]);
    }

    lines.forEach(([text, c], i) => {
      const t = this.add.text(W / 2, 240 + i * 44, text, { fontSize: '24px', fontStyle: 'bold', color: c }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, y: t.y - 6, delay: 250 + i * 350, duration: 300 });
    });

    // Ações
    const home = () => this.scene.start('Home');
    if (tutorial !== undefined) {
      const done = p.tutorial >= TUTORIAL.length;
      if (done) button(this, W / 2, 610, 'INÍCIO', COLORS.player, home);
      else {
        button(this, W / 2 - 200, 610, p.tutorial > tutorial ? 'PRÓXIMO ▶' : 'TENTAR DE NOVO', COLORS.player, () =>
          this.scene.start('Battle', { ...data.settings, tutorial: p.tutorial, difficulty: 'tutorial' }),
        );
        button(this, W / 2 + 200, 610, 'INÍCIO', 0x374151, home);
      }
    } else {
      button(this, W / 2 - 200, 610, 'JOGAR DE NOVO', COLORS.player, () => this.scene.start('Battle', { ...data.settings }));
      button(this, W / 2 + 200, 610, 'INÍCIO', 0x374151, home);
    }
  }
}
