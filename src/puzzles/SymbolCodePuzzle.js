// src/puzzles/SymbolCodePuzzle.js
import { DESIGN_SIZE } from "../config.js";

export default class SymbolCodePuzzle {
  constructor(scene, cfg, onSolved) {
    this.scene = scene;
    this.cfg = Object.assign(
      {
        allowedForms: ["N","U","Z","L","C","O","S","I"], // zufällige Ziel-Formen
        padSize: DESIGN_SIZE * 0.42,  // Gesamtgröße des 2x2-Pads
        gap: DESIGN_SIZE * 0.02,      // Abstand zwischen den Feldern
        showLegend: true              // Info-Text unter dem Pad anzeigen
      },
      cfg || {}
    );
    this.onSolved = onSolved;

    this.items = [];      // klickbare Felder (Runenbilder oder Rechtecke)
    this.sequence = [];   // Spieler-Eingabe (Folge von "UL","UR","LL","LR")
    this.targetForm = null;
    this.solution = [];   // erwartete Folge zur gewählten Form

    this._root = null;    // Container-Referenz für destroy()
  }

  preload() {
    // Keine Assets nötig: runes (rune1..rune4) sind laut Vorgabe bereits geladen.
  }

  create(parentContainer) {
    const container = parentContainer || this.scene.add.container(DESIGN_SIZE/2, DESIGN_SIZE/2);
    this._root = container;

    // --- Ziel-Form wählen & Lösung festlegen ---
    this.targetForm = Phaser.Utils.Array.GetRandom(this.cfg.allowedForms);
    this.solution = this._sequenceFor(this.targetForm);

    // --- Headline / Hinweis ---
    const riddleText = this.scene.add.text(
      0, -this.cfg.padSize * 0.65,
      this._hintFor(this.targetForm),
      {
        fontFamily: "SpukFont",
        fontSize: `${DESIGN_SIZE * 0.028}px`,
        color: "#ffffff",
        align: "center",
        wordWrap: { width: DESIGN_SIZE * 0.86 }
      }
    ).setOrigin(0.5);
    container.add(riddleText);

    // --- 2x2-Pad mit Runen bauen ---
    this._buildPad(container);

    // --- Legende (optional) ---
    if (this.cfg.showLegend) {
      const legend = this.scene.add.text(
        0, this.cfg.padSize * 0.62,
        "KLICKE DIE ECKEN IN DER RICHTIGEN REIHENFOLGE.",
        {
          fontFamily: "SpukFont",
          fontSize: `${DESIGN_SIZE * 0.018}px`,
          color: "#cccccc",
          align: "center",
          wordWrap: { width: DESIGN_SIZE * 0.8 }
        }
      ).setOrigin(0.5);
      container.add(legend);
    }
  }

  // ---- Pad mit fest zugeordneten Runen (rune1..rune4) ----
  _buildPad(container) {
    const S = this.cfg.padSize;
    const G = this.cfg.gap;
    const tile = (S - G) / 2;

    // Positionen relativ zum Containerzentrum
    const POS = {
      UL: { x: - (tile/2 + G/2), y: - (tile/2 + G/2) }, // oben links
      UR: { x: + (tile/2 + G/2), y: - (tile/2 + G/2) }, // oben rechts
      LL: { x: - (tile/2 + G/2), y: + (tile/2 + G/2) }, // unten links
      LR: { x: + (tile/2 + G/2), y: + (tile/2 + G/2) }, // unten rechts
    };

    // Feste Zuordnung: rune1..rune4 → Ecken
    const byCode = {
      UL: "rune1",
      UR: "rune2",
      LL: "rune3",
      LR: "rune4",
    };

    // Hintergrundplatte
    const bg = this.scene.add.rectangle(0, 0, S, S, 0x000000, 0.25)
      .setStrokeStyle(2, 0x777777);
    container.add(bg);

    const makeClickable = (code, displayObj) => {
      displayObj
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          // visuelles Feedback
          if (displayObj.setAlpha) {
            displayObj.setAlpha(0.7);
            this.scene.time.delayedCall(120, () => displayObj.setAlpha(1));
          }
          this._press(code);
        });
      this.items.push(displayObj);
    };

    // Runenbilder platzieren
    Object.entries(byCode).forEach(([code, key]) => {
      const p = POS[code];
      let img;
      if (this.scene.textures.exists(key)) {
        img = this.scene.add.image(p.x, p.y, key).setOrigin(0.5).setDisplaySize(tile, tile);
      } else {
        // Fallback: falls Textur fehlt → Rechteck
        img = this.scene.add.rectangle(p.x, p.y, tile, tile, 0x1b1b2b, 0.9).setStrokeStyle(2, 0x999999);
        this.scene.add.text(p.x, p.y, code, {
          fontFamily: "SpukFont",
          fontSize: `${DESIGN_SIZE * 0.03}px`,
          color: "#ffffff",
          align: "center"
        }).setOrigin(0.5);
      }
      container.add(img);
      makeClickable(code, img);
    });
  }

  _press(code) {
    // Eingabe aufzeichnen
    this.sequence.push(code);

    // Prüfe Schritt-für-Schritt (Prefix-Check)
    const idx = this.sequence.length - 1;
    if (this.sequence[idx] !== this.solution[idx]) {
      // Falsch → Reset + kurzes Blink-Feedback
      this.sequence = [];
      this.scene.tweens.add({
        targets: this.items,
        alpha: 0.2,
        duration: 120,
        yoyo: true,
        repeat: 1,
        onComplete: () => this.items.forEach(i => i.setAlpha(1))
      });
      return;
    }

    // Fertig?
    if (this.sequence.length === this.solution.length) {
      this.onSolved && this.onSolved();
    }
  }

  // ---- Sequenzen laut deiner Vorgabe ----
  _sequenceFor(letter) {
    // Kürzel: UL = oben links, UR = oben rechts, LL = unten links, LR = unten rechts
    const seqs = {
      N: ["LL","UL","LR","UR"],
      U: ["UL","LL","LR","UR"],
      Z: ["UL","UR","LL","LR"],
      L: ["UL","LL","LR"],
      C: ["UR","UL","LL","LR"],
      O: ["UL","LL","LR","UR","UL"],
      S: ["UR","UL","LR","LL"],
      I: ["UR","LR"],
    };
    return (seqs[letter] || []).slice();
  }

  // ---- Klartext-Hinweise (kannst du gern kryptischer formulieren) ----
  _hintFor(letter) {
    const hints = {
      N: "DAS WIDERWORT BEGINNT UND ENDET MIT EINEM …",
      U: "ICH BIN DIE FORM EINES HUFES - WELCHER BUCHSTABE SUCHST DU?",
      Z: "ZICKZACK WIE EIN BLITZ - WELCHER BUCHSTABE PASST?",
      L: "EIN WINKEL, ZWEI SCHENKEL - WELCHER BUCHSTABE IST GEMEINT?",
      C: "FAST EIN KREIS, DOCH OFFEN - WELCHER BUCHSTABE TRIFFT ES?",
      O: "RUND WIE DER MOND - WELCHER BUCHSTABE WIRD GESUCHT?",
      S: "SCHLANGENFOERMIG GEWUNDEN - WELCHER BUCHSTABE IST GEMEINT?",
      I: "EIN GERADER STRICH - WELCHEN BUCHSTABEN SUCHST DU?"
    };
    return hints[letter] || `Finde die Form „${letter}“.`;
  }

  destroy() {
    this.items.forEach(i => i.destroy());
    this.items = [];
    this._root?.destroy?.();
  }
}
