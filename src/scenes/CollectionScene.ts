import Phaser from 'phaser';
import { COLORS, H, W } from '../config';
import { ARENAS, MAX_UNIT_LEVEL, ROLE_LABELS, UNITS, WORLDS, rarityById, spellById, unitById, worldById, type UnitDef } from '../data/content';
import { scaledStats } from '../battle/Loadout';
import { canUpgradeUnit, unitUpgradeCost, upgradeUnit } from '../meta/progress';
import { getProfile, updateSave } from '../save/save';
import { rarityFrame, type FrameObject } from './frames';
import { cardKey, coverImage } from './PreloadScene';
import { button, hex, panel, resourceBar, toast, UnitTile, type Button } from './ui';

const COLS = 6;
const TILE_W = 118;
const TILE_H = 136;

/** Coleção: todas as tropas (conquistadas ou não), com ficha detalhada e upgrade. */
export class CollectionScene extends Phaser.Scene {
  private refreshBar!: () => void;
  private tiles: UnitTile[] = [];
  private filterTabs: { id: string; bg: Phaser.GameObjects.Rectangle }[] = [];
  private worldFilter = '';
  private selected: UnitDef = UNITS[0];
  private detailFrame!: Phaser.GameObjects.Rectangle;
  private detailIcon!: Phaser.GameObjects.Text;
  private detailArt: Phaser.GameObjects.Image | null = null;
  private artFrame!: Phaser.GameObjects.Rectangle;
  private detailOrnament: FrameObject | null = null;
  private detailName!: Phaser.GameObjects.Text;
  private detailBody!: Phaser.GameObjects.Text;
  private detailMeta!: Phaser.GameObjects.Text;
  private upgradeBtn!: Button;

  constructor() {
    super('Collection');
  }

  create() {
    this.tiles = [];
    this.filterTabs = [];
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b1020);
    this.refreshBar = resourceBar(this);
    button(this, 80, 82, '◀ Início', 0x374151, () => this.scene.start('Home'), { w: 140, h: 44, fontSize: 20 });

