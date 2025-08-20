export default class SokobanPuzzle {
  constructor(scene, cfg, onSolved) {
    this.scene = scene;
    this.cfg = Object.assign(
      {
        randomize: true,  // NEU: bei Start transformieren
        levels: null      // NEU: optional Array aus Grids (jeweils Array<string>)
      },
      cfg || {}
    );
    this.onSolved = onSolved;

    // --- NEU: Level wählen & zufällig transformieren ---
    const baseGrid = this._pickBaseGrid(this.cfg);
    const finalGrid = this.cfg.randomize ? this._applyRandomSymmetry(baseGrid) : baseGrid;

    this.grid = finalGrid.map(r => r.split(""));

    this.tileset = this.cfg.tileset;
    this.tileSize = this.cfg.tileSize || 32;

    this.offsetX = this.cfg.offsetX || 0;
    this.offsetY = this.cfg.offsetY || 0;

    this.player = null;
    this.map = [];
    this.goals = [];
    this.parentContainer = null;

    // Für sauberes Off() beim destroy
    this._pointerHandler = null;
  }

  // --------- Randomisierungshilfen ---------

  _pickBaseGrid(cfg) {
    if (cfg.levels && Array.isArray(cfg.levels) && cfg.levels.length > 0) {
      // levels: Array<Array<string>>
      const idx = Phaser.Math.Between(0, cfg.levels.length - 1);
      return cfg.levels[idx].slice(); // Kopie
    }
    // fallback: einzelnes grid
    return (cfg.grid || []).slice();
  }

  _applyRandomSymmetry(gridStrRows) {
    // D8-Symmetrien: 4 Rotationen x (optional) Spiegelung
    const ops = [
      "I", "R90", "R180", "R270",
      "FH", "FV", "FD", "FAD" // horizontal, vertikal, Diagonale, Anti-Diagonale
    ];
    const op = ops[Phaser.Math.Between(0, ops.length - 1)];

    // in 2D-Char-Array wandeln
    const A = gridStrRows.map(r => r.split(""));
    const h = A.length;
    const w = A[0]?.length || 0;

    const B = [];
    const put = (x, y, ch) => { if (!B[y]) B[y] = []; B[y][x] = ch; };

    // Koordinatenabbildungen
    const mapCoord = {
      I:   (x, y) => [x, y],
      R90:(x, y) => [h - 1 - y, x],
      R180:(x, y) => [w - 1 - x, h - 1 - y],
      R270:(x, y) => [y, w - 1 - x],
      FH: (x, y) => [w - 1 - x, y],            // horizontal spiegeln
      FV: (x, y) => [x, h - 1 - y],            // vertikal spiegeln
      FD: (x, y) => [y, x],                    // Hauptdiagonale
      FAD:(x, y) => [w - 1 - y, h - 1 - x],    // Gegendiagonale
    }[op];

    // neue Größe ermitteln (bei R90/R270 und Diagonalen vertauscht)
    const newW = (op === "R90" || op === "R270" || op === "FD" || op === "FAD") ? h : w;
    const newH = (op === "R90" || op === "R270" || op === "FD" || op === "FAD") ? w : h;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const [nx, ny] = mapCoord(x, y);
        put(nx, ny, A[y][x]);
      }
    }

    // zurück in Array<string>
    return Array.from({ length: newH }, (_, y) => (B[y] || []).map(ch => ch || " ").join(""));
  }

  create(parentContainer) {
    this.parentContainer = parentContainer || this.scene.add.container(0, 0);

    // Ebenen-Container
    this.tileLayer = this.scene.add.container(0, 0);
    this.coffinLayer = this.scene.add.container(0, 0);
    this.playerLayer = this.scene.add.container(0, 0);

    this.parentContainer.add([this.tileLayer, this.coffinLayer, this.playerLayer]);

    this.grid.forEach((rowArr, y) => {
      const row = [];
      rowArr.forEach((ch, x) => {
        let spriteKey = this.tileset[" "];

        if (ch === "#") spriteKey = this.tileset["#"];
        if (ch === ".") {
          spriteKey = this.tileset["."];
          this.goals.push({ x, y });
        }

        // Boden/Wand/Goal → immer ins tileLayer
        const tile = this.scene.add.image(
          this.offsetX + x * this.tileSize,
          this.offsetY + y * this.tileSize,
          spriteKey
        ).setOrigin(0).setDisplaySize(this.tileSize, this.tileSize);
        this.tileLayer.add(tile);

        if (ch === "@") {
          this.player = {
            x,
            y,
            sprite: this.scene.add.image(
              this.offsetX + x * this.tileSize,
              this.offsetY + y * this.tileSize,
              this.tileset["@"]
            ).setOrigin(0).setDisplaySize(this.tileSize, this.tileSize)
          };
          this.playerLayer.add(this.player.sprite);
          this.grid[y][x] = " "; // Player ist kein Tile
        }

        if (ch === "$") {
          const coffin = this.scene.add.image(
            this.offsetX + x * this.tileSize,
            this.offsetY + y * this.tileSize,
            this.tileset["$"]
          ).setOrigin(0).setDisplaySize(this.tileSize, this.tileSize);

          coffin.isCoffin = true;
          coffin.gridX = x;
          coffin.gridY = y;

          this.coffinLayer.add(coffin);
          row.push(coffin);
        } else {
          row.push(null);
        }
      });
      this.map.push(row);
    });

    // Maussteuerung
    this._pointerHandler = (pointer) => {
      let localX = pointer.worldX;
      let localY = pointer.worldY;

      if (this.parentContainer) {
        localX -= this.parentContainer.x;
        localY -= this.parentContainer.y;
      }

      const gx = Math.floor((localX - this.offsetX) / this.tileSize);
      const gy = Math.floor((localY - this.offsetY) / this.tileSize);

      const dx = gx - this.player.x;
      const dy = gy - this.player.y;

      if (Math.abs(dx) + Math.abs(dy) === 1) {
        this.move(dx, dy);
      }
    };

    this.scene.input.on("pointerdown", this._pointerHandler);
  }

  move(dx, dy) {
    const nx = this.player.x + dx;
    const ny = this.player.y + dy;

    if (this.grid[ny][nx] === "#") return;

    let coffin = this.getCoffinAt(nx, ny);
    if (coffin) {
      const nnx = nx + dx;
      const nny = ny + dy;

      if (this.grid[nny][nnx] === "#" || this.getCoffinAt(nnx, nny)) return;

      this.map[coffin.gridY][coffin.gridX] = null;
      coffin.gridX = nnx;
      coffin.gridY = nny;
      coffin.x = this.offsetX + nnx * this.tileSize;
      coffin.y = this.offsetY + nny * this.tileSize;
      this.map[nny][nnx] = coffin;
    }

    this.player.x = nx;
    this.player.y = ny;
    this.player.sprite.x = this.offsetX + nx * this.tileSize;
    this.player.sprite.y = this.offsetY + ny * this.tileSize;

    this.checkSolved();
  }

  getCoffinAt(x, y) {
    return this.map[y] ? this.map[y][x] : null;
  }

  checkSolved() {
    // Dein bisheriges Kriterium: Sobald EIN Ziel belegt ist → gelöst.
    // Wenn du "alle Ziele belegen" willst, ersetze die Logik unten durch den Kommentarblock.
    for (let goal of this.goals) {
      const coffin = this.getCoffinAt(goal.x, goal.y);
      if (coffin) {
        if (this.onSolved) this.onSolved();
        return;
      }
    }

    /* Alternative: ALLE Ziele müssen belegt sein
    const allCovered = this.goals.every(g => this.getCoffinAt(g.x, g.y));
    if (allCovered && this.onSolved) this.onSolved();
    */
  }

  destroy() {
    // Input-Handler entfernen
    if (this._pointerHandler) {
      this.scene.input.off("pointerdown", this._pointerHandler);
      this._pointerHandler = null;
    }

    // Alles zerstören
    if (this.tileLayer) this.tileLayer.destroy(true);
    if (this.coffinLayer) this.coffinLayer.destroy(true);
    if (this.playerLayer) this.playerLayer.destroy(true);
    if (this.parentContainer) this.parentContainer.destroy(true);

    this.map = [];
    this.goals = [];
    this.player = null;
  }
}
