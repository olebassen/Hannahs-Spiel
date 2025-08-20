// src/scenes/BootScene.js
import { save } from "../game.js";
import { fitSquareCamera } from "../systems/View.js";

export default class BootScene extends Phaser.Scene {
  constructor() { super("BootScene"); }

  preload() {

     this.titleText = this.add.text(
            this.scale.width / 2,   // x Position: Bildschirmmitte
            this.scale.height / 2,  // y Position: Bildschirmmitte
            'EINE NACHT IM SPUKINTERNAT',      // Text
            {
                fontFamily: 'SpukFont',
                fontSize: '48px',
                color: '#ffffff'
            }
        );
        this.titleText.setOrigin(0.5); // Text zentrieren

    // Avatar Basis
    this.load.image("base", "assets/images/avatar/base.png");

    // Avatar Gesichter
    for (let i = 1; i <= 10; i++) {
      this.load.image(`face${i}`, `assets/images/avatar/face${i}.png`);
    }

    // Avatar Tops
    for (let i = 1; i <= 4; i++) {
      this.load.image(`top${i}`, `assets/images/avatar/top${i}.png`);
    }

    // Avatar Bottoms
    for (let i = 1; i <= 3; i++) {
      this.load.image(`bottom${i}`, `assets/images/avatar/bottom${i}.png`);
    }

    // Avatar Schuhe
    for (let i = 1; i <= 6; i++) {
      this.load.image(`shoes${i}`, `assets/images/avatar/shoes${i}.png`);
    }

    this.load.image("umkleide", "assets/images/rooms/umkleide.png");
    this.load.image("map_school", "assets/images/rooms/schule.png");

    this.load.image("fledermaus", "assets/images/surprise/fledermaus.png");
    this.load.json("room:bibliothek", "data/rooms/bibliothek.json");
    this.load.image("bg:bibliothek", "assets/images/rooms/bibliothek.png");
    this.load.image("art:schwarze_feder", "assets/images/artifacts/schwarze_feder.png");

    this.load.image("huhn", "assets/images/surprise/huhn.png");
    this.load.json("room:speisesaal", "data/rooms/speisesaal.json");
    this.load.image("bg:speisesaal", "assets/images/rooms/speisesaal.png");
    this.load.image("art:verfluchter_loeffel", "assets/images/artifacts/verfluchter_loeffel.png");

    this.load.json("room:empfangshalle", "data/rooms/empfangshalle.json");
    this.load.image("empfangshalle", "assets/images/rooms/empfangshalle.png");
    this.load.image("rabesilhouette", "assets/images/puzzles/rabesilhouette.png");
    this.load.image("kerzen", "assets/images/puzzles/kerzen.png");
    this.load.image("empfangshalle_surprise", "assets/images/surprise/ruestung.png");
    this.load.image("art:silberschluessel", "assets/images/artifacts/silberschluessel.png");

    this.load.image("bg:schlafsaal", "assets/images/rooms/schlafsaal.png");
    this.load.image("key1", "assets/images/puzzles/key1.png");
    this.load.image("key2", "assets/images/puzzles/key2.png");
    this.load.image("key3", "assets/images/puzzles/key3.png");
    this.load.image("schlafsaal_surprise", "assets/images/surprise/schlafsaal_surprise.png");
    this.load.image("art:altes_tagebuch", "assets/images/artifacts/altes_tagebuch.png");
    this.load.json("room:schlafsaal", "data/rooms/schlafsaal.json");

    // --- Raum 6: Geheimgang ---
    this.load.json("room:geheimgang", "data/rooms/geheimgang.json");
    this.load.image("geheimgang", "assets/images/rooms/geheimgang.png");
    this.load.image("rune1", "assets/images/puzzles/rune1.png");
    this.load.image("rune2", "assets/images/puzzles/rune2.png");
    this.load.image("rune3", "assets/images/puzzles/rune3.png");
    this.load.image("rune4", "assets/images/puzzles/rune4.png");
    this.load.image("geist", "assets/images/surprise/geist.png");
    this.load.image("art:verblasstes_gemaelde", "assets/images/artifacts/verblasstes_gemaelde.png");

    // --- Raum 5: Musikzimmer ---
    this.load.json("room:musikzimmer", "data/rooms/musikzimmer.json");
    this.load.image("bg:musikzimmer", "assets/images/rooms/musikzimmer.png");
    this.load.image("musikzimmer_surprise", "assets/images/surprise/musikzimmer.png");
    this.load.image("art:zersprungene_geige", "assets/images/artifacts/zersprungene_geige.png");

    // --- Raum 7: Labor ---
    this.load.json("room:labor", "data/rooms/labor.json");
    this.load.image("bg:labor", "assets/images/rooms/labor.png");
    this.load.image("reagenz", "assets/images/puzzles/reagenz.png");
    this.load.image("labor_surprise", "assets/images/surprise/skelett.png");
    this.load.image("art:leuchtende_phiole", "assets/images/artifacts/leuchtende_phiole.png");

    // --- Raum 8: Krypta ---
    this.load.json("room:krypta", "data/rooms/krypta.json");
    this.load.image("bg:krypta", "assets/images/rooms/krypta.png");

    // Sokoban-Puzzle Tiles
    this.load.image("wall", "assets/images/puzzles/wall.png");
    this.load.image("floor", "assets/images/puzzles/floor.png");
    this.load.image("goal", "assets/images/puzzles/goal.png");
    this.load.image("coffin", "assets/images/puzzles/coffin.png");
    this.load.image("player", "assets/images/puzzles/player.png");

    this.load.image("puppe_kichert", "assets/images/surprise/puppe.png");
    this.load.image("art:geborstener_ring", "assets/images/artifacts/geborstener_ring.png");

    // --- Raum 9: Spinnengewölbe ---
    this.load.json("room:spinnengewoelbe", "data/rooms/spinnengewoelbe.json");
    this.load.image("bg:spinnengewoelbe", "assets/images/rooms/spinnengewoelbe.png");

    this.load.image("web_start", "assets/images/puzzles/web_start.png");
    this.load.image("web_goal", "assets/images/puzzles/web_goal.png");
    this.load.image("spinne_party", "assets/images/surprise/spinne_party.png");
    this.load.image("art:kristallene_spinne", "assets/images/artifacts/kristallene_spinne.png");
        this.load.image("player2", "assets/images/puzzles/player2.png");

// Raum 10
   for (let i = 1; i <= 16; i++) {
      this.load.image(`grab${i}`, `assets/images/puzzles/grab (${i}).png`);
   }
       this.load.json("room:friedhof", "data/rooms/friedhof.json");
    this.load.image("bg:friedhof", "assets/images/rooms/friedhof.png");
    this.load.image("lachendes_skelett", "assets/images/surprise/lachendes_skelett.png");
    this.load.image("art:grabrose", "assets/images/artifacts/grabrose.png");
        this.load.image("totenschaedel_silhouette", "assets/images/puzzles/totenschaedel_silhouette.png");

// --- Raum 11: Labyrinthgarten ---
this.load.json("room:labyrinthgarten", "data/rooms/labyrinthgarten.json");
this.load.image("bg:labyrinthgarten", "assets/images/rooms/labyrinthgarten.png");

// Puzzle
this.load.image("labyrinth", "assets/images/puzzles/labyrinth.png");
this.load.image("maus", "assets/images/puzzles/maus.png");
this.load.image("lab_start", "assets/images/puzzles/lab_start.png");
this.load.image("lab_goal", "assets/images/puzzles/lab_goal.png");
this.load.image("hecke", "assets/images/puzzles/hecke.png");

// Überraschung
this.load.image("vogelscheuche", "assets/images/surprise/vogelscheuche.png");

// Artefakt
this.load.image("art:verknotetes_seil", "assets/images/artifacts/verknotetes_seil.png");


    // --- Raum 12: Turmzimmer (Sternkarten-Puzzle) ---
    this.load.json("room:turmzimmer", "data/rooms/turmzimmer.json");
    this.load.image("bg:turmzimmer", "assets/images/rooms/turmzimmer.png");
    this.load.image("art:zerbrochene_sternkarte", "assets/images/artifacts/zerbrochene_sternkarte.png");
    this.load.image("fernrohr_monster", "assets/images/surprise/fernrohr_monster.png");

    // --- alle 25 Sternkarten-Teile ---
    for (let i = 1; i <= 25; i++) {
      this.load.image(`sternkarte${i}`, `assets/images/puzzles/sternkarte (${i}).png`);
            this.load.image(`ufos${i}`, `assets/images/puzzles/ufos (${i}).png`);
                  this.load.image(`alien${i}`, `assets/images/puzzles/alien (${i}).png`);
}
    //Raum 13
    this.load.json("room:aula", "data/rooms/aula.json");
    this.load.image("bg:aula", "assets/images/rooms/aula.png");
    this.load.image("abschluss", "assets/images/surprise/feiernde_kinder.png");
    this.load.image("stern", "assets/images/artifacts/stern.png");
    
    
  }

  create() {
    fitSquareCamera(this);
    this.scale.on("resize", () => fitSquareCamera(this));

    const s = save.getSettings();
    this.sound.mute = !!s.mute;

    this.scene.start("MapScene");
  }
}
