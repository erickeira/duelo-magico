import Phaser from 'phaser';
import { COLORS, W } from '../config';
import { ARENAS, chestById, rarityById, spellById, unitById, type UnitDef } from '../data/content';
import type { ChestReward } from '../meta/chests';
import { accountProgress, currentArena } from '../meta/progress';
import { getProfile } from '../save/save';
import { rarityFrame, type FrameObject } from './frames';
import { cardKey, coverImage } from './PreloadScene';

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

export function resourceBar(scene: Phaser.Scene, y = 24): () => void {
  scene.add.rectangle(W / 2, y, W, 48, 0x111827).setDepth(100);
  const level = scene.add.text(16, y, '', { fontSize: '18px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0, 0.5).setDepth(101);
  const xpBar = scene.add.graphics().setDepth(101);
  const trophies = scene.add.text(380, y, '', { fontSize: '18px', fontStyle: 'bold', color: '#fde68a' }).setOrigin(0, 0.5).setDepth(101);
  const money = scene.add.text(W - 16, y, '', { fontSize: '20px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(1, 0.5).setDepth(101);
  return () => {
    const p = getProfile();
    const xp = accountProgress(p.xp);
    level.setText(`👤 Nv ${xp.level}`);
    xpBar.clear();
    xpBar.fillStyle(0x000000, 0.6).fillRoundedRect(110, y - 7, 200, 14, 6);
    xpBar.fillStyle(0x38bdf8).fillRoundedRect(110, y - 7, xp.needed ? Math.max(4, (200 * xp.current) / xp.needed) : 200, 14, 6);
    const arena = currentArena(p);
    const next = ARENAS[arena.index + 1];
    trophies.setText(`🏆 ${p.trophies}${next ? ` / ${next.trophies}` : ''}   ${arena.icon} ${arena.name}`);
    money.setText(`🪙 ${p.gold}    ✴️ ${p.essence}`);
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
