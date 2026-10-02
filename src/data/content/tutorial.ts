import type { GodId } from './types';

/** Uma batalha guiada do tutorial (ver wiki/modos.md). */
export interface TutorialStep {
  title: string;
  /** Dicas mostradas durante a batalha, em ordem. */
  hints: string[];
  player: { god: GodId; spells: string[]; units: string[] };
  enemy: { god: GodId; units: string[] };
  /** Vida do castelo inimigo (menor que o normal para a batalha ser curta). */
  enemyCastleHp: number;
}

export const TUTORIAL: TutorialStep[] = [
  {
    title: 'Tutorial 1/4: Trilhas',
    hints: ['Arraste uma carta até uma trilha.', 'A tropa anda sozinha e ataca o que encontrar pela frente.'],
    player: { god: 'ignar', spells: [], units: ['cavaleiro', 'esqueletos'] },
    enemy: { god: 'ignar', units: ['esqueletos'] },
    enemyCastleHp: 800,
  },
  {
    title: 'Tutorial 2/4: Mana',
    hints: ['Cada carta custa mana (o número roxo).', 'A barra de mana enche com o tempo: não deixe ela parada cheia!'],
    player: { god: 'ignar', spells: [], units: ['cavaleiro', 'esqueletos', 'arqueiras', 'lanceiros'] },
    enemy: { god: 'ignar', units: ['esqueletos', 'cavaleiro'] },
    enemyCastleHp: 1200,
  },
  {
    title: 'Tutorial 3/4: Magias',
    hints: ['Magias não gastam mana: elas têm recarga.', 'Arraste o Cometa Rubro sobre um grupo de esqueletos!'],
    player: { god: 'ignar', spells: ['cometa-rubro'], units: ['cavaleiro', 'arqueiras', 'lanceiros', 'golem'] },
    enemy: { god: 'ignar', units: ['esqueletos'] },
    enemyCastleHp: 1500,
  },
  {
    title: 'Tutorial 4/4: Voadores',
    hints: ['Diabretes voam: só quem acerta voadores os alcança.', 'Use Arqueiras e Lanceiros contra eles.'],
    player: { god: 'ignar', spells: ['cometa-rubro', 'brado-guerra'], units: ['arqueiras', 'lanceiros', 'cavaleiro', 'golem', 'esqueletos'] },
    enemy: { god: 'ignar', units: ['diabretes', 'esqueletos'] },
    enemyCastleHp: 2000,
  },
];
