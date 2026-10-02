import Phaser from 'phaser';
import { COLORS, type Team } from '../config';
import type { UnitDef } from '../data/content';
import { tokenKey } from '../scenes/PreloadScene';

/** Atributos de combate. Tropas do deck vêm de UnitDef; invocações de magias usam objetos próprios. */
export type UnitStats = Pick<
  UnitDef,
  'id' | 'name' | 'icon' | 'hp' | 'damage' | 'attackInterval' | 'range' | 'speed' | 'radius' | 'splash' | 'flying' | 'targetsAir' | 'lifetime' | 'roles'
>;

export interface Damageable {
  team: Team;
  alive: boolean;
  readonly isFlying: boolean;
  /** Ponto de mira; `along` é a coordenada y de quem atira (usada pelo castelo). */
  aimPoint(along: number): { x: number; y: number };
}

export type StatusKind =
  | 'slow' // movimento −value%
  | 'attackSlow' // velocidade de ataque −value%
  | 'root' // não anda
  | 'stun' // não anda nem ataca
  | 'freeze' // igual stun, visual de gelo
  | 'healReduction' // cura e escudo recebidos −50%
  | 'ccImmune' // imune a lentidão, prisão, atordoamento, congelamento e empurrão
  | 'steadfast' // imune a atordoamento e empurrão
  | 'vulnerable' // recebe +value% de dano enquanto congelado
  | 'grounded' // voador preso ao chão
  | 'taunt' // inimigos próximos atacam esta tropa primeiro
  | 'chillArmor' // quem ataca fica lento
  | 'slowingAttacks'; // os ataques desta tropa deixam o alvo lento

export interface Buff {
  damagePct: number;
  attackSpeedPct: number;
  movePct: number;
  until: number;
  /** Vida máxima extra concedida (removida ao expirar). */
  hpBonus?: number;
}

export interface Shield {
  amount: number;
  until: number;
  onBreak?: (u: Unit) => void;
}

const FLY_OFFSET = 22;
let nextId = 1;

export class Unit extends Phaser.GameObjects.Container implements Damageable {
  readonly uid = nextId++;
  hp: number;
  maxHp: number;
  alive = true;
  cooldown = 0;
  kills = 0;
  /** Nível da carta (1–10). */
  level = 1;
  /** Momento (segundos de partida) em que a tropa some: construções e invocações. */
  expiresAt?: number;
  /** Multiplicador fixo de dano recebido (ex.: Lanceiros de Luz evoluídos). */
  damageTakenMult = 1;
  shield: Shield | null = null;
  buffs: Buff[] = [];
  /** Estado livre para habilidades (timers, alvos já atingidos etc.). */
  ability: Record<string, unknown> = {};
  readonly isBuilding: boolean;
  readonly radius: number;
  /** Raio do desenho (token com arte é maior que o raio de colisão). */
  private visualRadius: number;

  private statuses = new Map<StatusKind, { until: number; value: number }>();
  private hpBar: Phaser.GameObjects.Graphics;
  private fx: Phaser.GameObjects.Graphics;
  private body_: Phaser.GameObjects.Shape;
  /** Retrato redondo da tropa (arte da carta); ausente em invocações sem arte. */
  private portrait: Phaser.GameObjects.Image | null = null;
  private lift: number;

