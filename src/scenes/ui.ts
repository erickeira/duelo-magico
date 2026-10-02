import Phaser from 'phaser';
import { COLORS, W } from '../config';
import { ARENAS, chestById, rarityById, spellById, unitById, type UnitDef } from '../data/content';
import type { ChestReward } from '../meta/chests';
import { accountProgress, currentArena } from '../meta/progress';
import { getProfile } from '../save/save';
import { rarityFrame, type FrameObject } from './frames';
import { cardKey, coverImage } from './PreloadScene';
import { FONT_DISPLAY, Panel, THEME, drawBevel, titleStyle } from './theme';

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
  // Os cinzas antigos (0x374151) viram o azul-ardósia do tema.
  const base = color === 0x374151 ? 0x3a4a86 : color;
  const g = scene.add.graphics();
  const size = opts.fontSize ?? Math.round(h * 0.4);
  const text = scene.add.text(0, 0, label, { ...titleStyle(size, '#ffffff'), strokeThickness: Math.max(3, Math.round(size / 7)) }).setOrigin(0.5);
  const container = scene.add.container(x, y, [g, text]).setSize(w, h).setInteractive({ useHandCursor: true }) as Button;
  let enabled = true;
  let pressed = false;
  const draw = () => {
    const dy = drawBevel(g, w, h, enabled ? base : 0x3b4058, pressed);
    text.setY(dy - 1);
  };
  draw();
  container.on('pointerdown', () => {
    if (!enabled) return;
    pressed = true;
    draw();
  });
  container.on('pointerout', () => {
    pressed = false;
    draw();
  });
  container.on('pointerup', () => {
    pressed = false;
    draw();
    onClick();
  });
  container.setEnabled = (on: boolean) => {
    enabled = on;
    text.setAlpha(on ? 1 : 0.55);
    draw();
  };
  container.setLabel = (t: string) => text.setText(t);
  return container;
}

/** Mensagem curta que aparece e some. */
export function toast(scene: Phaser.Scene, message: string, y = 660, color = '#fde68a') {
  const t = scene.add
    .text(W / 2, y, message, { ...titleStyle(24, color), backgroundColor: '#0e1328e6', padding: { x: 18, y: 8 } })
    .setOrigin(0.5)
    .setDepth(200);
  scene.tweens.add({ targets: t, alpha: 0, y: y - 30, delay: 1200, duration: 500, onComplete: () => t.destroy() });
}

/** Painel ornamentado (ver theme.ts). Origem no canto superior esquerdo. */
export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, accent: number = THEME.gold) {
  return new Panel(scene, x, y, w, h, { accent: accent === 0x374151 ? THEME.gold : accent });
}

/** Miniatura de tropa: arte, moldura da raridade, custo e nome. Também serve de espaço vazio do deck. */
export class UnitTile extends Phaser.GameObjects.Container {
  unit: UnitDef | null = null;
  private bg: Phaser.GameObjects.Rectangle;
  private art: Phaser.GameObjects.Image | null = null;
  private icon: Phaser.GameObjects.Text;
  private nameBar: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private deckTint: Phaser.GameObjects.Rectangle;
  /** Contorno simples: espaço vazio do deck ou reserva se a moldura ornamentada não carregar. */
  private frame: Phaser.GameObjects.Rectangle;
  private ornament: FrameObject | null = null;
  /** Brilho dourado em volta da carta selecionada. */
  private glow: Phaser.GameObjects.Rectangle;
  private readonly border: number;
  private cost: Phaser.GameObjects.Text;
  private gem: Phaser.GameObjects.Arc;
  private mark: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;
  private lock: Phaser.GameObjects.Text;
  private upArrow: Phaser.GameObjects.Text;
  private highlighted = false;
  private locked = false;

