import Phaser from 'phaser';
import { H, W } from './config';
import { BattleScene } from './scenes/BattleScene';
import { CollectionScene } from './scenes/CollectionScene';
import { DeckScene } from './scenes/DeckScene';
import { GodsScene } from './scenes/GodsScene';
import { HomeScene } from './scenes/HomeScene';
import { ResultScene } from './scenes/ResultScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0b1020',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: W,
    height: H,
  },
  input: { activePointers: 2 },
  scene: [HomeScene, DeckScene, CollectionScene, GodsScene, BattleScene, ResultScene],
});

// Facilita depuração no console do navegador durante o desenvolvimento.
if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;
