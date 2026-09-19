import type { StyleSpecification, LayerSpecification } from "maplibre-gl";
import type { Theme } from "./themes";

export interface Layers { roads: boolean; water: boolean; parks: boolean; buildings: boolean; }

const w = (a: number, b: number, c: number) =>
  ["interpolate", ["exponential", 1.4], ["zoom"], 6, a, 12, b, 18, c] as never;

export function buildStyle(t: Theme, on: Layers): StyleSpecification {
  const L: LayerSpecification[] = [
    { id: "bg", type: "background", paint: { "background-color": t.bg } },
  ];
  const src = "omt";
  if (on.parks) {
    L.push(
      { id: "landcover", type: "fill", source: src, "source-layer": "landcover", filter: ["in", "class", "grass", "wood", "farmland"], paint: { "fill-color": t.park, "fill-opacity": 0.8 } },
      { id: "park", type: "fill", source: src, "source-layer": "park", paint: { "fill-color": t.park } },
    );
  }
  if (on.water) {
    L.push(
      { id: "water", type: "fill", source: src, "source-layer": "water", paint: { "fill-color": t.water } },
      { id: "waterway", type: "line", source: src, "source-layer": "waterway", paint: { "line-color": t.water, "line-width": w(0.4, 1.2, 4) } },
    );
  }
  if (on.buildings) {
    L.push({ id: "building", type: "fill", source: src, "source-layer": "building", minzoom: 12, paint: { "fill-color": t.building, "fill-opacity": 0.9 } });
  }
  if (on.roads) {
    const road = (id: string, classes: string[], color: string, width: unknown, minzoom = 0): LayerSpecification => ({
      id, type: "line", source: src, "source-layer": "transportation", minzoom,
      filter: ["all", ["in", "class", ...classes], ["!=", "brunnel", "tunnel"]] as never,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": color, "line-width": width as never },
    });
    L.push(
      road("r-minor", ["minor", "service", "track"], t.roadMinor, w(0.1, 0.6, 3), 11),
      road("r-tertiary", ["tertiary"], t.roadMinor, w(0.3, 1, 5), 9),
      road("r-secondary", ["secondary", "primary"], t.roadMajor, w(0.4, 1.4, 7), 7),
      road("r-major", ["motorway", "trunk"], t.roadMajor, w(0.8, 2.2, 10), 4),
      { id: "rail", type: "line", source: src, "source-layer": "transportation", minzoom: 10, filter: ["==", "class", "rail"], paint: { "line-color": t.roadMinor, "line-width": w(0.2, 0.5, 1.5), "line-dasharray": [3, 3] } },
    );
  }
  return {
    version: 8,
    sources: { [src]: { type: "vector", url: "https://tiles.openfreemap.org/planet" } },
    layers: L,
  };
}
