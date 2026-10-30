// @ts-check
import { t } from "./i18n.js";

/**
 * MapRoom handles the SVG world map.
 * Ponytail: Simplified coordinate system and state.
 */
export class MapRoom {
  constructor(container, store) {
    this.container = container;
    this.store = store;
    this.zoom = 1;
    this.offset = { x: 0, y: 0 };
    this.isPanning = false;
    this.lastMouse = { x: 0, y: 0 };

    this.init();
  }

  init() {
    this.render();
    this.setupEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="s-map-wrapper">
        <div class="s-map-controls">
          <button type="button" data-action="zoom-in">+</button>
          <button type="button" data-action="zoom-out">−</button>
          <button type="button" data-action="zoom-reset">Reset</button>
        </div>
        <svg class="s-map-svg" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
          <g class="s-map-viewport">
            <g class="s-map-territories"></g>
            <g class="s-map-units"></g>
            <g class="s-map-overlays"></g>
          </g>
        </svg>
      </div>
    `;
    this.svg = this.container.querySelector(".s-map-svg");
    this.viewport = this.container.querySelector(".s-map-viewport");
    this.territoryLayer = this.container.querySelector(".s-map-territories");
    this.unitLayer = this.container.querySelector(".s-map-units");
    
    this.loadTerritories();
    this.updateTransform();
  }

  loadTerritories() {
    // Ponytail: Mock data. Load from boundaries.json in real impl.
    const mockTerritories = [
      { id: "nat1", owner: "UK", path: "M 100,100 L 200,100 L 200,200 L 100,200 Z" },
      { id: "nat2", owner: "GER", path: "M 210,100 L 300,100 L 300,200 L 210,200 Z" },
      { id: "nat3", owner: "USA", path: "M 50,300 L 150,300 L 150,400 L 50,400 Z" },
    ];

    this.territoryLayer.innerHTML = mockTerritories
      .map(t => `<path d="${t.path}" class="t-territory" data-owner="${t.owner}" data-id="${t.id}" />`)
      .join("");
  }

  updateTransform() {
    this.viewport.setAttribute("transform", `translate(${this.offset.x},${this.offset.y}) scale(${this.zoom})`);
  }

  setupEvents() {
    this.container.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoom = Math.max(0.5, Math.min(this.zoom * delta, 5));
      this.updateTransform();
    }, { passive: false });

    this.container.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        this.isPanning = true;
        this.lastMouse = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.isPanning) return;
      this.offset.x += e.clientX - this.lastMouse.x;
      this.offset.y += e.clientY - this.lastMouse.y;
      this.lastMouse = { x: e.clientX, y: e.clientY };
      this.updateTransform();
    });

    window.addEventListener("mouseup", () => {
      this.isPanning = false;
    });

    this.container.addEventListener("click", (e) => {
      const action = e.target.dataset.action;
      if (action === "zoom-in") { this.zoom = Math.min(this.zoom * 1.2, 5); this.updateTransform(); }
      if (action === "zoom-out") { this.zoom = Math.max(this.zoom * 0.8, 0.5); this.updateTransform(); }
      if (action === "zoom-reset") { this.zoom = 1; this.offset = { x: 0, y: 0 }; this.updateTransform(); }
    });
  }
}

export function mapView(store, L) {
  return `<section class="s-map-room" id="map-room-mount"><p>${L("tab.map")} loading...</p></section>`;
}
