// src/systems/View.js
import { DESIGN_SIZE } from "../config.js";

console.log("View.js geladen", { DESIGN_SIZE });

export function fitSquareCamera(scene) {
  const cam = scene.cameras?.main;
  if (!cam) {
    console.warn("[fitSquareCamera] Keine Kamera gefunden in Scene:", scene.scene.key);
    return;
  }

  const w = scene.scale.gameSize.width;
  const h = scene.scale.gameSize.height;
  const size = Math.min(w, h);             // kleinste Kante bestimmt Zoom
  const zoom = size / DESIGN_SIZE;

  cam.setZoom(zoom);
  cam.centerOn(DESIGN_SIZE / 2, DESIGN_SIZE / 2);

  console.log(`[fitSquareCamera] zoom=${zoom.toFixed(2)} w=${w} h=${h}`);
}
