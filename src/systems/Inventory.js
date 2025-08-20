// src/systems/Inventory.js
// (aktuell nutzen wir direkt das HTML-Overlay in MapScene; dieses Modul ist ein Platzhalter
//  falls ihr Inventarspalten, Tooltips etc. kapseln wollt.)
export class Inventory {
  static render(list){
    const inv = document.getElementById("inventory");
    inv.innerHTML = "<strong>Artefakte:</strong> " +
      (list.length ? list.map(a => `<span class="item">${a}</span>`).join("") : "–");
  }
}
