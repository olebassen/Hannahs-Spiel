// src/puzzles/TreePuzzle.js
import { DESIGN_SIZE } from "../config.js";

export default class TreePuzzle {
  constructor(scene, config, onSolved) {
    this.scene = scene;
    this.config = Object.assign(
      {
        artifacts: [],
        starKey: "stern",   // ← nutzt das in BootScene vorab geladene Asset
        starScale: 0.22
      },
      config || {}
    );
    this.onSolved = onSolved;

    this.container = null;
    this._clickedIds = new Set();
    this._starShown = false;
  }

  preload() { /* nichts zu tun; 'stern' kommt aus der BootScene */ }

  create(container) {
    this.container = container;

    const startX = DESIGN_SIZE / 2 - 120;
    let y = -DESIGN_SIZE / 3;

    this.config.artifacts.forEach((id) => {
      const sprite = this.scene.add.image(startX, y, id)
        .setInteractive({ draggable: true, useHandCursor: true })
        .setScale(0.1);

      this.scene.input.setDraggable(sprite);

      sprite.on("drag", (_p, dx, dy) => { sprite.x = dx; sprite.y = dy; });
      sprite.on("pointerdown", () => { this._clickedIds.add(id); this._checkAllClicked(); });

      this.container.add(sprite);

      y += 80;
      if (y > 0) y = -DESIGN_SIZE / 3;
    });

    this._showPhotoButton();
  }

  _showPhotoButton() {
    const btn = this.scene.add.text(400, DESIGN_SIZE / 2 - 100, "📸", {
      fontFamily: "SpukFont", fontSize: "100px", color: "#fff"
    })
      .setOrigin(0.5)
      .setPadding(12)
      .setInteractive({ useHandCursor: true })
      .setDepth(1000);

    btn.on("pointerdown", () => this._takePhoto());
    this.container.add(btn);
  }

  _checkAllClicked() {
    if (this._starShown) return;
    const total = this.config.artifacts.length;
    if (total > 0 && this._clickedIds.size >= total) this._showGoldenStar();
  }

_showGoldenStar() {
  this._starShown = true;

  if (!this.scene.textures.exists(this.config.starKey)) {
    console.warn(`[TreePuzzle] Stern-Textur "${this.config.starKey}" nicht vorhanden.`);
    return;
  }

  const scale = Number(this.config.starScale) || 0.22;

  const star = this.scene.add.image(300, DESIGN_SIZE / 2 - 100, this.config.starKey)
    .setScale(scale)
    .setDepth(1000)
    .setAlpha(0)
    .setInteractive({ draggable: true, useHandCursor: true }); // ← draggable!

  this.scene.input.setDraggable(star);

  // Drag-Handling
  star.on("dragstart", () => this.children?.bringToTop?.(star));
  star.on("drag", (_p, dx, dy) => { star.x = dx; star.y = dy; });
  star.on("dragend", () => { /* optional: snap oder Effekte */ });

  this.container.add(star);

  // Pop-in + dezentes Wackeln
  star.setScale(scale * 0.5);
  this.scene.tweens.add({
    targets: star,
    alpha: { from: 0, to: 1 },
    scale: { from: scale * 0.5, to: scale },
    duration: 350,
    ease: "Back.out"
  });
  this.scene.tweens.add({
    targets: star,
    angle: { from: -5, to: 5 },
    yoyo: true,
    repeat: -1,
    duration: 1200,
    ease: "Sine.easeInOut"
  });
}


  _takePhoto() {
    this.scene.game.renderer.snapshot((image) => {
      const texKey = "baumfoto";
      const canvas = this.scene.textures.createCanvas(texKey, image.width, image.height);
      const ctx = canvas.getContext();
      ctx.drawImage(image, 100, 0);
      canvas.refresh();

      const photo = this.scene.add.image(0, 0, texKey).setScale(0.3).setDepth(999);
      const frame = this.scene.add.rectangle(0, 0, 200, 200, 0xffffff).setDepth(998);

      photo.angle = Phaser.Math.Between(-5, 5);
      frame.angle = photo.angle;

      this.scene.tweens.add({
        targets: [photo, frame],
        y: "+=200",
        duration: 1200,
        ease: "Bounce.Out",
        onComplete: () => this.scene.time.delayedCall(2000, () => this.onSolved && this.onSolved())
      });
    });
  }

  destroy() {
    this.container?.destroy(true);
    this._clickedIds.clear?.();
  }
}
