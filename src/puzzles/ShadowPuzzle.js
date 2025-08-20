// src/puzzles/ShadowPuzzle.js
import { DESIGN_SIZE } from "../config.js";

export default class ShadowPuzzle {
  constructor(scene, cfg, onSolved) {
    const defaults = {
      img: null,      // Kerzen-Sprite-Key
      mask: null,     // Silhouette-Sprite-Key (z. B. Rabe)
      slots: [],      // [{x, y, targetAngle}, ...] relativ zum Zentrum
      x: DESIGN_SIZE / 2,
      y: DESIGN_SIZE / 2,
      hint: null
    };

    this.scene = scene;
    this.cfg = Object.assign(defaults, cfg || {});
    this.onSolved = onSolved;

    this.container = null;
    this.candles = [];
    this.maskImage = null;
  }

  preload() {
    if (this.cfg.img && !this.scene.textures.exists(this.cfg.img)) {
      this.scene.load.image(this.cfg.img, this.cfg.img);
    }
    if (this.cfg.mask && !this.scene.textures.exists(this.cfg.mask)) {
      this.scene.load.image(this.cfg.mask, this.cfg.mask);
    }
  }

  create(parentContainer) {
    const baseX = parentContainer ? 0 : this.cfg.x;
    const baseY = parentContainer ? 0 : this.cfg.y;

    this.container = this.scene.add.container(baseX, baseY);
    if (parentContainer) parentContainer.add(this.container);

    // Silhouette als Hintergrund
    this.maskImage = this.scene.add.image(0, 0, this.cfg.mask)
      .setOrigin(0.5)
      .setAlpha(0.1);
    this.container.add(this.maskImage);

    // Kerzen
    this.cfg.slots.forEach((slot, idx) => {
      const candle = this.scene.add.image(slot.x, slot.y, this.cfg.img)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setData("angle", 0);

  candle.setDisplaySize(DESIGN_SIZE * 0.08, DESIGN_SIZE * 0.12);

      // Klick = Kerze drehen
      candle.on("pointerdown", () => {
        const a = (candle.getData("angle") + 45) % 360;
        candle.setData("angle", a);
        candle.setRotation(Phaser.Math.DegToRad(a));
        this._checkSolved();
      });

      this.container.add(candle);
      this.candles.push(candle);
    });

    // Hinweis-Button (optional)
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
    const sol = this.cfg.slots.map(s => s.targetAngle);
    let correct = 0;

    this.candles.forEach((c, i) => {
      if (c.getData("angle") === sol[i]) correct++;
    });

    // Fortschritt: Silhouette deutlicher sichtbar
    const progress = correct / this.candles.length;
    this.maskImage.setAlpha(0.1 + 0.8 * progress);

    // Wenn alles korrekt → Effekt + Callback
    if (correct === this.candles.length) {
      this.scene.tweens.add({
        targets: this.maskImage,
        alpha: { from: 0.9, to: 1 },
        scale: { from: 1, to: 1.1 },
        yoyo: true,
        duration: 300,
        ease: "Sine.easeInOut",
        onComplete: () => {
          this.maskImage.setScale(1);
          this.onSolved && this.onSolved();
        }
      });
    }
  }

  destroy() {
    this.container?.destroy();
    this.candles = [];
    this.maskImage = null;
  }
}
