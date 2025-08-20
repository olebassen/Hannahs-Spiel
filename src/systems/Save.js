// src/systems/Save.js
export class Save {
  constructor(key = "spukinternat_v1") {
    this.key = key;
    this._load();
  }

  _default() {
    return {
      settings: { mute: false, reduceMotion: false, textScale: 1 },
      solved: [],      // array von roomIds
      artifacts: [],   // array von artifactIds
      character: { top:null, bottom:null, shoes:null, hair:null, face:null }
    };
  }

  _load() {
    try {
      const raw = localStorage.getItem(this.key);
      this.data = raw ? JSON.parse(raw) : this._default();
      // falls altes Save ohne "character":
      if (this.data.character === undefined) {
        this.data.character = null;
      }
    } catch (e) {
      console.warn("Save load failed, using defaults", e);
      this.data = this._default();
    }
  }

  _save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.data));
    } catch (e) {
      console.warn("Save write failed", e);
    }
  }

  // --- Settings ---
  getSettings() {
    return { ...this.data.settings };
  }
  setSettings(patch) {
    this.data.settings = { ...this.data.settings, ...patch };
    this._save();
  }

  // --- Progress / solved rooms ---
  getSolved() {
    return Array.isArray(this.data.solved) ? [...this.data.solved] : [];
  }
  getSolvedCount() {
    return this.getSolved().length;
  }
  isSolved(roomId) {
    return this.data.solved.includes(roomId);
  }
  addSolved(roomId) {
    if (!this.data.solved.includes(roomId)) {
      this.data.solved.push(roomId);
      this._save();
    }
  }

  // --- Artifacts ---
  getArtifacts() {
    return Array.isArray(this.data.artifacts) ? [...this.data.artifacts] : [];
  }
  hasArtifact(id) {
    return this.data.artifacts.includes(id);
  }
  addArtifact(id) {
    if (!this.data.artifacts.includes(id)) {
      this.data.artifacts.push(id);
      this._save();
    }
  }

  // --- Character ---
  getCharacter() {
    const defaults = {
      bottom: "bottom1",
      shoes: "shoes1",
      top: "top1",
      face: "face1"
    };

    const char = this.data.character || {};
    const result = {};

    for (const [part, def] of Object.entries(defaults)) {
      result[part] = char[part] || def;
    }

    return result;
  }

  setCharacter(part, key) {
    if (!this.data.character) this.data.character = {};
    this.data.character[part] = key;
    this._save();
  }

  // --- Utilities ---
  resetProgress() {
    this.data.solved = [];
    this.data.artifacts = [];
    this._save();
  }
  clearAll() {
    this.data = this._default();
    this._save();
  }
}
