// src/puzzles/LabyrinthPuzzle.js
export default class LabyrinthPuzzle {
  constructor(scene, config, onSolved) {
    this.scene = scene;
    this.config = Object.assign(
      {
        cols: 25,      // muss ungerade sein
        rows: 23,      // muss ungerade sein
        tileSize: 32,
        seed: null,    // optional: fester Seed für reproduzierbare Labyrinthe
        floorKey: "floor",
        wallKey: "hecke",
        playerKey: "maus",
        trailColor: 0xff69b4,
      },
      config || {}
    );
    this.onSolved = onSolved;

    this.player = null;
    this.lastValid = null;
    this.trailGraphics = null;
    this.goal = null;

    // RNG ggf. seeden
    if (this.config.seed != null && this.scene && this.scene.sys && this.scene.sys.game) {
      // Phaser global RND seeden (beeinflusst nur unsere Nutzung)
      try { Phaser.Math.RND.seed = [this.config.seed]; } catch (e) { /* ignore */ }
    }

    // Maze erzeugen (mapData: "floor"/"hecke"; start/goal: {x,y} Zellkoordinaten)
    const { grid, start, goal } = this._generateMaze(
      this.config.cols | 0,
      this.config.rows | 0,
      this.config
    );
    this.mapData = grid;
    this.startCell = start;
    this.goalCell = goal;

    // interne Helfer fürs Offsets
    this._dragHandler = null;
  }

  create(container) {
    const { tileSize, floorKey, wallKey, playerKey, trailColor } = this.config;

    const cols = this.mapData[0].length;
    const rows = this.mapData.length;
    const offsetX = - (cols * tileSize) / 2;
    const offsetY = - (rows * tileSize) / 2;

    // Tiles zeichnen
    this.mapData.forEach((row, y) => {
      row.forEach((cell, x) => {
        const key = cell === "floor" ? floorKey : wallKey;
        const tile = this.scene.add.image(
          offsetX + x * tileSize,
          offsetY + y * tileSize,
          key
        ).setOrigin(0).setDisplaySize(tileSize, tileSize);
        container.add(tile);
      });
    });

    // Ziel markieren (rechteckig, halbtransparent)
    const goalX = offsetX + (this.goalCell.x + 0.5) * tileSize;
    const goalY = offsetY + (this.goalCell.y + 0.5) * tileSize;
    this.goal = this.scene.add.rectangle(
      goalX, goalY, tileSize, tileSize, 0x00ff00, 0.3
    );
    container.add(this.goal);

    // Spieler setzen
    const startX = offsetX + (this.startCell.x + 0.5) * tileSize;
    const startY = offsetY + (this.startCell.y + 0.5) * tileSize;
    this.player = this.scene.add.sprite(startX, startY, playerKey).setScale(0.4);
    this.player.setInteractive({ draggable: true });
    this.scene.input.setDraggable(this.player);
    container.add(this.player);

    this.lastValid = { x: startX, y: startY };

    // Trail
    this.trailGraphics = this.scene.add.graphics();
    this.trailGraphics.lineStyle(3, trailColor, 1);
    this.trailGraphics.beginPath();
    this.trailGraphics.moveTo(this.player.x, this.player.y);
    container.add(this.trailGraphics);

    // Drag & Drop (merken, um später sauber zu entfernen)
    this._dragHandler = (pointer, gameObject, dragX, dragY) => {
      if (gameObject !== this.player) return;

      const tileX = Math.floor((dragX - offsetX) / tileSize);
      const tileY = Math.floor((dragY - offsetY) / tileSize);

      const row = this.mapData[tileY];
      const cell = row ? row[tileX] : "wall";

      if (cell === "floor") {
        this.player.setPosition(dragX, dragY);
        this.lastValid = { x: dragX, y: dragY };

        // Trail-Linie weiterzeichnen
        this.trailGraphics.lineTo(dragX, dragY);
        this.trailGraphics.strokePath();

        // Ziel erreicht?
        if (Phaser.Geom.Intersects.RectangleToRectangle(
          this.player.getBounds(),
          this.goal.getBounds()
        )) {
          this.scene.events.emit("puzzleSolved");
          if (this.onSolved) this.onSolved();
        }
      } else {
        this.player.setPosition(this.lastValid.x, this.lastValid.y);
      }
    };
    this.scene.input.on("drag", this._dragHandler);
  }

  destroy() {
    if (this._dragHandler) {
      this.scene.input.off("drag", this._dragHandler);
      this._dragHandler = null;
    }
    this.player?.destroy();
    this.goal?.destroy();
    this.trailGraphics?.destroy();
  }

