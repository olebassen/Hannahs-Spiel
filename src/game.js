import BootScene from "./scenes/BootScene.js";
import MapScene from "./scenes/MapScene.js";
import RoomScene from "./scenes/RoomScene.js";
import SurpriseScene from "./scenes/SurpriseScene.js";
import CharacterScene from "./scenes/CharacterScene.js";
import { Save } from "./systems/Save.js";


const config = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#000000", // Schwarz, füllt den Rest
  scene: [BootScene, MapScene, RoomScene, SurpriseScene, CharacterScene],
  scale: {
    mode: Phaser.Scale.RESIZE,             // passt sich an Fenster an
    autoCenter: Phaser.Scale.CENTER_BOTH   // immer mittig
  },
  render: { pixelArt: false, antialias: true, roundPixels: false }
};

export const GAME = new Phaser.Game(config);
export const save = new Save();

// Simple Settings-Handling (Mute, Motion, Textgröße)
const muteEl = document.getElementById("mute");
const reduceEl = document.getElementById("reduceMotion");
const scaleEl = document.getElementById("textScale");
const panel = document.getElementById("settings");
const closeBtn = document.getElementById("closeSettings");

function applySettings() {
  document.documentElement.style.setProperty("--ui-scale", scaleEl.value);
  const s = save.getSettings();
  s.mute = muteEl.checked;
  s.reduceMotion = reduceEl.checked;
  s.textScale = parseFloat(scaleEl.value);
  save.setSettings(s);
}

[muteEl, reduceEl, scaleEl].forEach(el =>
  el.addEventListener("change", applySettings)
);
closeBtn.addEventListener("click", () => (panel.hidden = true));

// Global: Öffnen der Settings z.B. mit Taste „S“
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "s") panel.hidden = !panel.hidden;
});
