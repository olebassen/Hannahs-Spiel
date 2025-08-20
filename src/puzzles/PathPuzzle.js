import { DESIGN_SIZE } from "../config.js";

export default class PathPuzzle {
  constructor(scene, cfg, onSolved) {
    this.scene = scene;
    this.cfg = cfg;
    this.onSolved = onSolved;

    this.currentIndex = 0;
    this.dots = [];
    this.lines = [];
    this.graphics = null;
  }

  preload() {
    // Punkte brauchen kein Bild – wir nehmen Kreise
  }

  create(parentContainer) {
    const { points, order, hint } = this.cfg;

    // Hinweistext
    if (hint) {
      const hintText = this.scene.add.text(
        DESIGN_SIZE / 2,
        450,
        hint,
        {
          fontFamily: "SpukFont",
          fontSize: "28px",
          color: "#ffffff",
          align: "center",
          wordWrap: { width: DESIGN_SIZE - 100 }
        }
      ).setOrigin(1);

      if (parentContainer) parentContainer.add(hintText);
    }

    // Linien-Layer
    this.graphics = this.scene.add.graphics();
    this.graphics.setDepth(1);
    if (parentContainer) parentContainer.add(this.graphics);

    // Punkte anlegen
    points.forEach((p, i) => {
      const dot = this.scene.add.circle(p.x, p.y, 10, 0x444444)
        .setInteractive({ useHandCursor: true })
        .setDepth(2);

      dot.on("pointerdown", () => this._select(i, dot));

      if (parentContainer) parentContainer.add(dot);
      this.dots.push(dot);
    });

    // 👉 Startpunkt aktivieren
    const startIndex = order[0];
    const startDot = this.dots[startIndex];
    startDot.setFillStyle(0x00ff00);

    // Startpunkt zählt schon → man beginnt bei Schritt 2
    this.currentIndex = 1;

    // Kurzes Aufblinken für den Startpunkt
    this.scene.tweens.add({
      targets: startDot,
      alpha: 0.3,
      duration: 300,
      yoyo: true,
      repeat: 2
    });
  }

  _select(index, dot) {
    const expected = this.cfg.order[this.currentIndex];
    if (index === expected) {
      // Korrekt
      dot.setFillStyle(0x00ff00);

      // Linie zum vorherigen Punkt
      if (this.currentIndex > 0) {
        const prevIndex = this.cfg.order[this.currentIndex - 1];
        const prevDot = this.cfg.points[prevIndex];
        const currDot = this.cfg.points[index];
        this.graphics.lineStyle(4, 0xffffff);
        this.graphics.strokeLineShape(
          new Phaser.Geom.Line(prevDot.x, prevDot.y, currDot.x, currDot.y)
        );
      }

      this.currentIndex++;

      // Fertig?
      if (this.currentIndex >= this.cfg.order.length) {
        this.onSolved && this.onSolved();
      }
    } else {
      // Falsch → reset
      this._reset();
    }
  }

  _reset() {
    this.currentIndex = 1; // direkt nach Startpunkt
    this.graphics.clear();
    this.dots.forEach((d, i) => {
      if (i === this.cfg.order[0]) {
        d.setFillStyle(0x00ff00);
      } else {
        d.setFillStyle(0x444444);
      }
    });
  }

  destroy() {
    this.graphics?.destroy();
    this.dots.forEach(d => d.destroy());
  }
}
