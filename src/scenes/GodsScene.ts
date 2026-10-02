import Phaser from 'phaser';
import { backdrop, type Panel } from './theme';
import { COLORS, H, W } from '../config';
import { GOD_CASTLE_HP_PER_LEVEL, GODS, MAX_GOD_LEVEL, describeSpell, rarityById, spellById, type GodId } from '../data/content';
import { canUpgradeSpell, godUpgradeCost, isSpellUnlocked, spellLevel, spellUpgradeCost, upgradeGod, upgradeSpell } from '../meta/progress';
import { getProfile, updateSave } from '../save/save';
import { ArtIcon, button, hex, panel, resourceBar, toast, type Button } from './ui';
import { godFaceKey, spellRoundKey } from './PreloadScene';

interface SpellRow {
  icon: ArtIcon;
  name: Phaser.GameObjects.Text;
  desc: Phaser.GameObjects.Text;
  btn: Button;
}

/** Deuses e magias: subir o deus com essência e as magias com fragmentos e ouro. */
export class GodsScene extends Phaser.Scene {
  private refreshBar!: () => void;
  private selected: GodId = 'ignar';
  private godCards: { id: GodId; bg: Phaser.GameObjects.Rectangle; status: Phaser.GameObjects.Text }[] = [];
  private frame!: Panel;
  private title!: Phaser.GameObjects.Text;
  private sub!: Phaser.GameObjects.Text;
  private levelInfo!: Phaser.GameObjects.Text;
  private godBtn!: Button;
  private rows: SpellRow[] = [];

  constructor() {
    super('Gods');
  }

