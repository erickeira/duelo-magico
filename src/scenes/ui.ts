import Phaser from 'phaser';
import { COLORS, W } from '../config';
import { rarityById, type UnitDef } from '../data/content';

export const hex = (css: string) => Number.parseInt(css.slice(1), 16);

interface ButtonOptions {
  w?: number;
  h?: number;
  fontSize?: number;
}

export type Button = Phaser.GameObjects.Container & { setEnabled(on: boolean): void; setLabel(text: string): void };

export function button(
  scene: Phaser.Scene, x: number, y: number, label: string, color: number, onClick: () => void, opts: ButtonOptions = {},
): Button {
  const w = opts.w ?? 360;
  const h = opts.h ?? 90;
  const bg = scene.add.rectangle(0, 0, w, h, color).setStrokeStyle(Math.max(2, h / 22), 0xffffff, 0.8);
  const text = scene.add.text(0, 0, label, { fontSize: `${opts.fontSize ?? Math.round(h * 0.38)}px`, fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
  const container = scene.add.container(x, y, [bg, text]).setSize(w, h).setInteractive({ useHandCursor: true }) as Button;
  let enabled = true;
  container.on('pointerdown', () => enabled && container.setScale(0.95));
  container.on('pointerout', () => container.setScale(1));
  container.on('pointerup', () => {
    container.setScale(1);
    onClick();
  });
  container.setEnabled = (on: boolean) => {
    enabled = on;
    container.setAlpha(on ? 1 : 0.45);
  };
  container.setLabel = (t: string) => text.setText(t);
  return container;
}

/** Mensagem curta que aparece e some. */
export function toast(scene: Phaser.Scene, message: string, y = 660, color = '#fde68a') {
  const t = scene.add
    .text(W / 2, y, message, { fontSize: '22px', fontStyle: 'bold', color, stroke: '#000000', strokeThickness: 5, backgroundColor: '#111827cc', padding: { x: 12, y: 6 } })
    .setOrigin(0.5)
    .setDepth(200);
  scene.tweens.add({ targets: t, alpha: 0, y: y - 30, delay: 1200, duration: 500, onComplete: () => t.destroy() });
}

/** Retângulo de fundo com borda, para painéis. */
export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, stroke = 0x374151) {
  return scene.add.rectangle(x, y, w, h, 0x111827).setStrokeStyle(2, stroke).setOrigin(0);
}

/** Miniatura de tropa: moldura da raridade, ícone, custo e nome. Também serve de espaço vazio do deck. */
export class UnitTile extends Phaser.GameObjects.Container {
  unit: UnitDef | null = null;
  private bg: Phaser.GameObjects.Rectangle;
  private icon: Phaser.GameObjects.Text;
  private label: Phaser.GameObjects.Text;
  private cost: Phaser.GameObjects.Text;
  private gem: Phaser.GameObjects.Arc;
  private mark: Phaser.GameObjects.Text;
  private highlighted = false;

  constructor(scene: Phaser.Scene, x: number, y: number, readonly w: number, readonly h: number) {
    super(scene, x, y);
    this.bg = scene.add.rectangle(0, 0, w, h, 0x1f2937).setStrokeStyle(3, 0x4b5563);
    this.icon = scene.add.text(0, -h * 0.1, '', { fontSize: `${Math.round(h * 0.36)}px` }).setOrigin(0.5);
    this.label = scene.add
      .text(0, h / 2 - 16, '', { fontSize: `${Math.max(11, Math.round(h * 0.11))}px`, fontStyle: 'bold', color: '#e5e7eb', align: 'center', wordWrap: { width: w - 6 } })
      .setOrigin(0.5);
    this.gem = scene.add.circle(-w / 2 + 12, -h / 2 + 12, 12, COLORS.mana).setStrokeStyle(2, 0xffffff);
    this.cost = scene.add.text(this.gem.x, this.gem.y, '', { fontSize: '15px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    this.mark = scene.add.text(w / 2 - 6, -h / 2 + 4, '', { fontSize: '16px', color: '#4ade80', fontStyle: 'bold' }).setOrigin(1, 0);
    this.add([this.bg, this.icon, this.label, this.gem, this.cost, this.mark]);
    this.setSize(w, h);
    this.setInteractive({ useHandCursor: true });
    scene.add.existing(this);
  }

  setUnit(unit: UnitDef | null) {
    this.unit = unit;
    this.icon.setText(unit ? unit.icon : '+').setColor(unit ? '#ffffff' : '#4b5563');
    this.label.setText(unit ? unit.name : '');
    this.cost.setText(unit ? String(unit.cost) : '');
    this.gem.setVisible(!!unit);
    this.redrawBorder();
    return this;
  }

  setHighlight(on: boolean) {
    this.highlighted = on;
    this.redrawBorder();
    return this;
  }

  /** Marca a tropa como já presente no deck. */
  setInDeck(on: boolean) {
    this.mark.setText(on ? '✓' : '');
    this.bg.setFillStyle(on ? 0x14532d : 0x1f2937);
    return this;
  }

  private redrawBorder() {
    const color = this.highlighted ? COLORS.gold : this.unit ? hex(rarityById(this.unit.rarity).color) : 0x374151;
    this.bg.setStrokeStyle(this.highlighted ? 5 : 3, color);
  }
}
