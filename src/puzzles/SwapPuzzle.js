// src/puzzles/SwapPuzzle.js
import { DESIGN_SIZE } from "../config.js";

export default class SwapPuzzle {
  constructor(scene, cfg, onSolved) {
    this.scene = scene;
    this.cfg = cfg;
    this.onSolved = onSolved;

    this.rows = cfg.rows || 3;
    this.cols = cfg.cols || 3;
    this.imageKey = cfg.imageKey; // z. B. "reagenzglas"
    this.tileSize = cfg.tileSize || 160;

    this.tiles = [];
    this.positions = [];
    this.selected = null;
  }

  preload() {
    if (this.imageKey && !this.scene.textures.exists(this.imageKey)) {
      this.scene.load.image(this.imageKey, this.cfg.path);
    }
  }

  create(parentContainer) {
    const { rows, cols, tileSize } = this;

    // Bild in Teile zerlegen
    const texture = this.scene.textures.get(this.imageKey);
    const base = texture.getSourceImage();
    const pieceWidth = base.width / cols;
    const pieceHeight = base.height / rows;

    // Skalierung berechnen, damit jedes Tile tileSize groß wird
    const scaleX = tileSize / pieceWidth;
    const scaleY = tileSize / pieceHeight;

    // Offsets: entweder aus cfg oder automatisch zentriert
    const offsetX = this.cfg.x !== undefined
      ? this.cfg.x
      : DESIGN_SIZE / 2 - (cols * tileSize) / 2;
    const offsetY = this.cfg.y !== undefined
      ? this.cfg.y
      : DESIGN_SIZE / 2 - (rows * tileSize) / 2;

    // Canvas-Slices erzeugen
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const key = `${this.imageKey}_${row}_${col}`;
        if (!this.scene.textures.exists(key)) {
          const rt = this.scene.textures.createCanvas(
            key,
            pieceWidth,
            pieceHeight
          );
          const ctx = rt.getContext();
          ctx.drawImage(
            base,
            col * pieceWidth,
            row * pieceHeight,
            pieceWidth,
            pieceHeight,
            0,
            0,
            pieceWidth,
            pieceHeight
          );
          rt.refresh();
        }
        this.positions.push({ row, col, key });
      }
    }

    // Mischen
    Phaser.Utils.Array.Shuffle(this.positions);

    // Tiles anlegen
    this.positions.forEach((pos, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = offsetX + col * tileSize;
      const y = offsetY + row * tileSize;

      const tile = this.scene.add.image(x, y, pos.key)
        .setInteractive({ useHandCursor: true })
        .setOrigin(0)
        .setScale(scaleX, scaleY);

      tile.correctRow = parseInt(pos.key.split("_")[1]);
      tile.correctCol = parseInt(pos.key.split("_")[2]);
      tile.currIndex = i;

      tile.on("pointerdown", () => this._selectTile(tile));

      if (parentContainer) parentContainer.add(tile);
      this.tiles.push(tile);
    });
  }

  _selectTile(tile) {
    if (!this.selected) {
      this.selected = tile;
      tile.setTint(0xffff00); // gelb markieren
    } else {
      this._swapTiles(this.selected, tile);
      this.selected.clearTint();
      this.selected = null;

      if (this._checkSolved()) {
        this.onSolved && this.onSolved();
      }
    }
  }

  _swapTiles(t1, t2) {
    const idx1 = t1.currIndex;
    const idx2 = t2.currIndex;

    // Positionen tauschen
    const tmpX = t1.x, tmpY = t1.y;
    t1.x = t2.x; t1.y = t2.y;
    t2.x = tmpX; t2.y = tmpY;

    // Indices tauschen
    t1.currIndex = idx2;
    t2.currIndex = idx1;
  }

  _checkSolved() {
    return this.tiles.every(tile => {
      const row = Math.floor(tile.currIndex / this.cols);
      const col = tile.currIndex % this.cols;
      return row === tile.correctRow && col === tile.correctCol;
    });
  }

  destroy() {
    this.tiles.forEach(t => t.destroy());
  }
}
