// src/puzzles/SpiderwebPuzzle.js
export default class SpiderwebPuzzle {
  constructor(scene, config, onSolved) {
    this.scene = scene;
    this.config = Object.assign(
      {
        // --- Random-Generator-Parameter (werden nur genutzt, wenn KEINE nodes/edges übergeben wurden) ---
        cols: 5,            // Spalten (inkl. Startspalte 0 und Zielspalte cols-1)
        rows: 4,            // Knoten je Spalte
        width: 500,         // Gesamtausdehnung X des Netzes
        height: 360,        // Gesamtausdehnung Y
        jitterX: 0.12,      // horizontale Unruhe pro Knoten relativ zum Spaltenabstand
        jitterY: 0.25,      // vertikale Unruhe pro Knoten relativ zum Reihenabstand
        decoyPerBand: 4,    // zusätzliche Kanten zwischen je zwei Nachbarspalten
        webChanceDecoy: 0.35, // Wahrscheinlichkeit, dass eine Decoy-Kante ein Web ist
        ensureWebOnPath: true, // auf dem Lösungsweg mindestens 1 Web, falls maxCuts>0
      },
      config || {}
    );
    this.onSolved = onSolved;

    // Input (statisch) oder später generiert:
    this.nodes = this.config.nodes || null;
    this.edges = this.config.edges || null;

    this.maxCuts = this.config.maxCuts ?? 5;

    this.cuts = 0;
    this.currentNode = "start";

    this.nodeSprites = {};
    this.edgeSprites = {};

    this.playerSprite = null;  // eigener Spieler
    this.counterText = null;   // Anzeige der Schnitte
  }

  preload() { /* keine Assets mehr nötig; nutzt vorhandene Keys: web_start, web_goal, player */ }

  create(container) {
    // Falls keine Nodes/Edges vorgegeben: generieren
    if (!this.nodes || !this.edges) {
      const gen = this._generateWebLayout();
      this.nodes = gen.nodes;
      this.edges = gen.edges;
      // IDs "start" / "goal" sind gesetzt
    }

    // --- Edges (Verbindungen) ---
    this.edges.forEach((e, i) => {
      const from = this.nodes.find(n => n.id === e.from);
      const to = this.nodes.find(n => n.id === e.to);

      const color = (e.type === "web") ? 0xff0000 : 0x00ff00; // Rot = Netz, Grün = frei

      const line = this.scene.add.line(0, 0, from.x, from.y, to.x, to.y, color)
        .setOrigin(0, 0)
        .setLineWidth(3);

      container.add(line);
      this.edgeSprites[i] = { sprite: line, edge: e };
    });

    // --- Nodes (Knotenpunkte) ---
    this.nodes.forEach(n => {
      let key = "web_start";
      if (n.id === "goal") key = "web_goal";

      const node = this.scene.add.image(n.x, n.y, key)
        .setScale(0.1)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this._moveTo(n.id));

      container.add(node);
      this.nodeSprites[n.id] = node;
    });

    // --- Spieler separat erstellen ---
    const startNode = this.nodes.find(n => n.id === "start");
    this.playerSprite = this.scene.add.image(startNode.x, startNode.y, "player2")
      .setScale(1)
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

    // passende Verbindung suchen (undirected)
    const edgeIndex = this.edges.findIndex(e =>
      (e.from === this.currentNode && e.to === nodeId) ||
      (e.to === this.currentNode && e.from === nodeId)
    );
    if (edgeIndex === -1) return;

    const edge = this.edges[edgeIndex];
    const obj = this.edgeSprites[edgeIndex];

    // Schon benutzt? → keine Aktion
    if (edge.used) return;

    // Webkante (rot) → Counter sinkt + Feedback
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

