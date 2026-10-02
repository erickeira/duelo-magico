export type Team = 'player' | 'enemy';

export interface UnitStats {
  hp: number;
  damage: number;
  attackInterval: number; // segundos entre ataques
  range: number; // alcance em px (borda a borda)
  speed: number; // px/s
  radius: number;
  icon: string;
  splash?: number; // raio de dano em área
  flying?: boolean;
  targetsAir?: boolean;
}

export interface UnitCard {
  kind: 'unit';
  id: string;
  name: string;
  cost: number;
  icon: string;
  desc: string;
  count: number;
  unit: UnitStats;
}

export interface SpellCard {
  kind: 'spell';
  id: string;
  name: string;
  cost: number;
  icon: string;
  desc: string;
  radius: number;
  damage: number;
  castleDamagePct: number;
  freeze?: number; // segundos congelado
}

export type Card = UnitCard | SpellCard;

export const CARDS: Record<string, Card> = {
  knight: {
    kind: 'unit', id: 'knight', name: 'Cavaleiro', cost: 3, icon: '⚔️', count: 1,
    desc: 'Corpo a corpo resistente',
    unit: { hp: 650, damage: 80, attackInterval: 1.0, range: 12, speed: 45, radius: 20, icon: '⚔️' },
  },
  archers: {
    kind: 'unit', id: 'archers', name: 'Arqueiras', cost: 3, icon: '🏹', count: 2,
    desc: 'Dupla à distância, acerta voadores',
    unit: { hp: 200, damage: 45, attackInterval: 0.9, range: 150, speed: 48, radius: 15, icon: '🏹', targetsAir: true },
  },
  golem: {
    kind: 'unit', id: 'golem', name: 'Golem', cost: 5, icon: '🗿', count: 1,
    desc: 'Tanque lento com muita vida',
    unit: { hp: 2000, damage: 130, attackInterval: 1.6, range: 12, speed: 26, radius: 28, icon: '🗿' },
  },
  goblins: {
    kind: 'unit', id: 'goblins', name: 'Goblins', cost: 2, icon: '👺', count: 3,
    desc: 'Trio rápido e frágil',
    unit: { hp: 120, damage: 40, attackInterval: 0.7, range: 10, speed: 72, radius: 13, icon: '👺' },
  },
  wizard: {
    kind: 'unit', id: 'wizard', name: 'Mago', cost: 4, icon: '🧙', count: 1,
    desc: 'Dano em área à distância',
    unit: { hp: 320, damage: 90, attackInterval: 1.4, range: 130, speed: 42, radius: 17, icon: '🧙', splash: 50, targetsAir: true },
  },
  dragon: {
    kind: 'unit', id: 'dragon', name: 'Dragão', cost: 4, icon: '🐉', count: 1,
    desc: 'Voa por cima das tropas terrestres',
    unit: { hp: 520, damage: 65, attackInterval: 1.2, range: 80, speed: 52, radius: 20, icon: '🐉', splash: 40, flying: true, targetsAir: true },
  },
  fireball: {
    kind: 'spell', id: 'fireball', name: 'Bola de Fogo', cost: 4, icon: '🔥',
    desc: 'Dano em área', radius: 90, damage: 320, castleDamagePct: 0.35,
  },
  freeze: {
    kind: 'spell', id: 'freeze', name: 'Congelar', cost: 3, icon: '❄️',
    desc: 'Congela inimigos por 3s', radius: 110, damage: 60, castleDamagePct: 0.3, freeze: 3,
  },
};

export const DEFAULT_DECK = ['knight', 'archers', 'golem', 'goblins', 'wizard', 'dragon', 'fireball', 'freeze'];