  // ===== Maze-Generator (Randomized DFS) =====
  _generateMaze(cols, rows) {
    // Sicherstellen: ungerade Maße >= 5
    cols = Math.max(5, cols | 0);
    rows = Math.max(5, rows | 0);
    if (cols % 2 === 0) cols += 1;
    if (rows % 2 === 0) rows += 1;

    // Start: alles Wand
    const W = "hecke";
    const F = "floor";
    const grid = Array.from({ length: rows }, () => Array(cols).fill(W));

    // Hilfsfunktionen
    const inBounds = (x, y) => x > 0 && x < cols - 1 && y > 0 && y < rows - 1;
    const neighbors2 = (x, y) => [
      { x: x + 0, y: y - 2, wx: x,     wy: y - 1 }, // oben
      { x: x + 2, y: y + 0, wx: x + 1, wy: y     }, // rechts
      { x: x + 0, y: y + 2, wx: x,     wy: y + 1 }, // unten
      { x: x - 2, y: y + 0, wx: x - 1, wy: y     }, // links
    ];

    // Startzelle zufällig (ungerade Koordinaten)
    const randOdd = max => {
      const r = Phaser.Math.Between(1, max - 2);
      return r % 2 === 1 ? r : r + 1; // auf ungerade schieben
    };
    const sx = randOdd(cols);
    const sy = randOdd(rows);

    // DFS-Stack
    grid[sy][sx] = F;
    const stack = [{ x: sx, y: sy }];

    while (stack.length) {
      const current = stack[stack.length - 1];
      // Nachbarn im 2er Raster, zufällig gemischt
      const nbs = neighbors2(current.x, current.y).sort(() => Math.random() - 0.5);

      // unbesuchte Nachbarn finden
      const next = nbs.find(n => inBounds(n.x, n.y) && grid[n.y][n.x] === W);

      if (next) {
        // Wand zwischen den Zellen entfernen
        grid[next.wy][next.wx] = F;
        grid[next.y][next.x] = F;
        stack.push({ x: next.x, y: next.y });
      } else {
        stack.pop();
      }
    }

    // Rand-Boden­zellen sammeln
    const edgeFloors = [];
    for (let x = 1; x < cols - 1; x++) {
      if (grid[1][x] === F) edgeFloors.push({ x, y: 0 + 1 });                 // oben (innenkante)
      if (grid[rows - 2][x] === F) edgeFloors.push({ x, y: rows - 2 });       // unten (innenkante)
    }
    for (let y = 1; y < rows - 1; y++) {
      if (grid[y][1] === F) edgeFloors.push({ x: 1, y });                     // links
      if (grid[y][cols - 2] === F) edgeFloors.push({ x: cols - 2, y });       // rechts
    }

    // Fallback, falls keine Randöffnungen (sehr selten): nimm (1,1) & (cols-2, rows-2)
    if (edgeFloors.length < 2) {
      edgeFloors.push({ x: 1, y: 1 }, { x: cols - 2, y: rows - 2 });
    }

    // Zufälliger Start am Rand
    const startIdx = Phaser.Math.Between(0, edgeFloors.length - 1);
    const start = edgeFloors[startIdx];

    // Farthest Randpunkt via BFS-Distanz bestimmen
    const dist = this._bfsDistances(grid, start);
    let goal = start;
    let bestD = -1;
    for (const cell of edgeFloors) {
      const d = dist[cell.y][cell.x];
      if (d > bestD) {
        bestD = d;
        goal = cell;
      }
    }

    // Sicherheit: Start/Goal als Floor (sollten es bereits sein)
    grid[start.y][start.x] = F;
    grid[goal.y][goal.x] = F;

    return { grid, start, goal };
  }

  _bfsDistances(grid, src) {
    const rows = grid.length;
    const cols = grid[0].length;
    const F = "floor";
    const INF = -1;
    const dist = Array.from({ length: rows }, () => Array(cols).fill(INF));
    const q = [];
    dist[src.y][src.x] = 0;
    q.push(src);
    const deltas = [
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
      { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
    ];
    while (q.length) {
      const { x, y } = q.shift();
      for (const { dx, dy } of deltas) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows &&
            grid[ny][nx] === F && dist[ny][nx] === INF) {
          dist[ny][nx] = dist[y][x] + 1;
          q.push({ x: nx, y: ny });
        }
      }
    }
    return dist;
  }
}
