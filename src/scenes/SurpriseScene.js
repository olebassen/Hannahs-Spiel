// src/scenes/SurpriseScene.js
import { fitSquareCamera } from "../systems/View.js";
import { DESIGN_SIZE } from "../config.js";

export default class SurpriseScene extends Phaser.Scene {
  constructor(){ super("SurpriseScene"); }
  init(data){ this.roomId = data.roomId; }

  create(){
    fitSquareCamera(this);
    this.scale.on("resize", () => fitSquareCamera(this));

    const room = this.cache.json.get(`room:${this.roomId}`);
    const text = room?.surprise?.text || "Etwas Seltsames passiert...";
    const bgKey = room?.surprise?.background || "lachendes_skelett"; 
    const artId = room?.artifact?.id;
    const artKey = artId ? `art:${artId}` : null;
    this.artText = room?.artifact?.text || "";

    // Hintergrund
    this.add.image(DESIGN_SIZE/2, DESIGN_SIZE/2, bgKey)
      .setDisplaySize(DESIGN_SIZE, DESIGN_SIZE)
      .setDepth(0);

    // Surprise-Text
    this.msg = this.add.text(
      DESIGN_SIZE/2, DESIGN_SIZE * 0.85,
      text,
      {
        fontFamily: "SpukFont",
        fontSize: "24px",
        color: "#fff",
        wordWrap: { width: DESIGN_SIZE * 0.8 },
        align: "center"
      }
    ).setOrigin(0.5).setDepth(1).setAlpha(0);

    this.tweens.add({ targets: this.msg, alpha: 1, duration: 400 });

    // Klick 1: Surprise-Text ausblenden, Artefakt zeigen
    this.input.once("pointerdown", () => {
      this.tweens.add({
        targets: this.msg,
        alpha: 0,
        duration: 250,
        onComplete: () => {
          this.msg.destroy();
          if (!artKey || !this.textures.exists(artKey)) {
            this._finish();
          } else {
            this._showArtifact(artKey);
          }
        }
      });
    });
  }

  _showArtifact(artKey){
    const maxW = DESIGN_SIZE;
    const maxH = DESIGN_SIZE;

    const src = this.textures.get(artKey).getSourceImage();
    const scale = Math.min(maxW / src.width, maxH / src.height, 1);

    // Artefakt-Bild
    const artImage = this.add.image(DESIGN_SIZE/2, DESIGN_SIZE/2, artKey)
      .setScale(scale)
      .setDepth(1)
      .setAlpha(0);

    this.tweens.add({ targets: artImage, alpha: 1, duration: 600 });

    // Artefakt-Text
    if (this.artText) {
      const artMsg = this.add.text(
        DESIGN_SIZE/2, DESIGN_SIZE * 0.85,
        this.artText,
        {
          fontFamily: "SpukFont",
          fontSize: "22px",
          color: "#fff",
          wordWrap: { width: DESIGN_SIZE * 0.9 },
          align: "center"
        }
      ).setOrigin(0.5, 1).setDepth(2).setAlpha(0);

      this.tweens.add({ targets: artMsg, alpha: 1, duration: 600 });
    }

    // Klick 2: zurück zur Map
    this.input.once("pointerdown", () => this._finish());
  }

  _finish(){
    this.scene.start("MapScene");
  }
}
