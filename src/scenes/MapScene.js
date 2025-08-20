// src/scenes/MapScene.js
import { save } from "../game.js";
import { fitSquareCamera } from "../systems/View.js";
import { DESIGN_SIZE } from "../config.js";

export default class MapScene extends Phaser.Scene {
  constructor(){ super("MapScene"); }

  create(){
    fitSquareCamera(this);
    this.scale.on("resize", () => fitSquareCamera(this));
    this.cameras.main.setBackgroundColor("#000");

    // 1) Hintergrund: gesamte Schule
    const bg = this.add.image(DESIGN_SIZE/2, DESIGN_SIZE/2, "map_school");
    bg.setDisplaySize(DESIGN_SIZE, DESIGN_SIZE);

    // 2) Hotspots definieren
    const spots = [
      { x: 250, y: 480, roomId: "bibliothek", label: "BIBLIOTHEK" },
      { x: 250, y: 690, roomId: "speisesaal", label: "SPEISESAAL" },
      { x: 500, y: 480, roomId: "empfangshalle", label: "EMPFANGSHALLE" },
      { x: 250, y: 280, roomId: "schlafsaal", label: "SCHLAFSAAL" },
      { x: 750, y: 480, roomId: "musikzimmer", label: "MUSIKZIMMER" },
      { x: 500, y: 890, roomId: "geheimgang", label: "GEHEIMGANG" },
      { x: 750, y: 280, roomId: "labor", label: "LABOR" },
      { x: 500, y: 690, roomId: "krypta", label: "KRYPTA" },
      { x: 750, y: 890, roomId: "spinnengewoelbe", label: "SPINNENGEWOELBE" },
      { x: 750, y: 690, roomId: "friedhof", label: "FRIEDHOF" },
      { x: 250, y: 890, roomId: "labyrinthgarten", label: "LABYRINTHGARTEN" },
      { x: 500, y: 150, roomId: "turmzimmer", label: "TURMZIMMER" },
      { x: 500, y: 280, roomId: "aula", label: "AULA" },
      { x: 900, y: 200, roomId: "umkleide", label: "UMKLEIDE" }, // neu
      { x: 100, y: 200, roomId: "reset", label: "NEUANFANG" }     // neu
    ];

    // Fortschritt bestimmen
    const solvedCount = save.getSolvedCount();
    const unlocked = Math.min(
      spots.length,
      (Math.floor(solvedCount / 3) + 1) * 3
    );

    // Marker/Interaktivität – nur freigeschaltete Spots anklickbar
    spots.forEach((s, idx) => {
      // Umkleide & Reset sind Sonderfall: immer unlocked
      const isUnlocked =
        (s.roomId === "umkleide" || s.roomId === "reset")
          ? true
          : (idx < unlocked);
      this._addSpot(s, isUnlocked);
    });

    // Titel
    this._addTitle();

    // =========================
    // Charakter laden
    // =========================

    // höchstes ungelöstes Level finden (Sonderräume ignorieren)
    let nextSpot = null;
    for (let s of spots) {
      if (!save.isSolved(s.roomId) && s.roomId !== "umkleide" && s.roomId !== "reset") {
        nextSpot = s;
        break;
      }
    }

    const charData = save.getCharacter();

    let posX, posY;
    if (nextSpot) {
      // Charakter leicht links neben dem Punkt platzieren
      posX = nextSpot.x - 80;
      posY = nextSpot.y;
    } else {
      // Fallback: Mitte der Map
      posX = 180;
      posY = 200;
    }

    // Container für den Charakter
    this.characterContainer = this.add.container(posX, posY);

    // Reihenfolge einhalten wie in CharacterScene
    if (charData.bottom) this.characterContainer.add(this.add.image(0, -20, charData.bottom).setScale(0.1));
    if (charData.shoes)  this.characterContainer.add(this.add.image(0, 0, charData.shoes).setScale(0.1));
    if (charData.face)   this.characterContainer.add(this.add.image(0, -80, charData.face).setScale(0.1));
    if (charData.top)    this.characterContainer.add(this.add.image(0, -40, charData.top).setScale(0.1));
  }

