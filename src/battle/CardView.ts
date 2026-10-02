import Phaser from 'phaser';
import { COLORS } from '../config';
import { rarityById, type UnitDef } from '../data/content';
import { cardKey, coverImage } from '../scenes/PreloadScene';

export const CARD_W = 110;
export const CARD_H = 128;
const ART_INSET = 3;

const hex = (css: string) => Number.parseInt(css.slice(1), 16);

export class CardView extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private frame: Phaser.GameObjects.Rectangle;
  private art: Phaser.GameObjects.Image | null = null;
  private icon: Phaser.GameObjects.Text;
  private nameBar: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private cost: Phaser.GameObjects.Text;
  private baseY: number;
  private level: Phaser.GameObjects.Text;
  private rarityColor = 0x4b5563;
  private cardId: string | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, small = false) {
    super(scene, x, y);
    this.baseY = y;
    this.bg = scene.add.rectangle(0, 0, CARD_W, CARD_H, 0x1f2937);
    this.icon = scene.add.text(0, -12, '', { fontSize: '44px' }).setOrigin(0.5);
    this.nameBar = scene.add.rectangle(0, CARD_H / 2 - 15, CARD_W - ART_INSET * 2, 26, 0x000000, 0.65);
    this.label = scene.add
      .text(0, CARD_H / 2 - 15, '', { fontSize: '13px', fontStyle: 'bold', color: '#ffffff', align: 'center', wordWrap: { width: CARD_W - 8 } })
      .setOrigin(0.5);
    // A moldura fica por cima da arte, com a cor da raridade.
    this.frame = scene.add.rectangle(0, 0, CARD_W, CARD_H).setStrokeStyle(3, this.rarityColor);
    const gem = scene.add.circle(-CARD_W / 2 + 14, -CARD_H / 2 + 14, 16, COLORS.mana).setStrokeStyle(2, 0xffffff);
    this.cost = scene.add.text(gem.x, gem.y, '', { fontSize: '20px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    this.level = scene.add
      .text(CARD_W / 2 - 6, -CARD_H / 2 + 6, '', { fontSize: '13px', fontStyle: 'bold', color: '#fde68a', stroke: '#000000', strokeThickness: 3 })
      .setOrigin(1, 0);
    this.add([this.bg, this.icon, this.nameBar, this.label, this.frame, gem, this.cost, this.level]);
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
    this.icon.setVisible(!this.art).setText(card.icon);
    this.label.setText(card.count > 1 ? `${card.name} ×${card.count}` : card.name);
    this.cost.setText(String(card.cost));
    this.rarityColor = hex(rarityById(card.rarity).color);
    this.frame.setStrokeStyle(3, this.rarityColor);
  }

  setPlayable(on: boolean) {
    this.setAlpha(on ? 1 : 0.45);
  }

  setSelected(on: boolean) {
    this.frame.setStrokeStyle(on ? 5 : 3, on ? COLORS.gold : this.rarityColor);
    this.y = on ? this.baseY - 10 : this.baseY;
  }
}