  // -------- RANDOM-WEB-GENERATOR (immer lösbar) --------
  _generateWebLayout() {
    const {
      cols, rows, width, height,
      jitterX, jitterY, decoyPerBand,
      webChanceDecoy, ensureWebOnPath
    } = this.config;

    const left = -width / 2;
    const top  = -height / 2;
    const colDx = width / (cols - 1);
    const rowDy = rows > 1 ? height / (rows - 1) : 0;

    // Knoten erzeugen (Spalten mit jitter)
    const nodesByCol = [];
    for (let c = 0; c < cols; c++) {
      const xBase = left + c * colDx;
      const colNodes = [];
      for (let r = 0; r < rows; r++) {
        const x = xBase + (Math.random() - 0.5) * colDx * jitterX;
        const yBase = top + r * rowDy;
        const y = yBase + (Math.random() - 0.5) * rowDy * jitterY;
        colNodes.push({ id: `c${c}r${r}`, x, y, col: c, row: r });
      }
      nodesByCol.push(colNodes);
    }

    // Start & Goal oben draufsetzen: in linken/rechten Randspalten, zufällige Reihe
    const startRow = Phaser.Math.Between(0, rows - 1);
    const goalRow  = Phaser.Math.Between(0, rows - 1);

    const start = { id: "start", x: nodesByCol[0][startRow].x - colDx, y: nodesByCol[0][startRow].y, col: -1, row: startRow };
    const goal  = { id: "goal",  x: nodesByCol[cols - 1][goalRow].x + colDx, y: nodesByCol[cols - 1][goalRow].y, col: cols, row: goalRow };

    // Lösungspfad entlang der Spalten (inkl. Kanten start->c0, ..., c{n-1}->goal)
    const pathEdges = [];
    let r = startRow;

    // Kante: start -> erste Spalte
    pathEdges.push({ from: "start", to: nodesByCol[0][r].id });

    for (let c = 0; c < cols - 1; c++) {
      const choices = [r];
      if (r > 0) choices.push(r - 1);
      if (r < rows - 1) choices.push(r + 1);
      const rNext = Phaser.Utils.Array.GetRandom(choices);
      pathEdges.push({ from: nodesByCol[c][r].id, to: nodesByCol[c + 1][rNext].id });
      r = rNext;
    }

    // Kante: letzte Spalte -> goal
    pathEdges.push({ from: nodesByCol[cols - 1][r].id, to: "goal" });

    // Web-Verteilung auf dem Lösungsweg (≤ maxCuts)
    const pathEdgeIndices = pathEdges.map((_e, i) => i);
    let webOnPath = 0;
    let maxWebAllowed = Math.min(this.maxCuts, pathEdges.length); // Sicherheitskappe
    if (ensureWebOnPath && this.maxCuts > 0) {
      // Stelle sicher, dass mindestens 1 Web dabei ist
      const pick = Phaser.Utils.Array.GetRandom(pathEdgeIndices);
      pathEdges[pick].type = "web";
      webOnPath = 1;
    }
    // restliche Pfadkanten setzen (web oder free)
    for (let i = 0; i < pathEdges.length; i++) {
      if (pathEdges[i].type) continue; // schon gesetzt
      const makeWeb = webOnPath < maxWebAllowed && Math.random() < 0.4; // 40% Chance
      pathEdges[i].type = makeWeb ? "web" : "free";
      if (makeWeb) webOnPath++;
    }

    // Decoy-Kanten zwischen benachbarten Spalten
    const decoys = [];
    for (let c = 0; c < cols - 1; c++) {
      let added = 0;
      while (added < decoyPerBand) {
        const rf = Phaser.Math.Between(0, rows - 1);
        const rt = Phaser.Math.Between(0, rows - 1);
        const from = nodesByCol[c][rf].id;
        const to   = nodesByCol[c + 1][rt].id;

        // keine Duplikate und nicht exakt die Path-Kante
        const duplicate = pathEdges.some(e => (e.from === from && e.to === to) || (e.from === to && e.to === from)) ||
                          decoys.some(e => (e.from === from && e.to === to) || (e.from === to && e.to === from));
        if (duplicate) continue;

        decoys.push({
          from, to,
          type: Math.random() < webChanceDecoy ? "web" : "free"
        });
        added++;
      }
    }

    // Zusätzlich: ein paar Querverbindungen innerhalb derselben Spalte zur Ablenkung? (NEIN – wir bleiben bei c->c+1, damit Bewegungen „geordnet“ bleiben.)

    // Gesamtknotenliste bauen
    const nodes = [start, ...nodesByCol.flat(), goal];

    // Edgeliste mit used-Flag
    const edges = [...pathEdges, ...decoys].map(e => ({ ...e, used: false }));

    // currentNode auf start setzen
    this.currentNode = "start";

    return { nodes, edges };
  }

  destroy() {
    Object.values(this.nodeSprites).forEach(s => s.destroy());
    Object.values(this.edgeSprites).forEach(o => o.sprite.destroy());
    if (this.playerSprite) this.playerSprite.destroy();
    if (this.counterText) this.counterText.destroy();

    this.nodeSprites = {};
    this.edgeSprites = {};
    this.playerSprite = null;
    this.counterText = null;
  }
}
