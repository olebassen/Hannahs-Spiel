// src/puzzles/LabyrinthPuzzle.js
export default class LabyrinthPuzzle {
  constructor(scene, config, onSolved) {
    this.scene = scene;
    this.config = config;
    this.onSolved = onSolved;
    this.player = null;
    this.lastValid = null;
    this.trailGraphics = null;

    // 25x25 Beispiel-Labyrinth
    // "wall" = Wand, "floor" = begehbar
    this.mapData = [
      "xxxxxxxxxxxxxxxxxxxxxxxxx",
      "xoxoooooxoooooooxooxoooox",
      "xoxoooxoxoxoxxxxxoxoxoxox",
      "xoxoooxoxoxoxoooooxoxoxox",
      "xoxoooxxxxxxxoxoxoxoooxxx",
      "xoxoxoxoxoxoxoxoxoxoxoxox",
      "xoxoxoxoooooxoxoxoooooxox",
      "xoxoxoooxoxoxoxoxoxoxoxxx",
      "xoxooxxoxoxoooooxoxoxoxox",
      "xoxoxoxoxoxoxoxxxoxoxoxox",
      "xoxoxoxoxoxxxoxoxoxoxoxxx",
      "xoxoxoxoxoxoxoxoxoxoxoxox",
      "xoxoxoxoxoxoooooxxxxxoxox",
      "xoxoxoxoxoxoxoxxxoxoxoxox",
      "xoxoxoxoxoxoxoxoxoxoxoxox",
      "xoxoxoxoxoxxxoxoxoxoxoxox",
      "xoxoxoxoxoxoxoxoxoxoxxxxx",
      "xoxoxoooxoxoxoxoxoxooooox",
      "xoxoxoxoxoxoxoxoxoxoxxxox",
      "xoxoxoxoooooxoxoxoooooxox",
      "xoxoxoxoxoxoxoxoxoxoxoxox",
      "xoooxoooxoooxooooooxooxox",
      "xxxxxxxxxxxxxxxxxxxxxxxxx"
    ].map(row => row.split("").map(c => c === "x" ? "hecke" : "floor"));
  }

  create(container) {
    const tileSize = 32; // kleinere Tiles
    const offsetX = - (this.mapData[0].length * tileSize) / 2;
    const offsetY = - (this.mapData.length * tileSize) / 2;

    // Tiles zeichnen
    this.mapData.forEach((row, y) => {
      row.forEach((cell, x) => {
        const tile = this.scene.add.image(
          offsetX + x * tileSize,
          offsetY + y * tileSize,
          cell
        ).setOrigin(0).setDisplaySize(tileSize, tileSize);
        container.add(tile);
      });
    });

    // Spieler auf (1,1)
    const startX = offsetX + 1.5 * tileSize;
    const startY = offsetY + 1.5 * tileSize;
    this.player = this.scene.add.sprite(startX, startY, "maus").setScale(0.4);
    this.player.setInteractive({ draggable: true });
    this.scene.input.setDraggable(this.player);
    container.add(this.player);

    this.lastValid = { x: startX, y: startY };

    // Ziel rechts unten
    this.goal = this.scene.add.rectangle(
      offsetX + (this.mapData[0].length - 2) * tileSize + tileSize/2,
      offsetY + (this.mapData.length - 2) * tileSize + tileSize/2,
      tileSize, tileSize,
      0x00ff00, 0.3
    );
    container.add(this.goal);

    // Trail (rosa Strich)
    this.trailGraphics = this.scene.add.graphics();
    this.trailGraphics.lineStyle(3, 0xff69b4, 1); // pink
    this.trailGraphics.beginPath();
    this.trailGraphics.moveTo(this.player.x, this.player.y);
    container.add(this.trailGraphics);

    // Drag & Drop
    this.scene.input.on("drag", (pointer, gameObject, dragX, dragY) => {
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
          console.log("[LabyrinthPuzzle] Solved!");
          this.scene.events.emit("puzzleSolved");
          if (this.onSolved) this.onSolved();
        }
      } else {
        this.player.setPosition(this.lastValid.x, this.lastValid.y);
      }
    });
  }

  destroy() {
    this.player.destroy();
    this.goal.destroy();
  }
}
