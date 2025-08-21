// src/puzzles/SwapPuzzle.js
import { DESIGN_SIZE } from "../config.js";

export default class SwapPuzzle {
  constructor(scene, cfg, onSolved) {
    this.scene = scene;
    this.cfg = Object.assign(
      {
        rows: 3,
        cols: 3,
        tileSize: 160,
        // NEU: mehrere Alternativen
        names: null,               // z.B. ["reagenzglas", "kolben", "alien"]
        basePath: "",              // z.B. "assets/puzzles/swap/"
        filePattern: "{name}.png", // wie der Basisbild-Dateiname heißt
        // fallback (alt):
        imageKey: null,
        path: null,
        x: undefined,
        y: undefined
      },
      cfg || {}
    );
    this.onSolved = onSolved;

    this.rows = this.cfg.rows;
    this.cols = this.cfg.cols;
    this.tileSize = this.cfg.tileSize;

    // Zufälliges Set wählen (oder altes imageKey verwenden)
    this.selectedKey = this._pickImageKey();

    this.tiles = [];
    this.positions = [];
    this.selected = null;
  }

  _pickImageKey() {
    if (Array.isArray(this.cfg.names) && this.cfg.names.length > 0) {
      // Random aus 'names'
      if (window.Phaser && Phaser.Utils?.Array?.GetRandom) {
        return Phaser.Utils.Array.GetRandom(this.cfg.names);
      }
      return this.cfg.names[Math.floor(Math.random() * this.cfg.names.length)];
    }
    // Rückwärtskompatibel
    return this.cfg.imageKey;
  }

  preload() {
    // Basisbild laden, falls noch nicht vorhanden
    if (!this.selectedKey) return;

    if (!this.scene.textures.exists(this.selectedKey)) {
      // bevorzugt: names + basePath + filePattern
      if (Array.isArray(this.cfg.names) && this.cfg.names.length > 0) {
        const url = this.cfg.basePath + this.cfg.filePattern.replace("{name}", this.selectedKey);
        this.scene.load.image(this.selectedKey, url);
      } else if (this.cfg.path) {
        // rückwärtskompatibel: imageKey + path
        this.scene.load.image(this.selectedKey, this.cfg.path);
      }
    }
  }

  create(parentContainer) {
    const { rows, cols, tileSize } = this;

    // Bild in Teile zerlegen
    const texture = this.scene.textures.get(this.selectedKey);
    const base = texture.getSourceImage();
    const pieceWidth = Math.floor(base.width / cols);
    const pieceHeight = Math.floor(base.height / rows);

    // Skalierung berechnen
    const scaleX = tileSize / pieceWidth;
    const scaleY = tileSize / pieceHeight;

    // Offsets: aus cfg oder automatisch zentriert
    const offsetX = this.cfg.x !== undefined
      ? this.cfg.x
      : DESIGN_SIZE / 2 - (cols * tileSize) / 2;
    const offsetY = this.cfg.y !== undefined
      ? this.cfg.y
      : DESIGN_SIZE / 2 - (rows * tileSize) / 2;

    // Canvas-Slices erzeugen (ein Key pro Tile)
    this.positions = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const key = `${this.selectedKey}_${row}_${col}`;
        if (!this.scene.textures.exists(key)) {
          const rt = this.scene.textures.createCanvas(key, pieceWidth, pieceHeight);
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

    // zufällig mischen (Swap-Puzzle ist immer lösbar, da du beliebige Paare tauschen kannst)
    Phaser.Utils.Array.Shuffle(this.positions);

    // Tiles anlegen
    this.tiles = [];
    this.positions.forEach((pos, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = offsetX + col * tileSize;
      const y = offsetY + row * tileSize;

      const tile = this.scene.add.image(x, y, pos.key)
        .setInteractive({ useHandCursor: true })
        .setOrigin(0)
        .setScale(scaleX, scaleY);

      // Korrekte Zielposition aus dem Slicenamen lesen
      tile.correctRow = parseInt(pos.key.split("_")[1], 10);
      tile.correctCol = parseInt(pos.key.split("_")[2], 10);
      tile.currIndex = i;

      tile.on("pointerdown", () => this._selectTile(tile));

      if (parentContainer) parentContainer.add(tile);
      this.tiles.push(tile);
    });
  }

  _selectTile(tile) {
    if (!this.selected) {
      this.selected = tile;
      tile.setTint(0xffff00); // markieren
    } else {
      if (this.selected === tile) {
        // erneut auf dasselbe Tile: Auswahl aufheben
        this.selected.clearTint();
        this.selected = null;
        return;
      }

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
    this.tiles = [];
    this.positions = [];
    this.selected = null;
  }
}
