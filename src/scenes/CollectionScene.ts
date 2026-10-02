import Phaser from 'phaser';
import { COLORS, H, W } from '../config';
import { ARENAS, ROLE_LABELS, UNITS, WORLDS, rarityById, spellById, unitById, worldById, type UnitDef } from '../data/content';
import { button, hex, panel, UnitTile } from './ui';

const COLS = 6;
const TILE_W = 118;
const TILE_H = 136;

/** Coleção: todas as tropas, filtráveis por mundo, com ficha detalhada. */
export class CollectionScene extends Phaser.Scene {
  private tiles: UnitTile[] = [];
  private filterTabs: { id: string; bg: Phaser.GameObjects.Rectangle }[] = [];
  private worldFilter = '';
  private selected: UnitDef = UNITS[0];
  private detailFrame!: Phaser.GameObjects.Rectangle;
  private detailIcon!: Phaser.GameObjects.Text;
  private detailName!: Phaser.GameObjects.Text;
  private detailBody!: Phaser.GameObjects.Text;

  constructor() {
    super('Collection');
  }

  create() {
    this.tiles = [];
    this.filterTabs = [];
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b1020);
    button(this, 80, 34, '◀ Início', 0x374151, () => this.scene.start('Home'), { w: 140, h: 46, fontSize: 20 });
    this.add.text(W / 2, 34, `Coleção · ${UNITS.length} tropas`, { fontSize: '28px', fontStyle: 'bold', color: '#facc15' }).setOrigin(0.5);

    const filters = [{ id: '', label: 'Todas' }, ...WORLDS.map((w) => ({ id: w.id, label: `${w.icon} ${w.name}` }))];
    filters.forEach((f, i) => {
      const x = 100 + i * 190;
      const bg = this.add.rectangle(x, 90, 180, 38, 0x111827).setStrokeStyle(2, 0x374151).setInteractive({ useHandCursor: true });
      this.add.text(x, 90, f.label, { fontSize: '16px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
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

    this.detailFrame = panel(this, 820, 70, 444, 636);
    this.detailIcon = this.add.text(870, 120, '', { fontSize: '64px' }).setOrigin(0.5);
    this.detailName = this.add.text(915, 104, '', { fontSize: '26px', fontStyle: 'bold', color: '#ffffff', wordWrap: { width: 330 } }).setOrigin(0, 0);
    this.detailBody = this.add
      .text(836, 175, '', { fontSize: '15px', color: '#e2e8f0', wordWrap: { width: 412 }, lineSpacing: 5 })
      .setOrigin(0, 0);
    this.refresh();
  }

  private refresh() {
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
      tile.setPosition(78 + (n % COLS) * 128, 196 + Math.floor(n / COLS) * 146);
      tile.setHighlight(u === this.selected);
      n++;
    }
    this.showDetail(this.selected);
  }

  private showDetail(u: UnitDef) {
    const rarity = rarityById(u.rarity);
    const world = worldById(u.world);
    const names = (ids: string[]) => ids.map((id) => unitById(id)?.name ?? spellById(id)?.name ?? id).join(', ');
    const fmt = (n: number) => String(n).replace('.', ',');
    const dps = Math.round((u.damage / u.attackInterval) * u.count);
    this.detailFrame.setStrokeStyle(3, hex(rarity.color));
    this.detailIcon.setText(u.icon);
    this.detailName.setText(`${u.name}${u.count > 1 ? ` ×${u.count}` : ''}`);
    const lines = [
      `${rarity.name} · ${world.icon} ${world.name} · 💧 ${u.cost} de mana`,
      u.roles.map((r) => ROLE_LABELS[r]).join(', ') + (u.targetsAir && !u.flying ? ' · acerta voadores' : ''),
      '',
      u.description,
      '',
      `Vida ${u.hp}${u.count > 1 ? ' (cada)' : ''}   ·   Dano ${u.damage}   ·   a cada ${fmt(u.attackInterval)}s`,
      `DPS total ${dps}   ·   Alcance ${u.range <= 40 ? 'corpo a corpo' : u.range}   ·   Velocidade ${u.speed || 'parada'}`,
      [u.splash && `Área ${u.splash}`, u.lifetime && `Dura ${u.lifetime}s`, u.flying && 'Voa'].filter(Boolean).join('   ·   '),
      '',
      u.ability ? `✦ ${u.ability.name}: ${u.ability.description}` : '',
      '',
      `✅ Forte contra: ${names(u.strongAgainst)}`,
      `❌ Fraco contra: ${names(u.weakAgainst)}`,
      '',
      `Cai nos baús a partir da arena ${ARENAS[u.arena].icon} ${ARENAS[u.arena].name}`,
    ];
    this.detailBody.setText(lines.filter((l, i, arr) => l !== '' || arr[i - 1] !== '').join('\n'));
  }
}
