// src/scenes/RoomScene.js
import { save } from "../game.js";
import { fitSquareCamera } from "../systems/View.js";
import { DESIGN_SIZE } from "../config.js";
import SliderPuzzle from "../puzzles/SliderPuzzle.js";
import CodeLockPuzzle from "../puzzles/CodeLockPuzzle.js";
import ShadowPuzzle from "../puzzles/ShadowPuzzle.js";
import HiddenObjectsPuzzle from "../puzzles/HiddenObjectsPuzzle.js";
import SymbolCodePuzzle from "../puzzles/SymbolCodePuzzle.js";
import PathPuzzle from "../puzzles/PathPuzzle.js";
import SwapPuzzle from "../puzzles/SwapPuzzle.js";
import SokobanPuzzle from "../puzzles/SokobanPuzzle.js";
import SpiderwebPuzzle from "../puzzles/SpiderwebPuzzle.js";
import StarMapPuzzle from "../puzzles/StarMapPuzzle.js";
import LabyrinthPuzzle from "../puzzles/LabyrinthPuzzle.js";
import GravePuzzle from "../puzzles/GravePuzzle.js";
import TreePuzzle from "../puzzles/TreePuzzle.js";


export default class RoomScene extends Phaser.Scene {
  constructor(){ super("RoomScene"); }
  init(data){ this.roomId = data.roomId; }

  preload(){
    this.roomKey = `room:${this.roomId}`;
    this.room = this.cache.json.get(this.roomKey);

    // Puzzle-Assets nachladen
    if (this.room.puzzle?.type === "slider") {
      const sp = new SliderPuzzle(this, this.room.puzzle, () => {});
      sp.preload();
    }
    if (this.room.puzzle?.type === "hiddenObjects") {
      const hp = new HiddenObjectsPuzzle(this, this.room.puzzle.config, () => {});
      hp.preload();
    }
    if (this.room.puzzle?.type === "swap") {
      const sp = new SwapPuzzle(this, this.room.puzzle.config, () => {});
      sp.preload();
    }
    if (this.room.puzzle?.type === "sokoban") {
      const sok = new SokobanPuzzle(this, this.room.puzzle, () => {});
      if (sok.preload) sok.preload();
    }
    if (this.room.puzzle?.type === "spiderweb") {
      const web = new SpiderwebPuzzle(this, this.room.puzzle, () => {});
      if (web.preload) web.preload();
    }
    // 👇 NEU für Sternkarte
    if (this.room.puzzle?.type === "starmap") {
      const sm = new StarMapPuzzle(this, this.room.puzzle, () => {});
      if (sm.preload) sm.preload();
    }
        if (this.room.puzzle?.type === "grave") {
      const sm = new GravePuzzle(this, this.room.puzzle, () => {});
      if (sm.preload) sm.preload();
    }

  }

  create(){
    fitSquareCamera(this);
    this.scale.on("resize", () => fitSquareCamera(this));
    this.cameras.main.setBackgroundColor("#0f0f17");
// --- Kreisblende-Effekt ---
const circle = this.add.circle(DESIGN_SIZE/2, DESIGN_SIZE/2, 20, 0x000000)
  .setScale(0)           // startet winzig
  .setAlpha(1);

circle.setBlendMode('ERASE'); // macht "Loch" in schwarzer Fläche

// schwarze Fläche, die den Bildschirm überlagert
const maskLayer = this.add.rectangle(DESIGN_SIZE/2, DESIGN_SIZE/2, DESIGN_SIZE, DESIGN_SIZE, 0x000000)
  .setDepth(9999);

// Maske anwenden (Loch-Effekt)
maskLayer.setMask(new Phaser.Display.Masks.GeometryMask(this, circle));

this.tweens.add({
  targets: circle,
  scale: { from: 25, to: 0 },  // Kreis wächst → "öffnet" den Blick
  duration: 1000,
  ease: 'Cubic.easeOut',
  onComplete: () => {
    maskLayer.destroy(); // Effekt nach Animation entfernen
    circle.destroy();
  }
});

    // --- Hintergrund ---
    const bgKey = this.room.background || "room_bg";
    const bg = this.add.image(DESIGN_SIZE/2, DESIGN_SIZE/2, bgKey);
    bg.setDisplaySize(DESIGN_SIZE, DESIGN_SIZE);

    // --- Puzzle direkt einblenden ---
    this._animatePuzzleIn(this.room.puzzle);
  
    // --- Charakter links unten ---
    const charData = save.getCharacter();
    const posX = 120;                    
    const posY = DESIGN_SIZE - 80;       
    this.characterContainer = this.add.container(posX, posY);

    if (charData.bottom) this.characterContainer.add(this.add.image(-100, 100, charData.bottom).setScale(0.5).setOrigin(0.5,1));
    if (charData.shoes)  this.characterContainer.add(this.add.image(-100, 140, charData.shoes).setScale(0.5).setOrigin(0.5,1));
    if (charData.face)   this.characterContainer.add(this.add.image(-100, -220, charData.face).setScale(0.5).setOrigin(0.5,1));
    if (charData.top)    this.characterContainer.add(this.add.image(-100, -40, charData.top).setScale(0.4).setOrigin(0.5,1));
  }

