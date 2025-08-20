// src/puzzles/SpiderwebPuzzle.js
export default class SpiderwebPuzzle {
  constructor(scene, config, onSolved) {
    this.scene = scene;
    this.config = config;
    this.onSolved = onSolved;

    this.nodes = config.nodes;
    this.edges = config.edges;
    this.maxCuts = config.maxCuts || 5;

    this.cuts = 0;
    this.currentNode = "start";

    this.nodeSprites = {};
    this.edgeSprites = {};

    this.playerSprite = null;  // eigener Spieler
    this.counterText = null;   // Anzeige der Schnitte
  }

  create(container) {
    // --- Edges (Verbindungen) ---
    this.edges.forEach((e, i) => {
      const from = this.nodes.find(n => n.id === e.from);
      const to = this.nodes.find(n => n.id === e.to);

      let color = (e.type === "web") ? 0xff0000 : 0x00ff00; // Rot = Netz, Grün = frei

      const line = this.scene.add.line(0, 0, from.x, from.y, to.x, to.y, color)
        .setOrigin(0, 0)
        .setLineWidth(3);

      container.add(line);
      this.edgeSprites[i] = { sprite: line, edge: e };
    });

    // --- Nodes (Knotenpunkte) ---
    this.nodes.forEach(n => {
      let key;
      if (n.id === "goal") key = "web_goal"; // Ziel
      else key = "web_start";                // Standard-Knoten

      const node = this.scene.add.image(n.x, n.y, key)
        .setScale(0.1)
        .setInteractive()
        .on("pointerdown", () => this._moveTo(n.id));

      container.add(node);
      this.nodeSprites[n.id] = node;
    });

    // --- Spieler separat erstellen ---
    const startNode = this.nodes.find(n => n.id === "start");
    this.playerSprite = this.scene.add.image(startNode.x, startNode.y, "player")
      .setScale(0.12)
      .setDepth(2);
    container.add(this.playerSprite);

    // --- Counter-Text für Schnitte ---
    this.counterText = this.scene.add.text(
      20, 20,
      `NETZE UEBRIG: ${this.maxCuts - this.cuts}/${this.maxCuts}`,
      {
        fontFamily: "SpukFont",
        fontSize: "24px",
        color: "#ffffff"
      }
    ).setScrollFactor(0);
  }

  _moveTo(nodeId) {
    if (this.currentNode === nodeId) return;

    // passende Verbindung suchen
    const edgeIndex = this.edges.findIndex(e =>
      (e.from === this.currentNode && e.to === nodeId) ||
      (e.to === this.currentNode && e.from === nodeId)
    );
    if (edgeIndex === -1) return;

    const edge = this.edges[edgeIndex];
    const obj = this.edgeSprites[edgeIndex];

    // Schon benutzt? → keine Aktion
    if (edge.used) return;

    // Webkante (rot) → Counter sinkt + Aufblitzen
    if (edge.type === "web") {
      this.cuts++;
      if (this.cuts > this.maxCuts) {
        this.scene.events.emit("puzzleFailed");
        return;
      }
      this.scene.events.emit("cutUsed", this.cuts, this.maxCuts);

      // Blinken: rot -> weiß -> grau
      this.scene.tweens.add({
        targets: obj.sprite,
        alpha: 0.2,
        yoyo: true,
        repeat: 1,
        duration: 100,
        onComplete: () => {
          if (obj.sprite.setStrokeStyle) {
            obj.sprite.setStrokeStyle(3, 0x888888);
          }
        }
      });
    } else {
      // freie Kante (grün) → nur grau färben, kein Counter
      if (obj.sprite.setStrokeStyle) {
        obj.sprite.setStrokeStyle(3, 0x888888);
      }
    }

    // Kante als benutzt markieren
    edge.used = true;

    // Bewegung: Spieler animieren
    this.currentNode = nodeId;
    const target = this.nodes.find(n => n.id === nodeId);
    this.scene.tweens.add({
      targets: this.playerSprite,
      x: target.x,
      y: target.y,
      duration: 400,
      ease: "Sine.easeInOut"
    });

    // Counter updaten
    if (this.counterText) {
      this.counterText.setText(
        `NETZE UEBRIG: ${this.maxCuts - this.cuts}/${this.maxCuts}`
      );
    }

    // Ziel erreicht?
    if (nodeId === "goal") {
      this.scene.events.emit("puzzleSolved");
      if (this.onSolved) this.onSolved();
    }
  }

  destroy() {
    Object.values(this.nodeSprites).forEach(s => s.destroy());
    Object.values(this.edgeSprites).forEach(o => o.sprite.destroy());
    if (this.playerSprite) this.playerSprite.destroy();
    if (this.counterText) this.counterText.destroy();
  }
}
