// src/puzzles/CodeLockPuzzle.js
import { DESIGN_SIZE } from "../config.js";

export default class CodeLockPuzzle {
  constructor(scene, cfg, onSolved) {
    const defaults = {
      digits: 4,
      x: DESIGN_SIZE / 2,
      y: DESIGN_SIZE / 2,
      hint: null,
    };

    this.scene = scene;
    this.cfg = Object.assign(defaults, cfg || {});
    this.onSolved = onSolved;

    this.values = Array(this.cfg.digits).fill(0);
    this.boxes = [];
    this.frame = null;
    this.hint = null;

    // NEU: dynamische Aufgaben + Lösung
    this.problems = [];
    this.solution = [];
    this.problemTexts = [];
  }

  preload() { /* keine Assets nötig */ }

  create(parentContainer) {
    const { digits } = this.cfg;

    // --- Aufgaben generieren (immer 0–9 als Ergebnis) ---
    this.problems = this._genProblems(digits);
    this.solution = this.problems.map(p => p.result);

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
  const titleY = baseY - DESIGN_SIZE * 0.20;
  const title = this._makeText(
    baseX,
    titleY,
    "DER KUECHENSCHRANK HAT EIN VORHAENGESCHLOSS.",
    {
      fontFamily: "SpukFont",
      fontSize: `${DESIGN_SIZE * 0.026}px`,
      color: "#ffffff",
      align: "center",
      wordWrap: { width: DESIGN_SIZE * 0.9 }
    },
    parentContainer
  ).setOrigin(0.5);
    const startX = baseX - ((digits - 1) * spacing) / 2;

    // Rahmen
    this.frame = this._makeRect(
      baseX, baseY, digits * spacing + spacing, panelH, 0x000000, 0.25, parentContainer
    ).setStrokeStyle(2, 0x777777);

    // AUFGABEN-ANZEIGE (immer sichtbar)
    const problemsY = baseY - DESIGN_SIZE * 0.12;
    const problemsStr = this.problems
      .map((p, i) => `${i + 1}) ${p.a} ${p.op} ${p.b} = ?`)
      .join("    ");
    const problemsText = this._makeText(
      baseX, problemsY, problemsStr,
      {
        fontFamily: "Arial",
        fontSize: `${DESIGN_SIZE * 0.02}px`,
        color: "#dddddd",
        align: "center",
        wordWrap: { width: Math.max(digits * spacing + spacing, DESIGN_SIZE * 0.85) }
      },
      parentContainer
    ).setOrigin(0.5);
    this.problemTexts.push(problemsText);

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
    if (this.solution.length !== this.values.length) return;
    for (let i = 0; i < this.solution.length; i++) {
      if (this.values[i] !== this.solution[i]) return;
    }
    this.scene.time.delayedCall(150, () => this.onSolved && this.onSolved());
  }

  // --- NEU: Aufgaben-Generator (nur Grundrechenarten, Ergebnis 0–9) ---
  _genProblems(n) {
    const probs = [];
    const ops = ["+", "-", "×", "÷"];
    for (let i = 0; i < n; i++) {
      const op = ops[Phaser.Math.Between(0, ops.length - 1)];
      let a, b, result;

      if (op === "+") {
        // a+b <= 9
        a = Phaser.Math.Between(0, 9);
        b = Phaser.Math.Between(0, 9 - a);
        result = a + b;
      } else if (op === "-") {
        // a-b >= 0
        a = Phaser.Math.Between(0, 9);
        b = Phaser.Math.Between(0, a);
        result = a - b;
      } else if (op === "×") {
        // a*b <= 9
        // Variante 1: Zielprodukt vorgeben, dann Faktoren wählen
        const target = Phaser.Math.Between(0, 9);
        // Teiler von target im Bereich 1..9
        const divisors = [];
        for (let d = 1; d <= 9; d++) if (target % d === 0) divisors.push(d);
        const bCand = target === 0 ? Phaser.Math.Between(1, 9) : divisors[Phaser.Math.Between(0, divisors.length - 1)];
        const aCand = target === 0 ? 0 : target / bCand;
        a = aCand;
        b = bCand;
        result = target;
      } else if (op === "÷") {
        // a ÷ b = r, ganzzahlig, 0..9, b in 1..9
        const r = Phaser.Math.Between(0, 9);
        b = Phaser.Math.Between(1, 9);
        a = r * b;
        result = r;
      }

      probs.push({ a, op, b, result });
    }
    return probs;
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
    this.problemTexts.forEach(t => t.destroy());
  }
}