  _addSpot({ x, y, roomId, label }, unlocked) {
    const solved = save.isSolved(roomId);

    const radius = 18;
    let color, stroke;
    if (!unlocked) {
      color = 0x555555;
      stroke = 0x777777;
    } else {
      // Sonderfarben
      if (roomId === "umkleide") {
        color = 0xff69b4;
        stroke = 0xffffff;
      } else if (roomId === "reset") {
        color = 0xff0000;
        stroke = 0xffffff;
      } else {
        color = solved ? 0x4caf50 : 0x70b7e8;
        stroke = solved ? 0xa5f28b : 0xb6dbff;
      }
    }

    const dot = this.add.circle(x, y, radius, color, unlocked ? 0.9 : 0.5)
      .setStrokeStyle(3, stroke);

    if (unlocked) {
      dot.setInteractive({ useHandCursor: true });
      this.tweens.add({
        targets: dot,
        scale: { from: 0.9, to: 1.08 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut"
      });
    }

    const txt = this.add.text(
      x, y + 28,
      unlocked
        ? (roomId === "umkleide" || roomId === "reset"
          ? label // keine ✓/→ für Sonderpunkte
          : ((solved ? "✓ " : "→ ") + label))
        : "",
      {
        fontFamily: "SpukFont", fontSize: "18px",
        color: unlocked
          ? (roomId === "umkleide"
            ? "#ffd6e8"
            : roomId === "reset"
              ? "#ffaaaa"
              : (solved ? "#9fe870" : "#d9efff"))
          : "#999999"
      }
    ).setOrigin(0.5, 0);

    if (unlocked) {
      const hit = this.add.circle(x, y, radius * 2, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });

      const hoverRing = this.add.circle(x, y, radius + 8, 0xffffff, 0)
        .setStrokeStyle(2, 0xffffff)
        .setAlpha(0);

      const onOver = () => {
        this.tweens.add({ targets: hoverRing, alpha: 1, duration: 160 });
        txt.setStyle({ color: "#ffffff" });
      };
      const onOut = () => {
        this.tweens.add({ targets: hoverRing, alpha: 0, duration: 160 });
        txt.setStyle({
          color: roomId === "umkleide"
            ? "#ffd6e8"
            : roomId === "reset"
              ? "#ffaaaa"
              : (solved ? "#9fe870" : "#d9efff")
        });
      };

      hit.on("pointerover", onOver);
      hit.on("pointerout", onOut);
      dot.on("pointerover", onOver);
      dot.on("pointerout", onOut);

      // Klickverhalten
      const goRoom = () => {
        if (roomId === "umkleide") {
          this.scene.start("CharacterScene");
        } else if (roomId === "reset") {
          if (confirm("Willst du wirklich einen kompletten Neuanfang? Alle Fortschritte und Artefakte gehen verloren!")) {
            save.clearAll();
            this.scene.start("BootScene");
          }
        } else {
          this.scene.start("RoomScene", { roomId });
        }
      };
      dot.on("pointerdown", goRoom);
      hit.on("pointerdown", goRoom);
      txt.setInteractive({ useHandCursor: true }).on("pointerdown", goRoom);
    }
  }

  _addTitle() {
    const title = this.add.text(DESIGN_SIZE/2, 60, "EINE NACHT IM SPUKINTERNAT", {
      fontFamily: "SpukFont",
      fontSize: "32px",
      color: "#fff",
      stroke: "#000",
      strokeThickness: 6,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: "#000",
        blur: 6,
        fill: true
      }
    }).setOrigin(0.5, 0);

    const glow = this.add.text(title.x, title.y, title.text, {
      fontFamily: "SpukFont",
      fontSize: "48px",
      color: "#70b7e8"
    }).setOrigin(0.5, 0).setAlpha(0.15);
    glow.depth = title.depth - 1;
  }
}