    const filters = [{ id: '', label: 'Todas' }, ...WORLDS.map((w) => ({ id: w.id, label: `${w.icon} ${w.name}` }))];
    filters.forEach((f, i) => {
      const x = 240 + i * 150;
      const bg = this.add.rectangle(x, 82, 142, 40, 0x111827).setStrokeStyle(2, 0x374151).setInteractive({ useHandCursor: true });
      this.add.text(x, 82, f.label, { fontSize: '14px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
      bg.on('pointerdown', () => {
        this.worldFilter = f.id;
        this.refresh();
      });
      this.filterTabs.push({ id: f.id, bg });
    });

    for (const u of UNITS) {
      const tile = new UnitTile(this, 0, 0, TILE_W, TILE_H).setUnit(u);
      tile.on('pointerdown', () => {
        this.selected = u;
        this.refresh();
      });
      this.tiles.push(tile);
    }

    this.detailFrame = panel(this, 820, 58, 444, 648);
    this.detailIcon = this.add.text(906, 170, '', { fontSize: '60px' }).setOrigin(0.5);
    this.artFrame = this.add.rectangle(906, 170, 146, 194).setStrokeStyle(3, 0x4b5563).setDepth(2);
    this.detailName = this.add.text(990, 82, '', { fontSize: '22px', fontStyle: 'bold', color: '#ffffff', wordWrap: { width: 260 } });
    this.detailBody = this.add.text(836, 278, '', { fontSize: '13px', color: '#e2e8f0', wordWrap: { width: 412 }, lineSpacing: 3 });
    this.detailMeta = this.add.text(990, 150, '', { fontSize: '14px', color: '#cbd5e1', wordWrap: { width: 260 }, lineSpacing: 4 });
    this.upgradeBtn = button(this, 1042, 666, '', 0x15803d, () => this.upgrade(), { w: 400, h: 54, fontSize: 19 });
    this.refresh();
  }

  private upgrade() {
    const u = this.selected;
    const cost = unitUpgradeCost(getProfile(), u.id);
    if (!cost) return;
    if (!canUpgradeUnit(getProfile(), u.id)) {
      toast(this, 'Faltam cartas ou ouro', 600);
      return;
    }
    const xp = updateSave((s) => upgradeUnit(s, u.id));
    toast(this, `${u.icon} ${u.name} subiu para o nível ${cost.level}! +${xp} XP`, 600, '#4ade80');
    this.refresh();
  }

  private refresh() {
    this.refreshBar();
    const p = getProfile();
    for (const f of this.filterTabs) {
      const on = f.id === this.worldFilter;
      f.bg.setStrokeStyle(on ? 3 : 2, on ? COLORS.gold : 0x374151).setFillStyle(on ? 0x1f2937 : 0x111827);
    }
    let n = 0;
    for (const tile of this.tiles) {
      const u = tile.unit!;
      const visible = !this.worldFilter || u.world === this.worldFilter;
      tile.setVisible(visible);
      if (!visible) continue;
      tile.setPosition(78 + (n % COLS) * 128, 190 + Math.floor(n / COLS) * 146);
      tile.setHighlight(u === this.selected).setLocked(!p.units[u.id]).setLevel(p.units[u.id]?.level ?? null).setUpgradable(canUpgradeUnit(p, u.id));
      n++;
    }
    this.showDetail(this.selected);
  }

  private showDetail(u: UnitDef) {
    const p = getProfile();
    const owned = p.units[u.id];
    const rarity = rarityById(u.rarity);
    const world = worldById(u.world);
    const level = owned?.level ?? rarity.startLevel;
    const s = scaledStats(u, level);
    const names = (ids: string[]) => ids.map((id) => unitById(id)?.name ?? spellById(id)?.name ?? id).join(', ');
    const fmt = (n: number) => String(n).replace('.', ',');
    const dps = Math.round((s.damage / u.attackInterval) * u.count);
    const cost = unitUpgradeCost(p, u.id);

    this.detailFrame.setStrokeStyle(3, hex(rarity.color));
    this.artFrame.setStrokeStyle(3, hex(rarity.color));
    this.detailArt?.destroy();
    this.detailArt = coverImage(this, cardKey(u.id), 140, 188, 906, 170);
    if (this.detailArt && !owned) this.detailArt.setTint(0x3f3f46);
    this.detailOrnament?.destroy();
    this.detailOrnament = rarityFrame(this, u.rarity, 154, 202, 16);
    this.detailOrnament?.setPosition(906, 170).setDepth(2);
    this.artFrame.setVisible(!this.detailOrnament);
    this.detailIcon.setText(this.detailArt ? (owned ? '' : '🔒') : u.icon).setAlpha(owned || this.detailArt ? 1 : 0.35).setDepth(3);
    this.detailName.setText(`${u.name}${u.count > 1 ? ` ×${u.count}` : ''}\n${owned ? `Nível ${level}` : '🔒 Não conquistada'}`);

    const progress = !owned
      ? `🔒 Cai nos baús a partir da arena ${ARENAS[u.arena].icon} ${ARENAS[u.arena].name} (🏆 ${ARENAS[u.arena].trophies}).`
      : cost
        ? `🃏 Cartas ${owned.cards}/${cost.cards}   ·   próximo nível: +8% vida e dano`
        : `Nível máximo (${MAX_UNIT_LEVEL})!`;
    this.detailMeta.setText(
      `${rarity.name}\n${world.icon} ${world.name}\n💧 ${u.cost} de mana\n${u.roles.map((r) => ROLE_LABELS[r]).join(', ')}${u.targetsAir && !u.flying ? '\nAcerta voadores' : ''}`,
    ).setColor(rarity.color);
    const lines = [
      progress,
      '',
      u.description,
      '',
      `Vida ${s.hp}${u.count > 1 ? ' (cada)' : ''}  ·  Dano ${s.damage}  ·  a cada ${fmt(u.attackInterval)}s`,
      `DPS total ${dps}  ·  Alcance ${u.range <= 40 ? 'corpo a corpo' : u.range}  ·  Velocidade ${u.speed || 'parada'}`,
      [u.splash && `Área ${u.splash}`, u.lifetime && `Dura ${u.lifetime}s`, u.flying && 'Voa'].filter(Boolean).join('  ·  '),
      u.ability ? `\n✦ ${u.ability.name}: ${u.ability.description}` : '',
      '',
      `✅ Forte contra: ${names(u.strongAgainst)}`,
      `❌ Fraco contra: ${names(u.weakAgainst)}`,
    ];
    this.detailBody.setText(lines.filter((l, i, arr) => l !== '' || arr[i - 1] !== '').join('\n'));

    this.upgradeBtn.setVisible(!!owned && !!cost);
    if (owned && cost) {
      this.upgradeBtn.setLabel(`Subir para Nv ${cost.level}  ·  🃏 ${cost.cards}  🪙 ${cost.gold}`);
      this.upgradeBtn.setEnabled(canUpgradeUnit(p, u.id));
    }
  }
}