  _animatePuzzleIn(puzzleCfg){
    if (puzzleCfg.type === "hiddenObjects") {
      this.puzzleContainer = this.add.container(DESIGN_SIZE/2, DESIGN_SIZE/2);
      this.currentPuzzle = new HiddenObjectsPuzzle(
        this,
        puzzleCfg.config,
        () => this._solve(this.room)
      );
      this.currentPuzzle.create(this.puzzleContainer);
      return;
    }

    // Container direkt mittig setzen, ohne Animation
    this.puzzleContainer = this.add.container(DESIGN_SIZE/2, DESIGN_SIZE/2);
    this.puzzleContainer.setScale(1);
    this.puzzleContainer.setAlpha(1);

    switch (puzzleCfg.type) {
      case "slider":
        this.currentPuzzle = new SliderPuzzle(this, puzzleCfg, () => this._solve(this.room));
        this.currentPuzzle.create(this.puzzleContainer);
        break;
      case "code":
        this.currentPuzzle = new CodeLockPuzzle(this, puzzleCfg, () => this._solve(this.room));
        this.currentPuzzle.create(this.puzzleContainer);
        break;
      case "shadow":
        this.currentPuzzle = new ShadowPuzzle(this, puzzleCfg, () => this._solve(this.room));
        this.currentPuzzle.create(this.puzzleContainer);
        break;
      case "symbolCode":
        this.currentPuzzle = new SymbolCodePuzzle(this, puzzleCfg.config, () => this._solve(this.room));
        this.currentPuzzle.create(this.puzzleContainer);
        break;
      case "path":
        this.currentPuzzle = new PathPuzzle(this, puzzleCfg.config, () => this._solve(this.room));
        this.currentPuzzle.create(this.puzzleContainer);
        break;
      case "swap":
        this.currentPuzzle = new SwapPuzzle(this, puzzleCfg.config, () => this._solve(this.room));
        this.currentPuzzle.create(this.puzzleContainer);
        break;
      case "sokoban":
        this.currentPuzzle = new SokobanPuzzle(this, puzzleCfg, () => this._solve(this.room));
        this.currentPuzzle.create(this.puzzleContainer);
        break;
      case "hiddenObjects":
        this.currentPuzzle = new HiddenObjectsPuzzle(this, puzzleCfg, () => this._solve(this.room));
        this.currentPuzzle.create(this.puzzleContainer);
        break;
      case "labyrinth":
        this.currentPuzzle = new LabyrinthPuzzle(this, puzzleCfg, () => this._solve(this.room));
        this.currentPuzzle.create(this.puzzleContainer);
        break;
      case "grave":
        this.currentPuzzle = new GravePuzzle(this, puzzleCfg.config, () => this._solve(this.room));
        this.currentPuzzle.create(this.puzzleContainer);
        break; 
        case "tree":
  this.currentPuzzle = new TreePuzzle(this, puzzleCfg.config, () => this._solve(this.room));
  this.currentPuzzle.create(this.puzzleContainer);
  break;
       
      case "spiderweb":
        this.currentPuzzle = new SpiderwebPuzzle(this, puzzleCfg, () => this._solve(this.room));
        this.currentPuzzle.create(this.puzzleContainer);
        this.events.once("puzzleSolved", () => this._solve(this.room));
        this.events.once("puzzleFailed", () => {
          this.add.text(
            DESIGN_SIZE/2, DESIGN_SIZE/2,
            "Das Netz ist eingestürzt!",
            { fontFamily:"SpukFont", fontSize:"28px", color:"#f00" }
          ).setOrigin(0.5);
          this.time.delayedCall(1500, () => this.scene.start("MapScene"));
        });
        break;
      case "starmap":
        this.currentPuzzle = new StarMapPuzzle(this, puzzleCfg, () => this._solve(this.room));
        this.currentPuzzle.create(this.puzzleContainer);
        break;
      default:
        this.add.text(DESIGN_SIZE/2, DESIGN_SIZE/2, "Puzzle-Platzhalter.", { 
          fontFamily: "SpukFont", 
          fontSize:"32px", 
          color:"#aaa" 
        }).setOrigin(0.5);
        return;
    }
  }

_solve(room){
  save.addSolved(this.roomId);
  if (room.artifact?.id) {
    save.addArtifact(room.artifact.id);
  }

  // Debug: Riesiges weißes Overlay
  const flash = this.add.rectangle(
    DESIGN_SIZE/2, DESIGN_SIZE/2,
    DESIGN_SIZE, DESIGN_SIZE,
    0xffffff, 1   // direkt sichtbar (alpha=1)
  ).setOrigin(0.5);

  this.children.bringToTop(flash);

  // Damit du siehst, ob das Rechteck überhaupt erscheint
  this.time.delayedCall(500, () => {
    flash.setFillStyle(0xff0000, 1); // nach 0.5s knallrot
  });

  // Jetzt Tween drüber
  this.tweens.add({
    targets: flash,
    alpha: { from: 0.7, to: 0 }, // erst sichtbar, dann ausblenden
    duration: 2000,
    ease: "Cubic.easeOut",
    onComplete: () => {
        this.time.delayedCall(0, () => {
          this.currentPuzzle?.destroy();
          this.puzzleContainer?.destroy();
          this.scene.start("SurpriseScene", { roomId: this.roomId });
        });
    }
  });
}





  showHint(text){
    const box = this.add.rectangle(DESIGN_SIZE/2, DESIGN_SIZE-150, 860, 100, 0x000000, 0.8)
      .setStrokeStyle(2, 0x999999);
    const label = this.add.text(80, DESIGN_SIZE-190, "TIPP: " + text, { 
      fontFamily: "SpukFont", 
      fontSize:"24px", 
      color:"#fff", 
      wordWrap:{ width:800 } 
    });
    this.time.delayedCall(3000, () => { box.destroy(); label.destroy(); });
  }
}
