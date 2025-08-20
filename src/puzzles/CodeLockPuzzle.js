// src/puzzles/CodeLockPuzzle.js
import { DESIGN_SIZE } from "../config.js";

export default class CodeLockPuzzle {
  constructor(scene, cfg, onSolved) {
    const defaults = {
      digits: 4,
      x: DESIGN_SIZE / 2,
      y: DESIGN_SIZE / 2,
      hint: null
    };

    this.scene = scene;
    this.cfg = Object.assign(defaults, cfg || {});
    this.onSolved = onSolved;

    this.values = Array(this.cfg.digits).fill(0);
    this.boxes = [];
    this.frame = null;
    this.hint = null;
  }

  preload() { /* keine Assets nötig */ }

  create(parentContainer) {
    const { digits } = this.cfg;

    // Layoutwerte
    const spacing   = DESIGN_SIZE * 0.07;
    const boxW      = DESIGN_SIZE * 0.056;
    const boxH      = DESIGN_SIZE * 0.072;
    const fontBig   = `${DESIGN_SIZE * 0.04}px`;
    const fontSmall = `${DESIGN_SIZE * 0.018}px`;
    const panelH    = DESIGN_SIZE * 0.12;

    // Wenn wir in einem Container sind → Ursprung (0,0)
    const baseX = parentContainer ? 0 : this.cfg.x;
    const baseY = parentContainer ? 0 : this.cfg.y;

    const startX = baseX - ((digits - 1) * spacing) / 2;

    // Rahmen
    this.frame = this._makeRect(baseX, baseY, digits * spacing + spacing, panelH, 0x000000, 0.25, parentContainer)
      .setStrokeStyle(2, 0x777777);

    // Ziffernfelder + Pfeile
    for (let i = 0; i < digits; i++) {
      const bx = startX + i * spacing;

      const rect = this._makeRect(bx, baseY, boxW, boxH, 0x1b1b2b, 0.9, parentContainer)
        .setStrokeStyle(2, 0x999999)
        .setInteractive({ useHandCursor: true });

      const txt = this._makeText(bx, baseY, "0", { fontSize: fontBig, color: "#ffffff" }, parentContainer)
        .setOrigin(0.5);

      rect.on("pointerdown", () => this._increment(i, txt));

      const up = this._makeText(bx, baseY - DESIGN_SIZE * 0.055, "▲", { fontSize: fontSmall, color: "#bbbbbb" }, parentContainer)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      const dn = this._makeText(bx, baseY + DESIGN_SIZE * 0.055, "▼", { fontSize: fontSmall, color: "#bbbbbb" }, parentContainer)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      up.on("pointerdown", () => this._increment(i, txt));
      dn.on("pointerdown", () => this._decrement(i, txt));

      this.boxes.push({ rect, txt, up, dn });
    }

    // Hinweis erst nach Klick anzeigen
    if (this.cfg.hint) {
      const hintBtn = this._makeText(
        baseX, baseY + DESIGN_SIZE * 0.1,
        "HINWEIS",
        { fontFamily: "SpukFont", fontSize: `${DESIGN_SIZE * 0.022}px`, color: "#ffffffff" },
        parentContainer
      ).setOrigin(0.5).setInteractive({ useHandCursor: true });

      hintBtn.on("pointerdown", () => {
        if (!this.hint) {
          this.hint = this._makeText(
            baseX,
            baseY + DESIGN_SIZE * 0.37,
            this.cfg.hint,
            { fontFamily: "SpukFont", fontSize: `${DESIGN_SIZE * 0.018}px`, color: "#dddddd", wordWrap: { width: digits * spacing + spacing } },
            parentContainer
          ).setOrigin(0.5);
        }
      });
    }
  }

  // ---------- interne Helfer ----------

  _makeRect(x, y, w, h, fill, alpha, parentContainer) {
    const r = this.scene.add.rectangle(x, y, w, h, fill, alpha);
    if (parentContainer) parentContainer.add(r);
    return r;
  }

  _makeText(x, y, text, style, parentContainer) {
    const t = this.scene.add.text(x, y, text, style || {});
    if (parentContainer) parentContainer.add(t);
    return t;
  }

  _increment(i, txt) {
    this.values[i] = (this.values[i] + 1) % 10;
    txt.setText(String(this.values[i]));
    this._check();
  }

  _decrement(i, txt) {
    this.values[i] = (this.values[i] + 9) % 10;
    txt.setText(String(this.values[i]));
    this._check();
  }

  _check() {
    const sol = this.cfg.solution || [];
    if (sol.length !== this.values.length) return;
    for (let i = 0; i < sol.length; i++) {
      if (this.values[i] !== sol[i]) return;
    }
    this.scene.time.delayedCall(150, () => this.onSolved && this.onSolved());
  }

  destroy() {
    this.frame?.destroy();
    this.boxes.forEach(b => {
      b.rect.destroy();
      b.txt.destroy();
      b.up.destroy();
      b.dn.destroy();
    });
    this.hint?.destroy();
  }
}
