import { DESIGN_SIZE } from "../config.js";

export default class SymbolCodePuzzle {
  constructor(scene, cfg, onSolved) {
    this.scene = scene;
    this.cfg = cfg;
    this.onSolved = onSolved;

    this.sequence = [];
    this.items = [];
  }

  preload() {
    this.cfg.symbols.forEach(sym => {
      if (sym.path && !this.scene.textures.exists(sym.key)) {
        this.scene.load.image(sym.key, sym.path);
      }
    });
  }

create(parentContainer) {
  // --- Rätseltext hinzufügen ---
  const riddleText = this.scene.add.text(
    DESIGN_SIZE / 2,   // Mitte X
    80,                // etwas oberhalb vom Spielfeld
    "DAS WIDERWORT BEGINNT UND ENDET MIT EINEM...",
    {
      fontFamily: "SpukFont",
      fontSize: "28px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: DESIGN_SIZE - 100 }
    }
  ).setOrigin(1, 1); // horizontal zentriert

  if (parentContainer) parentContainer.add(riddleText);

  // --- Symbole hinzufügen ---
  this.cfg.symbols.forEach((sym, i) => {
    const pos = this.cfg.positions[i];

    const item = this.scene.add.image(pos.x, pos.y, sym.key)
      .setInteractive({ useHandCursor: true })
      .setScale(0.4)
      .setAlpha(1);

    item.on("pointerdown", () => {
      this._select(sym.key, item);
    });

    if (parentContainer) parentContainer.add(item);
    this.items.push(item);
  });
}


_select(key, item) {
  this.sequence.push(key);

  // --- Statt Scale-Tween: kurzes Aufleuchten ---
  item.setTint(0xffff99); // Gelb
  this.scene.time.delayedCall(300, () => {
    item.clearTint();
  });

  // Prüfen ob Lösung vollständig
  if (this.sequence.length === this.cfg.solution.length) {
    if (this._checkSolution()) {
      this.onSolved && this.onSolved();
    } else {
      // Reset
      this.sequence = [];
      this.scene.tweens.add({
        targets: this.items,
        alpha: 0.2,
        duration: 200,
        yoyo: true,
        repeat: 2,
        onComplete: () => this.items.forEach(i => i.setAlpha(1))
      });
    }
  }
}


  _checkSolution() {
    return this.sequence.every((k, i) => k === this.cfg.solution[i]);
  }

  destroy() {
    this.items.forEach(i => i.destroy());
  }
}
