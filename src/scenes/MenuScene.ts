import Phaser from 'phaser';
import { COLORS, H, W } from '../config';
import { GODS, spellById, type GodId } from '../data/content';
import type { BattleSettings, Difficulty } from '../battle/Loadout';
import { button } from './ui';

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'facil', label: 'Fácil' },
  { id: 'normal', label: 'Normal' },
  { id: 'dificil', label: 'Difícil' },
];

const hex = (css: string) => Number.parseInt(css.slice(1), 16);

export class MenuScene extends Phaser.Scene {
  private settings: BattleSettings = { god: 'ignar', difficulty: 'normal' };
  private godCards: { id: GodId; bg: Phaser.GameObjects.Rectangle }[] = [];
  private diffButtons: { id: Difficulty; bg: Phaser.GameObjects.Rectangle }[] = [];
  private spellsText!: Phaser.GameObjects.Text;

  constructor() {
    super('Menu');
  }

  init(data: Partial<BattleSettings>) {
    this.settings = { god: data.god ?? this.settings.god, difficulty: data.difficulty ?? this.settings.difficulty };
    this.godCards = [];
    this.diffButtons = [];
  }

  create() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b1020);
    this.add.text(W / 2, 60, 'DUELO MÁGICO', { fontSize: '56px', fontStyle: 'bold', color: '#facc15' }).setOrigin(0.5);
    this.add.text(W / 2, 112, 'Escolha seu deus', { fontSize: '22px', color: '#cbd5e1' }).setOrigin(0.5);

    // Deuses
    GODS.forEach((g, i) => {
      const x = W / 2 + (i - 1.5) * 250;
      const y = 250;
      const bg = this.add.rectangle(x, y, 220, 190, 0x111827).setStrokeStyle(3, 0x374151).setInteractive({ useHandCursor: true });
      this.add.text(x, y - 50, g.icon, { fontSize: '56px' }).setOrigin(0.5);
      this.add.text(x, y + 10, g.name, { fontSize: '26px', fontStyle: 'bold', color: g.color }).setOrigin(0.5);
      this.add.text(x, y + 42, `${g.element} · ${'★'.repeat(g.difficulty)}${'☆'.repeat(3 - g.difficulty)}`, { fontSize: '16px', color: '#94a3b8' }).setOrigin(0.5);
      this.add.text(x, y + 70, g.title, { fontSize: '14px', color: '#64748b' }).setOrigin(0.5);
      bg.on('pointerdown', () => {
        this.settings.god = g.id;
        this.refresh();
      });
      this.godCards.push({ id: g.id, bg });
    });
    this.spellsText = this.add.text(W / 2, 372, '', { fontSize: '18px', color: '#e2e8f0' }).setOrigin(0.5);

    // Dificuldade
    this.add.text(W / 2, 425, 'Dificuldade da IA', { fontSize: '18px', color: '#94a3b8' }).setOrigin(0.5);
    DIFFICULTIES.forEach((d, i) => {
      const x = W / 2 + (i - 1) * 170;
      const bg = this.add.rectangle(x, 470, 150, 52, 0x111827).setStrokeStyle(3, 0x374151).setInteractive({ useHandCursor: true });
      this.add.text(x, 470, d.label, { fontSize: '22px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
      bg.on('pointerdown', () => {
        this.settings.difficulty = d.id;
        this.refresh();
      });
      this.diffButtons.push({ id: d.id, bg });
    });

    button(this, W / 2, 585, 'BATALHAR', COLORS.player, () => {
      this.enterFullscreenOnMobile();
      this.scene.start('Battle', { ...this.settings });
    });

    this.add
      .text(W / 2, 680, 'Arraste cartas para as trilhas · Magias não gastam mana, têm recarga · Derrube o castelo inimigo', {
        fontSize: '16px', color: '#64748b',
      })
      .setOrigin(0.5);
    this.refresh();
  }

  private refresh() {
    for (const c of this.godCards) {
      const god = GODS.find((g) => g.id === c.id)!;
      const on = c.id === this.settings.god;
      c.bg.setStrokeStyle(on ? 5 : 3, on ? hex(god.color) : 0x374151).setFillStyle(on ? 0x1f2937 : 0x111827);
    }
    for (const b of this.diffButtons) {
      const on = b.id === this.settings.difficulty;
      b.bg.setStrokeStyle(on ? 4 : 3, on ? COLORS.gold : 0x374151).setFillStyle(on ? 0x1f2937 : 0x111827);
    }
    const deck = GODS.find((g) => g.id === this.settings.god)!.suggestedDecks[0];
    const spells = deck.spells.map((id) => spellById(id)!).map((s) => `${s.icon} ${s.name}`).join('   ');
    this.spellsText.setText(`Deck "${deck.name}"  ·  Magias: ${spells}`);
  }

  /** No celular, entra em tela cheia e tenta travar em paisagem (só funciona após um toque). */
  private enterFullscreenOnMobile() {
    if (!this.sys.game.device.input.touch || this.scale.isFullscreen) return;
    this.scale.startFullscreen();
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    orientation.lock?.('landscape').catch(() => {});
  }
}
