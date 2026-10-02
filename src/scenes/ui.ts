import Phaser from 'phaser';

export function button(scene: Phaser.Scene, x: number, y: number, label: string, color: number, onClick: () => void) {
  const bg = scene.add.rectangle(0, 0, 360, 90, color).setStrokeStyle(4, 0xffffff, 0.8);
  const text = scene.add.text(0, 0, label, { fontSize: '34px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
  const container = scene.add.container(x, y, [bg, text]).setSize(360, 90).setInteractive({ useHandCursor: true });
  container.on('pointerdown', () => container.setScale(0.95));
  container.on('pointerout', () => container.setScale(1));
  container.on('pointerup', () => {
    container.setScale(1);
    onClick();
  });
  return container;
}
