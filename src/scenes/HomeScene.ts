import Phaser from 'phaser';
import { COLORS, H, W } from '../config';
import { godById, spellById, unitById } from '../data/content';
import type { Difficulty } from '../battle/Loadout';
import { activeDeck, getSave, isDeckComplete, updateSave } from '../save/save';
import { button, hex, panel, toast, UnitTile, type Button } from './ui';

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'facil', label: 'Fácil' },
  { id: 'normal', label: 'Normal' },
  { id: 'dificil', label: 'Difícil' },
];

/** Tela inicial: deck ativo, dificuldade e atalhos para batalhar, montar deck e coleção. */
export class HomeScene extends Phaser.Scene {
  private deckTitle!: Phaser.GameObjects.Text;
  private godText!: Phaser.GameObjects.Text;
  private spellsText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private deckFrame!: Phaser.GameObjects.Rectangle;
  private tiles: UnitTile[] = [];
  private diffButtons: { id: Difficulty; bg: Phaser.GameObjects.Rectangle }[] = [];
  private battleBtn!: Button;

  constructor() {
    super('Home');
  }

  create() {
    this.tiles = [];
    this.diffButtons = [];
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b1020);
    this.add.text(W / 2, 48, 'DUELO MÁGICO', { fontSize: '52px', fontStyle: 'bold', color: '#facc15' }).setOrigin(0.5);

    // Deck ativo
    this.deckFrame = panel(this, 240, 100, 800, 310);
    this.arrow(285, 135, '◀', -1);
    this.arrow(995, 135, '▶', 1);
    this.deckTitle = this.add.text(W / 2, 135, '', { fontSize: '24px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    this.godText = this.add.text(W / 2, 185, '', { fontSize: '26px', fontStyle: 'bold' }).setOrigin(0.5);
    this.spellsText = this.add.text(W / 2, 225, '', { fontSize: '18px', color: '#e2e8f0' }).setOrigin(0.5);
    for (let i = 0; i < 8; i++) {
      const tile = new UnitTile(this, W / 2 + (i - 3.5) * 92, 310, 82, 100);
      tile.on('pointerdown', () => this.scene.start('Deck'));
      this.tiles.push(tile);
    }
    this.statusText = this.add.text(W / 2, 385, '', { fontSize: '16px', color: '#f87171' }).setOrigin(0.5);

    // Dificuldade
    this.add.text(W / 2, 440, 'Dificuldade da IA', { fontSize: '18px', color: '#94a3b8' }).setOrigin(0.5);
    DIFFICULTIES.forEach((d, i) => {
      const x = W / 2 + (i - 1) * 170;
      const bg = this.add.rectangle(x, 482, 150, 50, 0x111827).setStrokeStyle(3, 0x374151).setInteractive({ useHandCursor: true });
      this.add.text(x, 482, d.label, { fontSize: '22px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
      bg.on('pointerdown', () => {
        updateSave((s) => (s.difficulty = d.id));
        this.refresh();
      });
      this.diffButtons.push({ id: d.id, bg });
    });

    // Ações
    button(this, 330, 600, '🃏 Montar deck', 0x374151, () => this.scene.start('Deck'), { w: 260, h: 72, fontSize: 24 });
    button(this, 950, 600, '📖 Coleção', 0x374151, () => this.scene.start('Collection'), { w: 260, h: 72, fontSize: 24 });
    this.battleBtn = button(this, W / 2, 600, 'BATALHAR ⚔️', COLORS.player, () => this.startBattle(), { w: 300, h: 90 });

    this.add
      .text(W / 2, 690, 'Arraste cartas para as trilhas · Magias não gastam mana, têm recarga · Derrube o castelo inimigo', { fontSize: '15px', color: '#64748b' })
      .setOrigin(0.5);
    this.refresh();
  }

  private arrow(x: number, y: number, label: string, delta: number) {
    const t = this.add.text(x, y, label, { fontSize: '30px', color: '#cbd5e1' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    t.on('pointerdown', () => {
      updateSave((s) => (s.activeDeck = (s.activeDeck + delta + s.decks.length) % s.decks.length));
      this.refresh();
    });
  }

  private refresh() {
    const save = getSave();
    const deck = activeDeck();
    const god = godById(deck.god)!;
    this.deckTitle.setText(`Deck ${save.activeDeck + 1}/${save.decks.length}: ${deck.name}`);
    this.godText.setText(`${god.icon} ${god.name}, ${god.title}`).setColor(god.color);
    this.deckFrame.setStrokeStyle(3, hex(god.color));
    const spells = deck.spells.map((id) => spellById(id)!).map((s) => `${s.icon} ${s.name}`);
    this.spellsText.setText(spells.length ? `Magias: ${spells.join('   ')}` : 'Sem magias escolhidas');
    this.tiles.forEach((t, i) => t.setUnit(deck.units[i] ? unitById(deck.units[i])! : null));
    const complete = isDeckComplete(deck);
    this.statusText.setText(complete ? '' : 'Deck incompleto: toque para montar (8 tropas + 2 magias)');
    this.battleBtn.setEnabled(complete);
    for (const b of this.diffButtons) {
      const on = b.id === save.difficulty;
      b.bg.setStrokeStyle(on ? 4 : 3, on ? COLORS.gold : 0x374151).setFillStyle(on ? 0x1f2937 : 0x111827);
    }
  }

  private startBattle() {
    const deck = activeDeck();
    if (!isDeckComplete(deck)) {
      toast(this, 'Complete o deck antes de batalhar');
      return;
    }
    this.enterFullscreenOnMobile();
    this.scene.start('Battle', { deck: { ...deck, spells: [...deck.spells], units: [...deck.units] }, difficulty: getSave().difficulty });
  }

  /** No celular, entra em tela cheia e tenta travar em paisagem (só funciona após um toque). */
  private enterFullscreenOnMobile() {
    if (!this.sys.game.device.input.touch || this.scale.isFullscreen) return;
    this.scale.startFullscreen();
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    orientation.lock?.('landscape').catch(() => {});
  }
}
