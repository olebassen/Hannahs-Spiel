// src/puzzles/StarMapPuzzle.js
export default class StarMapPuzzle {
  constructor(scene, config, onSolved) {
    this.scene = scene;
    this.config = config;
    this.onSolved = onSolved;

    this.rows = 5;
    this.cols = 5;
    this.pieceSize = config.pieceSize;
    this.scaleFactor = config.scaleFactor || 1;

    this.pieces = [];
    this.gridSlots = [];
    this.selectedPiece = null;
  }

  create(container) {
    const { rows, cols, pieceSize, scaleFactor } = this;
    const gridSize = pieceSize * scaleFactor;

    const halfW = (cols / 2) * gridSize;
    const halfH = (rows / 2) * gridSize;

    console.log("[StarMapPuzzle] create Sternkarte 5x5");

    // --- Puzzle-Teile ---
    let index = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `sternkarte${index}`;
        const piece = this.scene.add.image(0, 0, key)
          .setOrigin(0.5)
          .setDisplaySize(gridSize, gridSize)
          .setInteractive({ useHandCursor: true });

        piece.row = r;
        piece.col = c;
        piece.placed = false;

        // Startposition: garantiert außerhalb des Grid-Bereichs
        const side = Phaser.Math.Between(0, 3); // 0=oben,1=unten,2=links,3=rechts
        switch (side) {
          case 0: // oben
            piece.x = Phaser.Math.Between(-halfW * 1.2, halfW * 1.2);
            piece.y = -halfH - Phaser.Math.Between(gridSize, 2 * gridSize);
            break;
          case 1: // unten
            piece.x = Phaser.Math.Between(-halfW * 0.5, halfW * 1.2);
            piece.y = halfH + Phaser.Math.Between(gridSize, 2 * gridSize);
            break;
          case 2: // links
            piece.x = -halfW - Phaser.Math.Between(gridSize, 2 * gridSize);
            piece.y = Phaser.Math.Between(-halfH * 1.2, halfH * 0.1);
            break;
          case 3: // rechts
            piece.x = halfW + Phaser.Math.Between(gridSize, 2 * gridSize);
            piece.y = Phaser.Math.Between(-halfH * 1.2, halfH * 1.2);
            break;
        }

        piece.on("pointerdown", () => {
          if (!piece.placed) {
            this._selectPiece(piece);
          }
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
    if (this.selectedPiece) {
      this.selectedPiece.clearTint();
    }
    this.selectedPiece = piece;
    piece.setTint(0x00ff00);
    console.log(`[StarMapPuzzle] Piece selected: (${piece.row},${piece.col})`);
  }

  _placePieceInSlot(piece, slot) {
    if (piece.row === slot.row && piece.col === slot.col) {
      piece.setPosition(slot.x, slot.y);
      piece.placed = true;
      slot.occupied = true;
      piece.clearTint();
      this.selectedPiece = null;
      console.log(`[StarMapPuzzle] Piece locked at slot (${slot.row},${slot.col})`);
      this._checkSolved();
    } else {
      piece.clearTint();
      this.selectedPiece = null;
      console.log(`[StarMapPuzzle] Wrong slot for piece (${piece.row},${piece.col})`);
    }
  }

  _checkSolved() {
    if (this.pieces.every(p => p.placed)) {
      console.log("[StarMapPuzzle] Puzzle solved!");
      this.scene.events.emit("puzzleSolved");
      if (this.onSolved) this.onSolved();
    }
  }

  destroy() {
    this.pieces.forEach(p => p.destroy());
    this.gridSlots.forEach(s => s.destroy());
  }
}