  constructor(scene: Phaser.Scene, x: number, y: number, readonly w: number, readonly h: number) {
    super(scene, x, y);
    const outline = { stroke: '#000000', strokeThickness: 3 };
    this.border = Math.max(6, Math.round(w * 0.09));
    const barH = Math.max(18, Math.round(h * 0.2));
    this.bg = scene.add.rectangle(0, 0, w, h, 0x1f2937);
    this.icon = scene.add.text(0, -h * 0.1, '', { fontSize: `${Math.round(h * 0.36)}px` }).setOrigin(0.5);
    this.nameBar = scene.add.rectangle(0, h / 2 - barH / 2 - this.border + 2, w - this.border * 2 + 2, barH, 0x000000, 0.65);
    this.label = scene.add
      .text(0, h / 2 - barH / 2 - this.border + 2, '', { fontSize: `${Math.max(10, Math.round(h * 0.1))}px`, fontStyle: 'bold', color: '#ffffff', align: 'center', wordWrap: { width: w - 6 } })
      .setOrigin(0.5);
    this.deckTint = scene.add.rectangle(0, 0, w, h, 0x16a34a, 0.35).setVisible(false);
    this.frame = scene.add.rectangle(0, 0, w, h).setStrokeStyle(3, 0x4b5563);
    this.glow = scene.add.rectangle(0, 0, w + 8, h + 8).setStrokeStyle(4, COLORS.gold).setVisible(false);
    this.gem = scene.add.circle(-w / 2 + 12, -h / 2 + 12, 12, COLORS.mana).setStrokeStyle(2, 0xffffff);
    this.cost = scene.add.text(this.gem.x, this.gem.y, '', { fontSize: '15px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    this.mark = scene.add.text(0, -h / 2 + 2, '', { fontSize: '16px', color: '#4ade80', fontStyle: 'bold', ...outline }).setOrigin(0.5, 0);
    this.levelText = scene.add.text(w / 2 - 4, -h / 2 + 3, '', { fontSize: '12px', fontStyle: 'bold', color: '#fde68a', ...outline }).setOrigin(1, 0);
    this.upArrow = scene.add.text(w / 2 - 4, h * 0.12, '', { fontSize: '18px', fontStyle: 'bold', color: '#4ade80', ...outline }).setOrigin(1, 0.5);
    this.lock = scene.add.text(0, -h * 0.1, '', { fontSize: `${Math.round(h * 0.28)}px` }).setOrigin(0.5);
    this.add([this.bg, this.icon, this.nameBar, this.label, this.deckTint, this.frame, this.glow, this.gem, this.cost, this.mark, this.levelText, this.upArrow, this.lock]);
    this.setSize(w, h);
    this.setInteractive({ useHandCursor: true });
    scene.add.existing(this);
  }

  setUnit(unit: UnitDef | null) {
    if (unit?.id !== this.unit?.id) {
      this.art?.destroy();
      const inset = Math.round(this.border * 0.5);
      this.art = unit ? coverImage(this.scene, cardKey(unit.id), this.w - inset * 2, this.h - inset * 2) : null;
      if (this.art) this.addAt(this.art, 1);
      if (unit?.rarity !== this.unit?.rarity) {
        this.ornament?.destroy();
        this.ornament = unit ? rarityFrame(this.scene, unit.rarity, this.w, this.h, this.border) : null;
        if (this.ornament) this.addAt(this.ornament, this.getIndex(this.frame));
      }
    }
    this.unit = unit;
    this.icon.setVisible(!this.art).setText(unit ? unit.icon : '+').setColor(unit ? '#ffffff' : '#4b5563');
    this.nameBar.setVisible(!!unit);
    this.label.setText(unit ? unit.name : '');
    this.cost.setText(unit ? String(unit.cost) : '');
    this.gem.setVisible(!!unit);
    this.applyLock();
    this.redrawBorder();
    return this;
  }

  setHighlight(on: boolean) {
    this.highlighted = on;
    this.redrawBorder();
    return this;
  }

  /** Nível da carta (null = não mostrar). */
  setLevel(level: number | null) {
    this.levelText.setText(level ? `Nv${level}` : '');
    return this;
  }

  /** Tropa ainda não conquistada: aparece escurecida, com cadeado. */
  setLocked(on: boolean) {
    this.locked = on;
    this.applyLock();
    return this;
  }

  /** Seta verde quando dá para subir de nível. */
  setUpgradable(on: boolean) {
    this.upArrow.setText(on ? '▲' : '');
    return this;
  }

  /** Marca a tropa como já presente no deck. */
  setInDeck(on: boolean) {
    this.mark.setText(on ? '✓' : '');
    this.deckTint.setVisible(on);
    return this;
  }

  private applyLock() {
    this.lock.setText(this.locked ? '🔒' : '');
    if (this.locked) this.art?.setTint(0x3f3f46);
    else this.art?.clearTint();
    this.icon.setAlpha(this.locked ? 0.25 : 1);
    this.label.setAlpha(this.locked ? 0.6 : 1);
    this.ornament?.setAlpha(this.locked ? 0.55 : 1);
  }

  private redrawBorder() {
    // Com moldura ornamentada, o contorno simples some e a seleção vira um brilho dourado por fora.
    this.glow.setVisible(this.highlighted && !!this.ornament);
    const color = this.highlighted ? COLORS.gold : this.unit ? hex(rarityById(this.unit.rarity).color) : 0x374151;
    this.frame.setStrokeStyle(this.highlighted ? 5 : 3, color).setVisible(!this.ornament);
  }
}

/** Barra superior das telas de menu: nível, troféus/arena e moedas, em "pílulas" com borda dourada. */
export function resourceBar(scene: Phaser.Scene, y = 26): () => void {
  const g = scene.add.graphics().setDepth(100);
  g.fillGradientStyle(0x1a2140, 0x1a2140, 0x0c1024, 0x0c1024, 0.96).fillRect(0, 0, W, 52);
  g.lineStyle(2, THEME.gold, 0.9).lineBetween(0, 52, W, 52);
  g.lineStyle(1, THEME.goldDark, 1).lineBetween(0, 55, W, 55);
  const pill = (x: number, w: number) => {
    g.fillStyle(0x000000, 0.45).fillRoundedRect(x, y - 16, w, 32, 16);
    g.lineStyle(1.5, THEME.goldDark, 1).strokeRoundedRect(x, y - 16, w, 32, 16);
  };
  pill(12, 330);
  pill(360, 420);
  pill(W - 290, 278);
  // Medalha do nível.
  g.fillStyle(0x2563eb).fillCircle(32, y, 20).lineStyle(3, THEME.gold).strokeCircle(32, y, 20);
  const level = scene.add.text(32, y, '', titleStyle(18, '#ffffff')).setOrigin(0.5).setDepth(101);
  const xpBar = scene.add.graphics().setDepth(101);
  const trophies = scene.add.text(378, y, '', { fontFamily: FONT_DISPLAY, fontSize: '19px', color: THEME.goldText }).setOrigin(0, 0.5).setDepth(101);
  const money = scene.add.text(W - 26, y, '', { fontFamily: FONT_DISPLAY, fontSize: '20px', color: '#ffffff' }).setOrigin(1, 0.5).setDepth(101);
  return () => {
    const p = getProfile();
    const xp = accountProgress(p.xp);
    level.setText(String(xp.level));
    xpBar.clear();
    const frac = xp.needed ? Math.max(0.03, xp.current / xp.needed) : 1;
    xpBar.fillStyle(0x000000, 0.7).fillRoundedRect(62, y - 7, 266, 14, 7);
    xpBar.fillGradientStyle(0x7dd3fc, 0x7dd3fc, 0x0284c7, 0x0284c7, 1).fillRoundedRect(62, y - 7, 266 * frac, 14, 7);
    const arena = currentArena(p);
    const next = ARENAS[arena.index + 1];
    trophies.setText(`🏆 ${p.trophies}${next ? ` / ${next.trophies}` : ''}    ${arena.icon} ${arena.name}`);
    money.setText(`🪙 ${p.gold}     ✴️ ${p.essence}`);
  };
}

/** Janela com o conteúdo de um baú aberto. */
export function showChestReward(scene: Phaser.Scene, r: ChestReward, onClose: () => void) {
  const chest = chestById(r.chest)!;
  const layer = scene.add.container(0, 0).setDepth(300);
  const shade = scene.add.rectangle(W / 2, 360, W, 720, 0x000000, 0.7).setInteractive();
  const box = scene.add.rectangle(W / 2, 360, 900, 560, 0x111827).setStrokeStyle(4, COLORS.gold);
  const title = scene.add.text(W / 2, 120, `${chest.icon} ${chest.name}`, { fontSize: '34px', fontStyle: 'bold', color: '#facc15' }).setOrigin(0.5);
  const totals = scene.add
    .text(W / 2, 170, `🪙 +${r.gold} ouro     ✴️ +${r.essence} essência     🃏 ${r.cards.reduce((s, c) => s + c.count, 0)} cartas`, {
      fontSize: '22px', color: '#ffffff',
    })
    .setOrigin(0.5);
  layer.add([shade, box, title, totals]);
  r.cards.slice(0, 14).forEach((c, i) => {
    const def = unitById(c.id)!;
    const x = W / 2 + ((i % 7) - 3) * 116;
    const y = 270 + Math.floor(i / 7) * 130;
    const tile = new UnitTile(scene, x, y, 96, 112).setUnit(def);
    tile.disableInteractive();
    const count = scene.add
      .text(x, y + 66, c.isNew ? `NOVA! ×${c.count}` : `×${c.count}`, { fontSize: '16px', fontStyle: 'bold', color: c.isNew ? '#4ade80' : '#ffffff' })
      .setOrigin(0.5);
    layer.add([tile, count]);
  });
  const frags = r.fragments.map((f) => `${spellById(f.id)!.icon} ${spellById(f.id)!.name} +${f.count}`).join('     ');
  if (frags) layer.add(scene.add.text(W / 2, 545, `🔹 Fragmentos: ${frags}`, { fontSize: '18px', color: '#bae6fd' }).setOrigin(0.5));
  const ok = button(scene, W / 2, 600, 'OK', COLORS.player, () => {
    layer.destroy();
    onClose();
  }, { w: 200, h: 56 });
  layer.add(ok);
  return layer;
}

/** Ícone que mostra a arte (se a textura existir) ou cai de volta no emoji. Pode trocar de conteúdo. */
export class ArtIcon extends Phaser.GameObjects.Container {
  private img: Phaser.GameObjects.Image;
  private txt: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, readonly size: number) {
    super(scene, x, y);
    this.img = scene.add.image(0, 0, '__DEFAULT').setVisible(false);
    this.txt = scene.add.text(0, 0, '', { fontSize: `${Math.round(size * 0.8)}px` }).setOrigin(0.5);
    this.add([this.img, this.txt]);
    scene.add.existing(this);
  }

  set(key: string | null, emoji: string) {
    const hasArt = !!key && this.scene.textures.exists(key);
    if (hasArt) this.img.setTexture(key!).setDisplaySize(this.size, this.size);
    this.img.setVisible(hasArt);
    this.txt.setVisible(!hasArt).setText(emoji);
    return this;
  }

  setDim(on: boolean) {
    this.img.setAlpha(on ? 0.35 : 1);
    this.txt.setAlpha(on ? 0.35 : 1);
    return this;
  }
}
