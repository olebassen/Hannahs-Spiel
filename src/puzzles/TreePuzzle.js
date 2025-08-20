// src/puzzles/TreePuzzle.js
import { DESIGN_SIZE } from "../config.js";

export default class TreePuzzle {
  constructor(scene, config, onSolved) {
    this.scene = scene;
    this.config = config;
    this.onSolved = onSolved;
  }

  preload() {} // leer – Artefakte sind schon vorgeladen

create(container) {
  this.container = container;

  const startX = DESIGN_SIZE/2 - 120; // rechts
  let y = -DESIGN_SIZE/3;             // oben anfangen

  this.config.artifacts.forEach((id, idx) => {
    const sprite = this.scene.add.image(
      startX, y, id
    )
      .setInteractive({ draggable: true, useHandCursor: true })
      .setScale(0.1); // kleiner, falls nötig

    this.scene.input.setDraggable(sprite);

    // frei verschiebbar, kein Snapping
    sprite.on("drag", (pointer, dragX, dragY) => {
      sprite.x = dragX;
      sprite.y = dragY;
    });

    this.container.add(sprite);

    // nächste Startposition weiter unten
    y += 80;
    if (y > 0) y = -DESIGN_SIZE/3; // neue Spalte anfangen, falls viele Artefakte
  });

  this._showPhotoButton(); // Button direkt anzeigen
}


_showPhotoButton() {
  const btn = this.scene.add.text(400, DESIGN_SIZE/2 - 100, "📸", {
    fontFamily: "SpukFont",
    fontSize: "100px",
    color: "#fff"
  })
    .setOrigin(0.5)
    .setPadding(12)
    .setInteractive({ useHandCursor: true })
    .setDepth(1000); // Button immer ganz oben

  btn.on("pointerdown", () => this._takePhoto());
  this.container.add(btn);
}

  _takePhoto() {
    this.scene.game.renderer.snapshot((image) => {
      // Canvas-Textur anlegen
      const texKey = "baumfoto";
      const canvas = this.scene.textures.createCanvas(texKey, image.width, image.height);
      const ctx = canvas.getContext();

      // Snapshot in Canvas zeichnen
      ctx.drawImage(image, 0, 0);
      canvas.refresh();

      // Foto mit Polaroid-Rahmen anzeigen
      const photo = this.scene.add.image(0, 0, texKey)
        .setScale(0.3)
        .setDepth(999);

      const frame = this.scene.add.rectangle(0, 0, 350, 420, 0xffffff)
        .setDepth(998);

      photo.angle = Phaser.Math.Between(-5, 5);
      frame.angle = photo.angle;

      this.scene.tweens.add({
        targets: [photo, frame],
        y: "+=100",
        duration: 1200,
        ease: "Bounce.Out",
        onComplete: () => {
          this.scene.time.delayedCall(2000, () => this.onSolved());
        }
      });
    });
  }


  destroy() {
    this.container?.destroy(true);
  }
}
