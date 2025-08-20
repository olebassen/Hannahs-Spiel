// src/scenes/CharacterScene.js
import { save } from "../game.js";
import { DESIGN_SIZE } from "../config.js";
import { fitSquareCamera } from "../systems/View.js";

export default class CharacterScene extends Phaser.Scene {
  constructor() { 
    super("CharacterScene"); 
  }

  preload() {
    // --- Basis ---
    this.load.image("base", "assets/images/avatar/base.png");

    // --- Gesichter (1–10) ---
    for (let i = 1; i <= 10; i++) {
      this.load.image(`face${i}`, `assets/images/avatar/face${i}.png`);
    }

    // --- Oberteile (1–3) ---
    for (let i = 1; i <= 4; i++) {
      this.load.image(`top${i}`, `assets/images/avatar/top${i}.png`);
    }

    // --- Unterteile (1–2) ---
    for (let i = 1; i <= 3; i++) {
      this.load.image(`bottom${i}`, `assets/images/avatar/bottom${i}.png`);
    }

    // --- Schuhe (1–6) ---
    for (let i = 1; i <= 6; i++) {
      this.load.image(`shoes${i}`, `assets/images/avatar/shoes${i}.png`);
    }
  }

  create() {
    fitSquareCamera(this);
    this.scale.on("resize", () => fitSquareCamera(this));
    this.cameras.main.setBackgroundColor("#222");
  this.add.image(DESIGN_SIZE/2, DESIGN_SIZE/2, "umkleide")
    .setDisplaySize(DESIGN_SIZE, DESIGN_SIZE)
    .setDepth(-1);
    const centerX = DESIGN_SIZE / 2;
    const centerY = DESIGN_SIZE / 2;

    // Container für Avatar
    this.avatarContainer = this.add.container(centerX, centerY);

    // Einheitlicher Scale für alle Teile
    const avatarScale = 0.5;

    // Schichten in richtiger Reihenfolge
this.layers = {
  bottom: this.add.image(0, 400, "bottom1").setScale(0.5),
  shoes: this.add.image(0, 440, "shoes1").setScale(0.5),
  face: this.add.image(0, 80, "face1").setScale(0.5),  
  top: this.add.image(0, 260, "top1").setScale(0.4),

};

    // Alle Layer ins Container packen
    Object.values(this.layers).forEach(img => {
      img.setOrigin(0.5, 1);
      this.avatarContainer.add(img);
    });

    // --- UI ---
    this.add.text(centerX, 80, "CHARAKTER ERSTELLEN", {
      fontFamily: "SpukFont", fontSize: "42px", color: "#fff"
    }).setOrigin(0.5);

this._addChooser("Gesicht", ["face1","face2","face3","face4","face5","face6","face7","face8","face9","face10"], "face", 200);
this._addChooser("Oberteil", ["top1","top2","top3","top4"], "top", 250);
this._addChooser("Unterteil", ["bottom1","bottom2","bottom3"], "bottom", 300);
this._addChooser("Schuhe", ["shoes1","shoes2","shoes3","shoes4","shoes5","shoes6"], "shoes", 350);


    // Fertig-Button
    const btn = this.add.text(1200, 920, "FERTIG", {
      fontFamily:"SpukFont", fontSize:"32px", color:"#fff", backgroundColor:"#000"
    }).setOrigin(0.5).setInteractive({useHandCursor:true});

    btn.on("pointerdown", () => {
      // Auswahl speichern
      Object.entries(this.layers).forEach(([part,img]) => {
        save.setCharacter(part, img.texture.key);
      });
      this.scene.start("MapScene");
    });
  }

  /**
   * Fügt eine Auswahlreihe hinzu, die direkt kleine Thumbnails der Assets anzeigt.
   */
  _addChooser(label, options, part, y) {
    const x = 150;

    this.add.text(x, y, label+":", { 
      fontFamily:"SpukFont", fontSize:"22px", color:"#fff" 
    }).setOrigin(0,0.5);

const THUMB_HEIGHT = 60; // Einheitliche Höhe für alle Thumbnails

options.forEach((key, idx) => {
  const texture = this.textures.get(key).getSourceImage();
  const scale = THUMB_HEIGHT / texture.height;

  const thumb = this.add.image(x + 200 + idx * 80, y, key)
    .setScale(scale)
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

  thumb.on("pointerdown", () => {
    this.layers[part].setTexture(key);
  });
});

  }
}
