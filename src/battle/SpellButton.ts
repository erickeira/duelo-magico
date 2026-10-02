import Phaser from 'phaser';
import { COLORS } from '../config';
import type { SpellDef } from '../data/content';
import { spellRoundKey } from '../scenes/PreloadScene';
import { ArtIcon } from '../scenes/ui';
import { FONT_DISPLAY, THEME, shade } from '../scenes/theme';

const R = 40;

/** Botão redondo de magia com anel de recarga e segundos restantes. */
export class SpellButton extends Phaser.GameObjects.Container {
  private ring: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private bg: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number, readonly spell: SpellDef, godColor: number) {
    super(scene, x, y);
    // Base: sombra, aro dourado grosso e um anel fino na cor do deus.
    const base = scene.add.graphics();
    base.fillStyle(0x000000, 0.5).fillCircle(2, 4, R + 6);
    base.fillGradientStyle(THEME.goldLight, THEME.goldLight, THEME.goldDark, THEME.goldDark, 1).fillCircle(0, 0, R + 5);
    base.lineStyle(2, shade(godColor, 0.2), 1).strokeCircle(0, 0, R + 1);
    this.add(base);
    this.bg = scene.add.circle(0, 0, R, 0x1f2937);
    const icon = new ArtIcon(scene, 0, 0, R * 2 - 6).set(spellRoundKey(spell.id), spell.icon);
    this.ring = scene.add.graphics();
    this.label = scene.add
      .text(0, 0, '', { fontFamily: FONT_DISPLAY, fontSize: '28px', color: '#ffffff', stroke: '#000000', strokeThickness: 5 })
      .setOrigin(0.5);
    const name = scene.add
      .text(0, R + 18, spell.name, { fontFamily: FONT_DISPLAY, fontSize: '13px', color: '#e8ecff', stroke: '#000000', strokeThickness: 3, align: 'center', wordWrap: { width: R * 2 + 20 } })
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
      if (selected) this.ring.lineStyle(5, COLORS.gold, 1).strokeCircle(0, 0, R + 8);
    }
    this.label.setText(ready ? '' : String(Math.ceil(remaining)));
    this.setScale(selected ? 1.1 : 1);
  }
}