  constructor(
    scene: Phaser.Scene,
    readonly team: Team,
    readonly stats: UnitStats,
    x: number,
    y: number,
    readonly lane: number,
    /** true para invocações de magia/habilidade (não contam como carta). */
    readonly summoned = false,
  ) {
    super(scene, x, y);
    this.hp = this.maxHp = stats.hp;
    this.radius = stats.radius;
    this.isBuilding = stats.roles.includes('construcao');
    this.lift = stats.flying ? -FLY_OFFSET : 0;

    const color = team === 'player' ? COLORS.player : COLORS.enemy;
    const dark = team === 'player' ? COLORS.playerDark : COLORS.enemyDark;

    if (stats.flying) this.add(scene.add.ellipse(0, 6, this.radius * 1.6, this.radius * 0.7, 0x000000, 0.3));
    // Com arte: anel na cor do time em volta do token. Sem arte (invocações de magia): círculo com emoji.
    const hasArt = scene.textures.exists(tokenKey(stats.id));
    // O token é desenhado 25% maior que o raio de colisão, para a arte ficar legível.
    const art = Math.round(this.radius * 1.25);
    const ring = hasArt ? art + 3 : this.radius;
    this.visualRadius = ring;
    this.body_ = this.isBuilding
      ? scene.add.rectangle(0, this.lift, ring * 2, ring * 2, color).setStrokeStyle(3, dark)
      : scene.add.circle(0, this.lift, ring, color).setStrokeStyle(3, dark);
    if (summoned) this.body_.setAlpha(0.75);
    this.add(this.body_);
    if (hasArt) {
      this.portrait = scene.add.image(0, this.lift, tokenKey(stats.id)).setDisplaySize(art * 2, art * 2);
      // A arte olha para a direita; as tropas da IA andam para a esquerda.
      if (team === 'enemy') this.portrait.setFlipX(true);
      if (summoned) this.portrait.setAlpha(0.8);
      this.add(this.portrait);
    } else {
      this.add(scene.add.text(0, this.lift, stats.icon, { fontSize: `${Math.round(this.radius * 1.2)}px` }).setOrigin(0.5));
    }
    this.fx = scene.add.graphics();
    this.hpBar = scene.add.graphics();
    this.add([this.fx, this.hpBar]);
    this.drawHp();

    scene.add.existing(this);
    this.setDepth(stats.flying ? 20 : 10);
    this.setScale(0.2);
    scene.tweens.add({ targets: this, scale: 1, duration: 180, ease: 'Back.Out' });
  }

  /** Sentido do avanço no eixo X: jogador vai para a direita, IA para a esquerda. */
  get dir(): number {
    return this.team === 'player' ? 1 : -1;
  }

  get isFlying(): boolean {
    return !!this.stats.flying && !this.has('grounded');
  }

  canHit(target: Damageable): boolean {
    return !target.isFlying || !!this.stats.targetsAir;
  }

  aimPoint() {
    return { x: this.x, y: this.y + (this.isFlying ? -FLY_OFFSET : 0) };
  }

  // ------------------------------------------------------------ status e buffs

  has(kind: StatusKind, now = (this.scene as { now?: number }).now ?? 0): boolean {
    const s = this.statuses.get(kind);
    return !!s && s.until > now;
  }

  statusValue(kind: StatusKind, now: number): number {
    const s = this.statuses.get(kind);
    return s && s.until > now ? s.value : 0;
  }

  /** Aplica um status; o mais forte vale e a duração é renovada. Retorna false se a tropa for imune. */
  setStatus(kind: StatusKind, now: number, duration: number, value = 0): boolean {
    const crowdControl = ['slow', 'attackSlow', 'root', 'stun', 'freeze'];
    if (crowdControl.includes(kind) && this.has('ccImmune', now)) return false;
    if (kind === 'stun' && this.has('steadfast', now)) return false;
    const cur = this.statuses.get(kind);
    const active = cur && cur.until > now;
    this.statuses.set(kind, {
      until: Math.max(active ? cur!.until : 0, now + duration),
      value: Math.max(active ? cur!.value : 0, value),
    });
    return true;
  }

  clearStatus(...kinds: StatusKind[]) {
    for (const k of kinds) this.statuses.delete(k);
  }

  canAct(now: number) {
    return !this.has('stun', now) && !this.has('freeze', now);
  }

  canMove(now: number) {
    return this.canAct(now) && !this.has('root', now) && this.stats.speed > 0;
  }

  private buffSum(key: 'damagePct' | 'attackSpeedPct' | 'movePct', now: number) {
    return this.buffs.reduce((sum, b) => (b.until > now ? sum + b[key] : sum), 0);
  }

