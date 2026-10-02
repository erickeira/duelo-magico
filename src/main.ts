import Phaser from 'phaser';
import { H, W } from './config';
import { BattleScene } from './scenes/BattleScene';
import { CollectionScene } from './scenes/CollectionScene';
import { DeckScene } from './scenes/DeckScene';
import { GodsScene } from './scenes/GodsScene';
import { HomeScene } from './scenes/HomeScene';
import { PreloadScene } from './scenes/PreloadScene';
import { ResultScene } from './scenes/ResultScene';

/**
 * Nitidez em telas grandes: o jogo é desenhado em 1280×720 (coordenadas lógicas), mas o canvas tem
 * RENDER_SCALE vezes esse tamanho e cada câmera aplica zoom do mesmo valor. Assim, num monitor Full HD/4K
 * ou numa tela de alta densidade, artes e textos não são esticados a partir de uma imagem pequena.
 */
const fit = Math.min(window.innerWidth / W, window.innerHeight / H);
// `?escala=2` força um valor (útil para testar).
const forced = Number(new URLSearchParams(location.search).get('escala'));
const RENDER_SCALE = forced > 0 ? forced : Phaser.Math.Clamp(Math.ceil(fit * (window.devicePixelRatio || 1) * 4) / 4, 1, 3);

// Textos rasterizados na mesma escala (o padrão do Phaser é 1, que fica borrado com o zoom).
const factory = Phaser.GameObjects.GameObjectFactory.prototype as unknown as {
  text: (x: number, y: number, text: string | string[], style?: Phaser.Types.GameObjects.Text.TextStyle) => Phaser.GameObjects.Text;
};
const addText = factory.text;
factory.text = function (x, y, text, style) {
  return addText.call(this, x, y, text, { resolution: RENDER_SCALE, ...style });
};

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0b1020',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: W * RENDER_SCALE,
    height: H * RENDER_SCALE,
  },
  input: { activePointers: 2 },
  render: { antialias: true, mipmapFilter: 'LINEAR_MIPMAP_LINEAR' },
  scene: [PreloadScene, HomeScene, DeckScene, CollectionScene, GodsScene, BattleScene, ResultScene],
});

// Toda cena enxerga o mundo lógico de 1280×720, com zoom para preencher o canvas maior.
game.events.once(Phaser.Core.Events.READY, () => {
  for (const scene of game.scene.scenes) {
    scene.sys.events.on(Phaser.Scenes.Events.CREATE, () => scene.cameras.main.setZoom(RENDER_SCALE).centerOn(W / 2, H / 2));
  }
});

// Facilita depuração no console do navegador durante o desenvolvimento.
if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;
