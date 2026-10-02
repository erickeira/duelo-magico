// Tipos do conteúdo do jogo. Fonte única usada pela wiki (wiki/) e, depois, pelo jogo.
// Todos os números de tropas e magias são os valores no NÍVEL 1 (ou nível inicial da raridade).

export type WorldId = 'solar' | 'abismo' | 'arcano';
export type Rarity = 'comum' | 'rara' | 'epica' | 'lendaria';
export type GodId = 'ignar' | 'solenne' | 'hyela' | 'thalor';

export type Role =
  | 'tanque'
  | 'corpo-a-corpo'
  | 'distancia'
  | 'enxame'
  | 'area'
  | 'suporte'
  | 'cerco'
  | 'voador'
  | 'construcao';

export interface WorldDef {
  id: WorldId;
  name: string;
  icon: string;
  color: string;
  theme: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
}

export interface RarityDef {
  id: Rarity;
  name: string;
  color: string;
  /** Nível com que a carta chega à coleção (como no Heroic, raras começam mais altas). */
  startLevel: number;
}

export interface Ability {
  name: string;
  description: string;
}

export interface UnitDef {
  id: string;
  name: string;
  icon: string;
  world: WorldId;
  rarity: Rarity;
  cost: number;
  /** Quantas cópias a carta invoca. */
  count: number;
  roles: Role[];
  hp: number;
  damage: number;
  /** Segundos entre ataques. */
  attackInterval: number;
  /** Alcance em px (borda a borda). >= 60 dispara projétil. */
  range: number;
  /** px/s. Construções têm 0. */
  speed: number;
  radius: number;
  splash?: number;
  flying?: boolean;
  targetsAir?: boolean;
  /** Ignora tropas e só ataca o castelo. */
  targetsCastleOnly?: boolean;
  /** Construções: segundos até desabar sozinha. */
  lifetime?: number;
  ability?: Ability;
  description: string;
  /** Ids de tropas contra as quais esta carta é boa. */
  strongAgainst: string[];
  /** Ids de tropas/magias que a anulam. */
  weakAgainst: string[];
  /** Arena (índice em ARENAS) em que a carta passa a cair nos baús. */
  arena: number;
}

export type SpellTarget = 'ponto' | 'trilha' | 'aliado' | 'arena' | 'castelo';

export interface SpellEvolution {
  /** Nível da magia em que a evolução é ganha. */
  level: number;
  description: string;
}

export interface SpellDef {
  id: string;
  name: string;
  icon: string;
  god: GodId;
  rarity: Exclude<Rarity, 'lendaria'>;
  target: SpellTarget;
  /** Segundos desde o início da partida até poder usar pela 1ª vez. */
  initialCooldown: number;
  /** Segundos entre usos. */
  cooldown: number;
  /** Raio em px quando o alvo é um ponto. */
  radius?: number;
  /** Valores numéricos no nível 1. Valores marcados em `scaling` crescem por nível da magia. */
  stats: Record<string, number>;
  /** Quais chaves de `stats` crescem +10% por nível da magia (dano, cura, escudo, vida). */
  scaling: string[];
  description: string;
  evolutions: SpellEvolution[];
  /** Nível do deus necessário para desbloquear. */
  godLevel: number;
}

export interface SuggestedDeck {
  name: string;
  units: string[];
  spells: [string, string];
  plan: string;
}

export interface GodDef {
  id: GodId;
  name: string;
  title: string;
  icon: string;
  color: string;
  element: string;
  /** 1 = fácil, 3 = difícil. */
  difficulty: 1 | 2 | 3;
  summary: string;
  lore: string[];
  playstyle: string[];
  spells: string[];
  /** Troféus necessários para liberar o deus. */
  unlockTrophies: number;
  suggestedDecks: SuggestedDeck[];
}

export interface ArenaDef {
  index: number;
  name: string;
  icon: string;
  trophies: number;
  description: string;
}