  damageMult(now: number) {
    return 1 + this.buffSum('damagePct', now) / 100;
  }

  moveSpeed(now: number) {
    return this.stats.speed * (1 + this.buffSum('movePct', now) / 100) * (1 - this.statusValue('slow', now) / 100);
  }

  attackInterval(now: number) {
    const speed = (1 + this.buffSum('attackSpeedPct', now) / 100) * (1 - this.statusValue('attackSlow', now) / 100);
    return this.stats.attackInterval / Math.max(0.1, speed);
  }

  addBuff(buff: Buff) {
    if (buff.hpBonus) {
      this.maxHp += buff.hpBonus;
      this.hp += buff.hpBonus;
    }
    this.buffs.push(buff);
  }

  /** Remove buffs vencidos (e a vida extra que eles davam). */
  expireBuffs(now: number) {
    this.buffs = this.buffs.filter((b) => {
      if (b.until > now) return true;
      if (b.hpBonus) {
        this.maxHp -= b.hpBonus;
        this.hp = Math.min(this.hp, this.maxHp);
      }
      return false;
    });
  }

  // ------------------------------------------------------------ vida

  /** Aplica dano já calculado (o BattleScene cuida de escudo, aura etc.). */
  loseHp(amount: number) {
    if (!this.alive) return;
    this.hp -= amount;
    this.flash();
    if (this.hp <= 0) this.alive = false;
  }

  gainHp(amount: number) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  flash() {
    this.body_.setFillStyle(0xffffff);
    this.portrait?.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => {
      if (!this.active) return;
      this.body_.setFillStyle(this.team === 'player' ? COLORS.player : COLORS.enemy);
      this.portrait?.clearTint();
    });
  }

  lunge() {
    this.scene.tweens.add({ targets: [this.body_, this.portrait].filter(Boolean), x: this.dir * 8, duration: 80, yoyo: true });
  }

  // ------------------------------------------------------------ visual

  /** Redesenha barra de vida e anéis de status. Chamado a cada quadro pelo BattleScene. */
  redraw(now: number) {
    this.drawHp();
    const g = this.fx;
    const r = this.visualRadius + 3;
    g.clear();
    if (this.shield && this.shield.until > now) g.lineStyle(3, 0xfef3c7, 0.9).strokeCircle(0, this.lift, r + 2);
    if (this.buffs.some((b) => b.until > now)) g.lineStyle(2, 0xf97316, 0.9).strokeCircle(0, this.lift, r + 6);
    if (this.has('freeze', now)) g.fillStyle(0x93c5fd, 0.55).fillCircle(0, this.lift, r);
    else if (this.has('stun', now)) g.lineStyle(3, 0xfacc15, 1).strokeCircle(0, this.lift - this.visualRadius - 4, 6);
    if (this.has('root', now)) g.lineStyle(3, 0x16a34a, 1).strokeEllipse(0, this.visualRadius - 2, r * 2, 10);
    if (this.has('slow', now)) g.lineStyle(2, 0x7dd3fc, 0.9).strokeCircle(0, this.lift, r - 1);
    if (this.has('taunt', now)) g.lineStyle(2, 0xef4444, 0.7).strokeCircle(0, this.lift, r + 10);
  }

  private drawHp() {
    const w = Math.max(24, this.visualRadius * 2);
    const top = this.lift - this.visualRadius - 9;
    const pct = Math.max(0, this.hp / this.maxHp);
    this.hpBar.clear();
    this.hpBar.fillStyle(0x000000, 0.6).fillRect(-w / 2, top, w, 5);
    this.hpBar.fillStyle(this.team === 'player' ? 0x60a5fa : 0xf87171).fillRect(-w / 2, top, w * pct, 5);
    if (this.shield && this.shield.amount > 0) {
      const sw = Math.min(w, (w * this.shield.amount) / this.maxHp);
      this.hpBar.fillStyle(0xfef3c7).fillRect(-w / 2, top - 4, sw, 3);
    }
  }
}
