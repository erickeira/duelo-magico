import Phaser from 'phaser';
import { COLORS } from '../config';
import { rarityById, type Rarity, type UnitDef } from '../data/content';
import { rarityFrame, type FrameObject } from '../scenes/frames';
import { cardKey, coverImage } from '../scenes/PreloadScene';
import { FONT_DISPLAY, THEME } from '../scenes/theme';

export const CARD_W = 110;
export const CARD_H = 128;
/** Espessura visual da moldura ornamentada. */
const BORDER = 11;
/** A arte entra um pouco por baixo da moldura, para não sobrar fresta nos cantos internos. */
const ART_INSET = 6;

const hex = (css: string) => Number.parseInt(css.slice(1), 16);

export class CardView extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private art: Phaser.GameObjects.Image | null = null;
  private ornament: FrameObject | null = null;
  /** Contorno simples: substitui a moldura ornamentada se ela não carregar. */
  private outline: Phaser.GameObjects.Rectangle;
  /** Brilho dourado em volta da carta selecionada (quando há moldura ornamentada). */
  private glow: Phaser.GameObjects.Rectangle;
  private icon: Phaser.GameObjects.Text;
  private nameBar: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private cost: Phaser.GameObjects.Text;
  private baseY: number;
  private level: Phaser.GameObjects.Text;
  private rarityColor = 0x4b5563;
  private cardId: string | null = null;
  private rarity: Rarity | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, small = false) {
    super(scene, x, y);
    this.baseY = y;
    this.bg = scene.add.rectangle(0, 0, CARD_W - 4, CARD_H - 4, 0x1f2937);
    this.icon = scene.add.text(0, -12, '', { fontSize: '44px' }).setOrigin(0.5);
    this.nameBar = scene.add.rectangle(0, CARD_H / 2 - BORDER - 11, CARD_W - BORDER * 2, 24, 0x000000, 0.65);
    this.label = scene.add
      .text(0, CARD_H / 2 - BORDER - 11, '', { fontSize: '12px', fontStyle: '900', color: '#ffffff', align: 'center', stroke: '#000000', strokeThickness: 2, wordWrap: { width: CARD_W - BORDER * 2 - 4 } })
      .setOrigin(0.5);
    this.outline = scene.add.rectangle(0, 0, CARD_W, CARD_H).setStrokeStyle(3, this.rarityColor);
    this.glow = scene.add.rectangle(0, 0, CARD_W + 8, CARD_H + 8).setStrokeStyle(4, COLORS.gold).setVisible(false);
    // Gema de custo: esfera roxa com brilho e aro dourado.
    const gem = scene.add.graphics({ x: -CARD_W / 2 + 14, y: -CARD_H / 2 + 14 });
    gem.fillStyle(0x000000, 0.5).fillCircle(1, 2, 16);
    gem.fillGradientStyle(0xd8b4fe, 0xd8b4fe, 0x6b21a8, 0x6b21a8, 1).fillCircle(0, 0, 15);
    gem.fillStyle(0xffffff, 0.35).fillEllipse(-4, -6, 12, 7);
    gem.lineStyle(2.5, THEME.gold, 1).strokeCircle(0, 0, 15);
    this.cost = scene.add
      .text(gem.x, gem.y, '', { fontFamily: FONT_DISPLAY, fontSize: '20px', color: '#ffffff', stroke: '#2e1065', strokeThickness: 4 })
      .setOrigin(0.5);
    this.level = scene.add
      .text(CARD_W / 2 - 8, -CARD_H / 2 + 7, '', { fontSize: '12px', fontStyle: 'bold', color: '#fde68a', stroke: '#000000', strokeThickness: 3 })
      .setOrigin(1, 0);
    this.add([this.bg, this.icon, this.nameBar, this.label, this.outline, this.glow, gem, this.cost, this.level]);
    if (small) this.setScale(0.6);
    this.setSize(CARD_W, CARD_H);
    scene.add.existing(this);
    this.setDepth(50);
  }

  setCard(card: UnitDef, level?: number) {
    this.level.setText(level ? `Nv ${level}` : '');
    if (this.cardId === card.id) return; // chamado a cada quadro pelo HUD: só refaz quando muda
    this.cardId = card.id;
    this.art?.destroy();
    this.art = coverImage(this.scene, cardKey(card.id), CARD_W - ART_INSET * 2, CARD_H - ART_INSET * 2);
    if (this.art) this.addAt(this.art, 1);
    if (this.rarity !== card.rarity) {
      this.rarity = card.rarity;
      this.ornament?.destroy();
      this.ornament = rarityFrame(this.scene, card.rarity, CARD_W, CARD_H, BORDER);
      // Por cima da arte e do nome, por baixo do custo e do nível.
      if (this.ornament) this.addAt(this.ornament, this.getIndex(this.outline));
    }
    this.icon.setVisible(!this.art).setText(card.icon);
    this.label.setText(card.count > 1 ? `${card.name} ×${card.count}` : card.name);
    this.cost.setText(String(card.cost));
    this.rarityColor = hex(rarityById(card.rarity).color);
    this.setSelected(false);
  }

  setPlayable(on: boolean) {
    this.setAlpha(on ? 1 : 0.45);
  }

  setSelected(on: boolean) {
    // Com moldura ornamentada, o contorno simples some e a seleção vira um brilho dourado por fora.
    this.glow.setVisible(on && !!this.ornament);
    this.outline.setStrokeStyle(on ? 5 : 3, on ? COLORS.gold : this.rarityColor).setVisible(!this.ornament);
    this.y = on ? this.baseY - 10 : this.baseY;
  }
}
