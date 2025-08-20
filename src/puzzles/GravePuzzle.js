// src/puzzles/GravePuzzle.js
import { DESIGN_SIZE } from "../config.js";

export default class GravePuzzle {
  constructor(scene, cfg, onSolved) {
    const defaults = {
      graves: [],   // [{x, y, img, targetAngle}, ...]
      mask: null,   // optionale Silhouette
      x: DESIGN_SIZE / 2,
      y: DESIGN_SIZE / 2,
      hint: null
    };

    this.scene = scene;
    this.cfg = Object.assign(defaults, cfg || {});
    this.onSolved = onSolved;

    this.container = null;
    this.graves = [];
    this.maskImage = null;
  }

  create(parentContainer) {
    const baseX = parentContainer ? 0 : this.cfg.x;
    const baseY = parentContainer ? 0 : this.cfg.y;

    this.container = this.scene.add.container(baseX, baseY);
    if (parentContainer) parentContainer.add(this.container);

    // optional Silhouette (z. B. Kreuz, Symbol)
    if (this.cfg.mask) {
      this.maskImage = this.scene.add.image(0, 0, this.cfg.mask)
        .setOrigin(0.5)
        .setAlpha(0.1);
      this.container.add(this.maskImage);
    }

    // Gräber platzieren
    this.cfg.graves.forEach((slot, idx) => {
      const grave = this.scene.add.image(slot.x, slot.y, slot.img)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setData("angle", 0);

      grave.setDisplaySize(DESIGN_SIZE * 0.12, DESIGN_SIZE * 0.16);

      grave.on("pointerdown", () => {
        const a = (grave.getData("angle") + 90) % 360; // Gräber = 90° Schritte
        grave.setData("angle", a);
        grave.setRotation(Phaser.Math.DegToRad(a));
        this._checkSolved();
      });

      this.container.add(grave);
      this.graves.push(grave);
    });

    // Hinweis-Button
    if (this.cfg.hint) {
      const hintBtn = this.scene.add.text(
        0, DESIGN_SIZE * 0.35,
        "HINWEIS",
        { fontFamily: "SpukFont", fontSize: `${DESIGN_SIZE * 0.022}px`, color: "#ffffff" }
      ).setOrigin(0.5).setInteractive({ useHandCursor: true });

      hintBtn.on("pointerdown", () => {
        if (!this.hintText) {
          this.hintText = this.scene.add.text(
            0, DESIGN_SIZE * 0.43,
            this.cfg.hint,
            {
              fontFamily: "SpukFont",
              fontSize: `${DESIGN_SIZE * 0.018}px`,
              color: "#dddddd",
              wordWrap: { width: DESIGN_SIZE * 0.8 }
            }
          ).setOrigin(0.5);
          this.container.add(this.hintText);
        }
      });

      this.container.add(hintBtn);
    }
  }

  _checkSolved() {
    const sol = this.cfg.graves.map(s => s.targetAngle);
    let correct = 0;

    this.graves.forEach((g, i) => {
      if (g.getData("angle") === sol[i]) correct++;
    });

    if (this.maskImage) {
      const progress = correct / this.graves.length;
      this.maskImage.setAlpha(0.1 + 0.8 * progress);
    }

    if (correct === this.graves.length) {
      this.scene.tweens.add({
        targets: this.maskImage || this.graves,
        alpha: { from: 0.9, to: 1 },
        scale: { from: 1, to: 1.1 },
        yoyo: true,
        duration: 300,
        ease: "Sine.easeInOut",
        onComplete: () => {
          this.onSolved && this.onSolved();
        }
      });
    }
  }

  destroy() {
    this.container?.destroy();
    this.graves = [];
    this.maskImage = null;
  }
}
