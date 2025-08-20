// src/puzzles/PathPuzzle.js
import { DESIGN_SIZE } from "../config.js";

export default class PathPuzzle {
  constructor(scene, cfg, onSolved) {
    this.scene = scene;
    this.cfg = cfg || {};
    this.onSolved = onSolved;

    this.currentIndex = 0;
    this.dots = [];
    this.graphics = null;

    // ausgewählte Variante (points/order/hint)
    this.variant = null;
  }

  preload() { /* Kreise brauchen keine Assets */ }

  create(parentContainer) {
    // ---- Variante wählen ----
    if (Array.isArray(this.cfg.variants) && this.cfg.variants.length > 0) {
      // zufällig eine Variante wählen
      this.variant = Phaser.Utils.Array.GetRandom(this.cfg.variants);
    } else {
      // rückwärtskompatibel: direkt aus cfg
      this.variant = {
        id: this.cfg.id || "single",
        points: this.cfg.points || [],
        order: this.cfg.order || [],
        hint: this.cfg.hint || ""
      };
    }

    const { points, order, hint } = this.variant;

    // Hinweistext
    if (hint) {
      const hintText = this.scene.add.text(
        0, DESIGN_SIZE * 0.44,
        hint,
        {
          fontFamily: "SpukFont",
          fontSize: `${DESIGN_SIZE * 0.028}px`,
          color: "#ffffff",
          align: "center",
          wordWrap: { width: DESIGN_SIZE - 100 }
        }
      ).setOrigin(0.5);
      if (parentContainer) parentContainer.add(hintText);
    }

    // Linien-Layer
    this.graphics = this.scene.add.graphics();
    this.graphics.setDepth(1);
    if (parentContainer) parentContainer.add(this.graphics);

    // Punkte anlegen
    this.dots = [];
    points.forEach((p, i) => {
      const dot = this.scene.add.circle(p.x, p.y, 10, 0x444444)
        .setInteractive({ useHandCursor: true })
        .setDepth(2);

      dot.on("pointerdown", () => this._select(i));

      if (parentContainer) parentContainer.add(dot);
      this.dots.push(dot);
    });

    // Startpunkt aktivieren
    if (order.length > 0) {
      const startIndex = order[0];
      const startDot = this.dots[startIndex];
      startDot?.setFillStyle(0x00ff00);

      // Start gilt als bereits „geklickt“ → beginne bei Schritt 2
      this.currentIndex = 1;

      // kleines Blink-Feedback
      this.scene.tweens.add({
        targets: startDot,
        alpha: 0.3,
        duration: 300,
        yoyo: true,
        repeat: 2
      });
    }
  }

  _select(index) {
    const expected = this.variant.order[this.currentIndex];
    if (index === expected) {
      // Korrekt
      this.dots[index].setFillStyle(0x00ff00);

      // Linie zum vorherigen Punkt
      if (this.currentIndex > 0) {
        const prevIndex = this.variant.order[this.currentIndex - 1];
        const prevDot = this.variant.points[prevIndex];
        const currDot = this.variant.points[index];
        this.graphics.lineStyle(4, 0xffffff);
        this.graphics.strokeLineShape(
          new Phaser.Geom.Line(prevDot.x, prevDot.y, currDot.x, currDot.y)
        );
      }

      this.currentIndex++;

      // Fertig?
      if (this.currentIndex >= this.variant.order.length) {
        this.onSolved && this.onSolved();
      }
    } else {
      // Falsch → Reset
      this._reset();
    }
  }

  _reset() {
    this.currentIndex = 1; // direkt nach Startpunkt
    this.graphics.clear();

    const start = this.variant.order[0];
    this.dots.forEach((d, i) => {
      d.setFillStyle(i === start ? 0x00ff00 : 0x444444);
    });
  }

  destroy() {
    this.graphics?.destroy();
    this.dots.forEach(d => d.destroy());
    this.dots = [];
  }
}
