import Phaser from 'phaser';
import { COLORS, W } from '../config';
import { ARENAS, chestById, rarityById, spellById, unitById, type UnitDef } from '../data/content';
import type { ChestReward } from '../meta/chests';
import { accountProgress, currentArena } from '../meta/progress';
import { getProfile } from '../save/save';

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
  private levelText: Phaser.GameObjects.Text;
  private lock: Phaser.GameObjects.Text;
  private upArrow: Phaser.GameObjects.Text;
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
    this.mark = scene.add.text(0, -h / 2 + 2, '', { fontSize: '14px', color: '#4ade80', fontStyle: 'bold' }).setOrigin(0.5, 0);
    this.levelText = scene.add.text(w / 2 - 4, -h / 2 + 3, '', { fontSize: '12px', fontStyle: 'bold', color: '#fde68a' }).setOrigin(1, 0);
    this.upArrow = scene.add.text(w / 2 - 4, h * 0.12, '', { fontSize: '16px', fontStyle: 'bold', color: '#4ade80' }).setOrigin(1, 0.5);
    this.lock = scene.add.text(0, -h * 0.1, '', { fontSize: `${Math.round(h * 0.28)}px` }).setOrigin(0.5);
    this.add([this.bg, this.icon, this.label, this.gem, this.cost, this.mark, this.levelText, this.upArrow, this.lock]);
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

  /** Nível da carta (null = não mostrar). */
  setLevel(level: number | null) {
    this.levelText.setText(level ? `Nv${level}` : '');
    return this;
  }

  /** Tropa ainda não conquistada: aparece apagada, com cadeado. */
  setLocked(on: boolean) {
    this.lock.setText(on ? '🔒' : '');
    this.icon.setAlpha(on ? 0.25 : 1);
    this.label.setAlpha(on ? 0.5 : 1);
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
    this.bg.setFillStyle(on ? 0x14532d : 0x1f2937);
    return this;
  }

  private redrawBorder() {
    const color = this.highlighted ? COLORS.gold : this.unit ? hex(rarityById(this.unit.rarity).color) : 0x374151;
    this.bg.setStrokeStyle(this.highlighted ? 5 : 3, color);
  }
}

/** Barra superior com nível de conta, troféus/arena, ouro e essência. Retorna uma função para atualizar. */
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
