// src/puzzles/HiddenObjectsPuzzle.js
import { DESIGN_SIZE } from "../config.js";

export default class HiddenObjectsPuzzle {
  constructor(scene, cfg, onSolved) {
    const defaults = {
      background: { key: "bg", path: null }, 
      objects: [], // [{ key:"schluessel1", path:"assets/images/...", x, y }]
      x: DESIGN_SIZE / 2,
      y: DESIGN_SIZE / 2
    };
    this.scene = scene;
    this.cfg = Object.assign(defaults, cfg || {});
    this.onSolved = onSolved;

    this.found = new Set();
    this.bg = null;
    this.items = [];
  }

  preload() {
    // Objekte laden
    this.cfg.objects.forEach(obj => {
      if (obj.path && !this.scene.textures.exists(obj.key)) {
        this.scene.load.image(obj.key, obj.path);
      }
    });
  }

  create(parentContainer) {


    const { x, y, objects } = this.cfg;

    const cx = parentContainer ? 0 : x;
    const cy = parentContainer ? 0 : y;

    // --- Objekte ---
    objects.forEach(obj => {
      const ox = parentContainer ? obj.x : obj.x;
      const oy = parentContainer ? obj.y : obj.y;

      const item = this.scene.add.image(ox, oy, obj.key)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.7)
        .setScale(0.9)
        .setDepth(10);

      item.on("pointerdown", () => this._findObject(obj.key, item));

      if (parentContainer) parentContainer.add(item);
      this.items.push(item);
    });
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
  }
}
