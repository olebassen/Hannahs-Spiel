// src/puzzles/SliderPuzzle.js
import { DESIGN_SIZE } from "../config.js";

export default class SliderPuzzle {
  constructor(scene, cfg, onSolved) {
    const defaults = {
      img: null,
      grid: 3,
      size: DESIGN_SIZE * 0.7,
      x: DESIGN_SIZE / 2,
      y: DESIGN_SIZE / 2
    };

    this.scene = scene;
    this.cfg = Object.assign(defaults, cfg || {});
    this.onSolved = onSolved;

    this.tiles = [];
    this.order = [];
    this.emptyIndex = null;
    this.frame = null;
  }

  preload() {
    const key = this._imgKey();
    if (!this.scene.textures.exists(key)) {
      this.scene.load.image(key, this.cfg.img);
    }
  }

  /**
   * parentContainer (optional): Phaser.GameObjects.Container
   * Wenn übergeben, werden Tiles und Rahmen relativ zu (0,0) gebaut und in den Container gehängt.
   */
  create(parentContainer) {
    const { grid } = this.cfg;
    this._build(parentContainer);

    // Start-Layout (0..n-1), letzte Position = Lücke
    this.order = Array.from({ length: grid * grid }, (_, i) => i);
    this.emptyIndex = grid * grid - 1;

    // Durch valide Züge mischen → garantiert lösbar
    this._scramble(10 + grid * 3);
    this._layout();
  }

  _imgKey() {
    return "slider_" + this.cfg.img;
  }

  _build(parentContainer) {
  const { x, y, size, grid } = this.cfg;
  const key = this._imgKey();
  const tex = this.scene.textures.get(key).getSourceImage();

  const sw = tex.width / grid;
  const sh = tex.height / grid;
  const tileSize = size / grid;

  const cx = parentContainer ? 0 : x;
  const cy = parentContainer ? 0 : y;
  const startX = cx - size / 2;
  const startY = cy - size / 2;

  // --- Hintergrund in Weiß ---
  this.bgRect = this.scene.add
    .rectangle(cx, cy, size, size, 0xffffff, 1);
  if (parentContainer) parentContainer.add(this.bgRect);

  // --- Tiles ---
  this.tiles = [];
  const total = grid * grid;
  let idx = 0;
  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      if (idx === total - 1) break; // letzte = Lücke

      const sliceKey = `${key}_${idx}`;
      if (!this.scene.textures.exists(sliceKey)) {
        const canvasTex = this.scene.textures.createCanvas(sliceKey, sw, sh);
        const ctx = canvasTex.getContext();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tex, gx * sw, gy * sh, sw, sh, 0, 0, sw, sh);
        canvasTex.refresh();
      }

      const px = startX + gx * tileSize + tileSize / 2;
      const py = startY + gy * tileSize + tileSize / 2;

      const tile = this.scene.add.image(px, py, sliceKey).setDisplaySize(tileSize, tileSize);
      tile.goalIndex = idx;
      tile.setInteractive({ useHandCursor: true });
      tile.on("pointerdown", () => this._tryMove(tile));

      if (parentContainer) parentContainer.add(tile);
      this.tiles.push(tile);
      idx++;
    }
  }

  // --- Rahmen oben drauf ---
  this.frame = this.scene.add
    .rectangle(cx, cy, size, size)
    .setStrokeStyle(2, 0x000000);
  if (parentContainer) parentContainer.add(this.frame);
}


  _scramble(moves) {
    const { grid } = this.cfg;
    for (let i = 0; i < moves; i++) {
      const neighbors = this._neighborIndices(this.emptyIndex, grid);
      const choice = Phaser.Utils.Array.GetRandom(neighbors);
      this._swap(choice, this.emptyIndex);
      this.emptyIndex = choice;
    }
  }

  _neighborIndices(idx, grid) {
    const res = [];
    const x = idx % grid;
    const y = Math.floor(idx / grid);
    if (x > 0) res.push(idx - 1);
    if (x < grid - 1) res.push(idx + 1);
    if (y > 0) res.push(idx - grid);
    if (y < grid - 1) res.push(idx + grid);
    return res;
  }

  _tryMove(tile) {
    const tilePos = this.order.indexOf(tile.goalIndex);
    const neighbors = this._neighborIndices(this.emptyIndex, this.cfg.grid);
    if (!neighbors.includes(tilePos)) return;

    this._swap(tilePos, this.emptyIndex);
    this.emptyIndex = tilePos;
    this._layout();
    this._checkSolved();
  }

  _swap(i, j) {
    const tmp = this.order[i];
    this.order[i] = this.order[j];
    this.order[j] = tmp;
  }

  _layout() {
    const { x, y, size, grid } = this.cfg;
    const tileSize = size / grid;

    // Wenn im Container → Layout um (0,0), sonst um (x,y)
    const cx = this.frame?.parentContainer ? 0 : x;
    const cy = this.frame?.parentContainer ? 0 : y;
    const startX = cx - size / 2;
    const startY = cy - size / 2;

    this.tiles.forEach((tile) => {
      const place = this.order.indexOf(tile.goalIndex);
      const gx = place % grid;
      const gy = Math.floor(place / grid);
      const px = startX + gx * tileSize + tileSize / 2;
      const py = startY + gy * tileSize + tileSize / 2;
      tile.setPosition(px, py);
    });
  }

  _checkSolved() {
    for (let i = 0; i < this.order.length - 1; i++) {
      if (this.order[i] !== i) return;
    }
    this.onSolved && this.onSolved();
  }

  destroy() {
    this.tiles.forEach((t) => t.destroy());
    this.frame?.destroy();
  }
}
