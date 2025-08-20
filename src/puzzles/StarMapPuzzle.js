// src/puzzles/StarMapPuzzle.js
export default class StarMapPuzzle {
  constructor(scene, config, onSolved) {
    this.scene = scene;
    this.config = Object.assign(
      {
        // Liste der verfügbaren Sets: ["alien", "komet", ...]
        names: [],
        // optionaler Basis-Pfad vor den Dateien, z. B. "assets/puzzles/starmap/"
        basePath: "",
        // optionales Muster, wenn deine Dateien anders heißen:
        // Platzhalter {name} und {index} stehen zur Verfügung
        // Standard: "{name}{index}.png"  -> "alien1.png" ... "alien25.png"
        filePattern: "{name}{index}.png",
        pieceSize: 128,
        scaleFactor: 1
      },
      config || {}
    );

    this.onSolved = onSolved;

    this.rows = 5;
    this.cols = 5;
    this.pieceSize = this.config.pieceSize;
    this.scaleFactor = this.config.scaleFactor;

    this.pieces = [];
    this.gridSlots = [];
    this.selectedPiece = null;

    // Set einmal pro Instanz wählen
    if (!Array.isArray(this.config.names) || this.config.names.length === 0) {
      console.warn("[StarMapPuzzle] Keine 'names' konfiguriert – es wird 'sternkarte' als Fallback verwendet.");
      this.selectedSet = "sternkarte";
    } else {
      // Phaser-Helper vorhanden? Falls nicht, simples Zufallspick.
      this.selectedSet = (window.Phaser && Phaser.Utils?.Array?.GetRandom)
        ? Phaser.Utils.Array.GetRandom(this.config.names)
        : this.config.names[Math.floor(Math.random() * this.config.names.length)];
    }
  }

  preload() {
    // 25 Teile: {name}{1..25}.png (oder gemäß filePattern)
    for (let index = 1; index <= 25; index++) {
      const key = `${this.selectedSet}${index}`;
      if (!this.scene.textures.exists(key)) {
        const url =
          this.config.basePath +
          this.config.filePattern
            .replace("{name}", this.selectedSet)
            .replace("{index}", index);
        this.scene.load.image(key, url);
      }
    }
  }

  create(container) {
    const { rows, cols, pieceSize, scaleFactor } = this;
    const gridSize = pieceSize * scaleFactor;

    const halfW = (cols / 2) * gridSize;
    const halfH = (rows / 2) * gridSize;

    console.log(`[StarMapPuzzle] create 5x5 – Set="${this.selectedSet}"`);

    // --- Puzzle-Teile (immer 25) ---
    let index = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${this.selectedSet}${index}`;
        const piece = this.scene.add.image(0, 0, key)
          .setOrigin(0.5)
          .setDisplaySize(gridSize, gridSize)
          .setInteractive({ useHandCursor: true });

        piece.row = r;
        piece.col = c;
        piece.placed = false;

        // Startposition außerhalb des Gitters randomisiert
        const side = (window.Phaser ? Phaser.Math.Between(0, 3) : Math.floor(Math.random() * 4)); // 0..3
        switch (side) {
          case 0: // oben
            piece.x = this._randBetween(-halfW * 1.2, halfW * 1.2);
            piece.y = -halfH - this._randBetween(gridSize, 2 * gridSize);
            break;
          case 1: // unten
            piece.x = this._randBetween(-halfW * 0.5, halfW * 1.2);
            piece.y = halfH + this._randBetween(gridSize, 2 * gridSize);
            break;
          case 2: // links
            piece.x = -halfW - this._randBetween(gridSize, 2 * gridSize);
            piece.y = this._randBetween(-halfH * 1.2, halfH * 0.1);
            break;
          case 3: // rechts
          default:
            piece.x = halfW + this._randBetween(gridSize, 2 * gridSize);
            piece.y = this._randBetween(-halfH * 1.2, halfH * 1.2);
            break;
        }

        piece.on("pointerdown", () => {
          if (!piece.placed) this._selectPiece(piece);
        });

        container.add(piece);
        this.pieces.push(piece);
        index++;
      }
    }

    // --- Grid-Slots ---
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - (cols - 1) / 2) * gridSize;
        const y = (r - (rows - 1) / 2) * gridSize;

        const slot = this.scene.add.rectangle(x, y, gridSize, gridSize, 0x000000, 0)
          .setStrokeStyle(1, 0xaaaaaa)
          .setOrigin(0.5)
          .setInteractive();

        slot.row = r;
        slot.col = c;
        slot.occupied = false;

        slot.on("pointerdown", () => {
          if (this.selectedPiece && !slot.occupied) {
            this._placePieceInSlot(this.selectedPiece, slot);
          }
        });

        container.add(slot);
        this.gridSlots.push(slot);
      }
    }
  }

  _selectPiece(piece) {
    if (this.selectedPiece) this.selectedPiece.clearTint();
    this.selectedPiece = piece;
    piece.setTint(0x00ff00);
  }

  _placePieceInSlot(piece, slot) {
    if (piece.row === slot.row && piece.col === slot.col) {
      piece.setPosition(slot.x, slot.y);
      piece.placed = true;
      slot.occupied = true;
      piece.clearTint();
      this.selectedPiece = null;
      this._checkSolved();
    } else {
      piece.clearTint();
      this.selectedPiece = null;
    }
  }

  _checkSolved() {
    if (this.pieces.every(p => p.placed)) {
      this.scene.events.emit("puzzleSolved");
      if (this.onSolved) this.onSolved();
    }
  }

  _randBetween(min, max) {
    if (window.Phaser) return Phaser.Math.Between(min, max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  destroy() {
    this.pieces.forEach(p => p.destroy());
    this.gridSlots.forEach(s => s.destroy());
    this.pieces = [];
    this.gridSlots = [];
    this.selectedPiece = null;
  }
}
