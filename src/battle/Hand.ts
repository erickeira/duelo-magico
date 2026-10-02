import Phaser from 'phaser';
import { HAND_SIZE, MAX_MANA, START_MANA } from '../config';
import { CARDS, Card } from '../data/cards';

/** Mana + mão de cartas de um lado. Lógica pura, sem renderização. */
export class Hand {
  mana = START_MANA;
  hand: Card[];
  private queue: Card[];

  constructor(deckIds: string[]) {
    const deck = Phaser.Utils.Array.Shuffle(deckIds.map((id) => CARDS[id]));
    this.hand = deck.slice(0, HAND_SIZE);
    this.queue = deck.slice(HAND_SIZE);
  }

  get next(): Card {
    return this.queue[0];
  }

  update(dt: number, rate: number) {
    this.mana = Math.min(MAX_MANA, this.mana + dt * rate);
  }

  canPlay(index: number): boolean {
    const card = this.hand[index];
    return !!card && this.mana >= card.cost;
  }

  /** Gasta a mana e repõe a carta usada com a próxima da fila. */
  play(index: number): Card {
    const card = this.hand[index];
    this.mana -= card.cost;
    this.queue.push(card);
    this.hand[index] = this.queue.shift()!;
    return card;
  }
}