  create() {
    this.godCards = [];
    this.rows = [];
    backdrop(this);
    this.refreshBar = resourceBar(this);
    button(this, 80, 82, '◀ Início', 0x374151, () => this.scene.start('Home'), { w: 140, h: 44, fontSize: 20 });
    this.add.text(W / 2, 82, 'Deuses e magias', { fontSize: '26px', fontStyle: 'bold', color: '#facc15' }).setOrigin(0.5);

    GODS.forEach((g, i) => {
      const y = 180 + i * 136;
      const bg = this.add.rectangle(170, y, 290, 124, 0x111827).setStrokeStyle(3, 0x374151).setInteractive({ useHandCursor: true });
      new ArtIcon(this, 64, y, 64).set(godFaceKey(g.id), g.icon);
      this.add.text(100, y - 22, g.name, { fontSize: '24px', fontStyle: 'bold', color: g.color }).setOrigin(0, 0.5);
      this.add.text(100, y + 6, g.element, { fontSize: '14px', color: '#94a3b8' }).setOrigin(0, 0.5);
      const status = this.add.text(100, y + 32, '', { fontSize: '15px', fontStyle: 'bold', color: '#fde68a' }).setOrigin(0, 0.5);
      bg.on('pointerdown', () => {
        this.selected = g.id;
        this.refresh();
      });
      this.godCards.push({ id: g.id, bg, status });
    });

    this.frame = panel(this, 340, 112, 920, 594);
    this.title = this.add.text(370, 150, '', { fontSize: '30px', fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.sub = this.add.text(370, 186, '', { fontSize: '15px', color: '#94a3b8', wordWrap: { width: 560 } }).setOrigin(0, 0);
    this.levelInfo = this.add.text(370, 250, '', { fontSize: '16px', color: '#e2e8f0' }).setOrigin(0, 0.5);
    this.godBtn = button(this, 1100, 160, '', 0x7c3aed, () => this.upgradeGod(), { w: 290, h: 56, fontSize: 19 });

    for (let i = 0; i < 5; i++) {
      const y = 320 + i * 76;
      this.add.rectangle(800, y, 896, 68, 0x1f2937).setStrokeStyle(1, 0x374151);
      const icon = new ArtIcon(this, 380, y, 44);
      const name = this.add.text(410, y - 18, '', { fontSize: '17px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0, 0.5);
      const desc = this.add.text(410, y + 2, '', { fontSize: '12px', color: '#cbd5e1', wordWrap: { width: 560 } }).setOrigin(0, 0);
      const btn = button(this, 1124, y, '', 0x15803d, () => this.upgradeSpell(i), { w: 250, h: 50, fontSize: 15 });
      this.rows.push({ icon, name, desc, btn });
    }
    this.refresh();
  }

  private upgradeGod() {
    const p = getProfile();
    const cost = godUpgradeCost(p, this.selected);
    if (!p.gods[this.selected] || cost === null) return;
    if (p.essence < cost) {
      toast(this, `Faltam ${cost - p.essence} de essência`);
      return;
    }
    const unlocked = updateSave((s) => upgradeGod(s, this.selected));
    const level = getProfile().gods[this.selected]!.level;
    const extra = unlocked.length ? ` Nova magia: ${unlocked.map((id) => `${spellById(id)!.icon} ${spellById(id)!.name}`).join(', ')}!` : '';
    toast(this, `Deus subiu para o nível ${level}!${extra}`, 660, '#4ade80');
    this.refresh();
  }

  private upgradeSpell(i: number) {
    const id = GODS.find((g) => g.id === this.selected)!.spells[i];
    const p = getProfile();
    if (!spellUpgradeCost(p, id)) return;
    if (!canUpgradeSpell(p, id)) {
      toast(this, 'Faltam fragmentos ou ouro');
      return;
    }
    updateSave((s) => upgradeSpell(s, id));
    toast(this, `${spellById(id)!.name} subiu para o nível ${spellLevel(getProfile(), id)}!`, 660, '#4ade80');
    this.refresh();
  }

  private refresh() {
    this.refreshBar();
    const p = getProfile();
    for (const c of this.godCards) {
      const g = GODS.find((x) => x.id === c.id)!;
      const owned = p.gods[c.id];
      const on = c.id === this.selected;
      c.bg.setStrokeStyle(on ? 4 : 3, on ? hex(g.color) : 0x374151).setFillStyle(on ? 0x1f2937 : 0x111827);
      c.status.setText(owned ? `Nível ${owned.level}` : `🔒 🏆 ${g.unlockTrophies}`).setColor(owned ? '#fde68a' : '#94a3b8');
    }

    const g = GODS.find((x) => x.id === this.selected)!;
    const owned = p.gods[g.id];
    this.frame.setStrokeStyle(3, hex(g.color));
    this.title.setText(`${g.icon} ${g.name}, ${g.title}`).setColor(g.color);
    this.sub.setText(g.summary);
    const cost = godUpgradeCost(p, g.id);
    if (!owned) {
      this.levelInfo.setText(`🔒 Liberado ao chegar a 🏆 ${g.unlockTrophies} troféus (você tem ${p.bestTrophies}).`);
      this.godBtn.setVisible(false);
    } else {
      const bonus = Math.round(GOD_CASTLE_HP_PER_LEVEL * (owned.level - 1) * 100);
      this.levelInfo.setText(`Nível ${owned.level}/${MAX_GOD_LEVEL}  ·  Vida do castelo +${bonus}% com este deus  ·  ✴️ ${p.essence} de essência`);
      this.godBtn.setVisible(cost !== null);
      if (cost !== null) {
        this.godBtn.setLabel(`Subir deus  ·  ✴️ ${cost}`);
        this.godBtn.setEnabled(p.essence >= cost);
      }
    }

    g.spells.forEach((id, i) => {
      const s = spellById(id)!;
      const row = this.rows[i];
      const unlocked = isSpellUnlocked(p, id);
      const lvl = spellLevel(p, id);
      const frags = p.spells[id]?.fragments ?? 0;
      row.icon.set(spellRoundKey(s.id), s.icon).setDim(!unlocked);
      row.name
        .setText(`${s.name}  ·  ${rarityById(s.rarity).name}${unlocked ? `  ·  Nv ${lvl}` : ''}  ·  🔹 ${frags}`)
        .setColor(unlocked ? '#ffffff' : '#64748b');
      row.desc.setText(describeSpell(s, lvl));
      const c = spellUpgradeCost(p, id);
      if (!unlocked) {
        row.btn.setLabel(owned ? `🔒 Deus nível ${s.godLevel}` : '🔒 Deus bloqueado');
        row.btn.setEnabled(false);
      } else if (!c) {
        row.btn.setLabel('Nível máximo');
        row.btn.setEnabled(false);
      } else {
        row.btn.setLabel(`Nv ${c.level} · 🔹 ${frags}/${c.fragments} · 🪙 ${c.gold}`);
        row.btn.setEnabled(canUpgradeSpell(p, id));
      }
    });
  }
}
