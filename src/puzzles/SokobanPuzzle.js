export default class SokobanPuzzle {
  constructor(scene, cfg, onSolved) {
    this.scene = scene;
    this.cfg = cfg;
    this.onSolved = onSolved;

    this.grid = cfg.grid.map(r => r.split(""));
    this.tileset = cfg.tileset;
    this.tileSize = cfg.tileSize || 32;

    this.offsetX = cfg.offsetX || 0;
    this.offsetY = cfg.offsetY || 0;

    this.player = null;
    this.map = [];
    this.goals = [];
    this.parentContainer = null;
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
          console.log("Player initialisiert bei:", x, y);
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

          console.log("Coffin bei:", x, y);
        } else {
          row.push(null);
        }
      });
      this.map.push(row);
    });

    // Maussteuerung
    this.scene.input.on("pointerdown", (pointer) => {
      let localX = pointer.worldX;
      let localY = pointer.worldY;

      if (this.parentContainer) {
        localX -= this.parentContainer.x;
        localY -= this.parentContainer.y;
      }

      const gx = Math.floor((localX - this.offsetX) / this.tileSize);
      const gy = Math.floor((localY - this.offsetY) / this.tileSize);

      console.log("Mausklick auf Grid:", gx, gy);

      const dx = gx - this.player.x;
      const dy = gy - this.player.y;

      if (Math.abs(dx) + Math.abs(dy) === 1) {
        this.move(dx, dy);
      } else {
        console.log("Klick ignoriert – kein Nachbarfeld");
      }
    });
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
        console.log("Coffin neue Position:", coffin.gridX, coffin.gridY);
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
  for (let goal of this.goals) {
    console.log("Check Goal bei:", goal.x, goal.y);
    const coffin = this.getCoffinAt(goal.x, goal.y);
    if (coffin) {
      console.log("Coffin auf Goal entdeckt → Puzzle gelöst!");
      if (this.onSolved) this.onSolved();
      return;
    }
  }
  console.log("Noch nicht gelöst");
}
destroy() {
  // Input-Handler entfernen
  this.scene.input.off("pointerdown");

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
