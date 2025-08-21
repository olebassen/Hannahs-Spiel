// src/puzzles/HiddenObjectsPuzzle.js
import { DESIGN_SIZE } from "../config.js";

export default class HiddenObjectsPuzzle {
  constructor(scene, cfg, onSolved) {
    const defaults = {
      background: { key: "bg", path: null },
      objects: [], // [{ key:"schluessel1", path:"assets/images/..." }]
      x: DESIGN_SIZE / 2,
      y: DESIGN_SIZE / 2,
      area: { x: 0, y: 0, width: DESIGN_SIZE, height: DESIGN_SIZE }, // Spawnbereich
      noSpawnZone: { x: 0, y: 0, width: 100, height: 500 },          // verbotene Zone
      randomRotation: true
    };
    this.scene = scene;
    this.cfg = Object.assign(defaults, cfg || {});
    this.onSolved = onSolved;

    this.found = new Set();
    this.bg = null;
    this.items = [];
  }

  preload() {
    this.cfg.objects.forEach(obj => {
      if (obj.path && !this.scene.textures.exists(obj.key)) {
        this.scene.load.image(obj.key, obj.path);
      }
    });
  }

  create(parentContainer) {
    const { x, y, objects, area } = this.cfg;
    const cx = parentContainer ? 0 : x;
    const cy = parentContainer ? 0 : y;

    const root = parentContainer || this.scene.add.container(cx, cy);

    objects.forEach(obj => {
      const { ox, oy } = this._getRandomPosition(area, this.cfg.noSpawnZone);

      const angle = this.cfg.randomRotation
        ? Phaser.Math.Between(-15, 15)
        : 0;

      const item = this.scene.add.image(ox, oy, obj.key)
        .setInteractive({ useHandCursor: true })
        .setAlpha(obj.alpha ?? 0.7)
        .setScale(obj.scale ?? 0.9)
        .setAngle(angle)
        .setDepth(10);

      item.on("pointerdown", () => this._findObject(obj.key, item));

      root.add(item);
      this.items.push(item);
    });

    if (!parentContainer) this.scene.add.existing(root);
  }

  _getRandomPosition(area, noSpawnZone) {
    let ox, oy;
    let tries = 0;
    do {
      ox = Phaser.Math.Between(area.x - area.width / 2, area.x + area.width / 2);
      oy = Phaser.Math.Between(area.y - area.height / 2, area.y + area.height / 2);
      tries++;
      if (tries > 100) break; // Sicherheitsnetz, falls Bereich fast komplett blockiert ist
    } while (
      ox >= noSpawnZone.x &&
      ox <= noSpawnZone.x + noSpawnZone.width &&
      oy >= noSpawnZone.y &&
      oy <= noSpawnZone.y + noSpawnZone.height
    );
    return { ox, oy };
  }

  _findObject(key, item) {
    if (this.found.has(key)) return;

    this.found.add(key);
    this.scene.tweens.add({
      targets: item,
      alpha: 0,
      duration: 400,
      onComplete: () => item.destroy()
    });

    if (this.found.size === this.cfg.objects.length) {
      this.onSolved && this.onSolved();
    }
  }

  destroy() {
    this.bg?.destroy();
    this.items.forEach(i => i.destroy());
    this.items = [];
    this.found.clear();
  }
}
