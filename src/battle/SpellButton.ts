import Phaser from 'phaser';
import { COLORS } from '../config';
import type { SpellDef } from '../data/content';

const R = 40;

/** Botão redondo de magia com anel de recarga e segundos restantes. */
export class SpellButton extends Phaser.GameObjects.Container {
  private ring: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private bg: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number, readonly spell: SpellDef, godColor: number) {
    super(scene, x, y);
    this.bg = scene.add.circle(0, 0, R, 0x1f2937).setStrokeStyle(3, godColor);
    const icon = scene.add.text(0, -4, spell.icon, { fontSize: '40px' }).setOrigin(0.5);
    this.ring = scene.add.graphics();
    this.label = scene.add
      .text(0, 0, '', { fontSize: '24px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 4 })
      .setOrigin(0.5);
    const name = scene.add
      .text(0, R + 16, spell.name, { fontSize: '12px', color: '#cbd5e1', align: 'center', wordWrap: { width: R * 2 + 16 } })
      .setOrigin(0.5);
    this.add([this.bg, icon, this.ring, this.label, name]);
    this.setSize(R * 2, R * 2);
    scene.add.existing(this);
    this.setDepth(50);
  }

  /** `remaining` = segundos até poder usar; `total` = duração da recarga atual. */
  refresh(remaining: number, total: number, selected: boolean) {
    const ready = remaining <= 0;
    this.ring.clear();
    if (!ready) {
      const frac = Phaser.Math.Clamp(remaining / total, 0, 1);
      this.ring.fillStyle(0x000000, 0.6);
      this.ring.slice(0, 0, R, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2, false).fillPath();
    } else {
      this.ring.lineStyle(selected ? 5 : 3, selected ? COLORS.gold : 0xfef3c7, 1).strokeCircle(0, 0, R + 3);
    }
    this.label.setText(ready ? '' : String(Math.ceil(remaining)));
    this.setScale(selected ? 1.1 : 1);
  }
}
