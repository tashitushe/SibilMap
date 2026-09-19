import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { buildStyle } from "./mapStyle";
import { ALL_SIZES, FONTS, SIZES, THEMES, WALLPAPERS } from "./themes";
import { formatCoords, searchPlaces, type Place } from "./geocode";
import { W, drawDecor, exportPoster, fontOf, isWallpaper, mapRect, posterHeight, themeOf, type PosterConfig, type View } from "./poster";

const RES = [
  { id: "std", name: "Standard · 2000 px", w: 2000 },
  { id: "hi", name: "High · 3000 px", w: 3000 },
  { id: "ultra", name: "Ultra · 4500 px", w: 4500 },
];

export default function App() {
  const [cfg, setCfg] = useState<PosterConfig>({
    city: "Lisbon", country: "Portugal", tagline: "Where the river meets the sea",
    coords: formatCoords(38.7223, -9.1393),
    themeId: "paper", fontId: "cormorant", sizeId: "18x24", landscape: false, border: "thin", caption: false, showText: true,
    layers: { roads: true, water: true, parks: true, buildings: true },
  });
  const [resId, setResId] = useState("hi");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [zoom, setZoom] = useState(12);
  const [fontTick, setFontTick] = useState(0);

  const set = <K extends keyof PosterConfig>(k: K, v: PosterConfig[K]) => setCfg((c) => ({ ...c, [k]: v }));

  const size = ALL_SIZES.find((s) => s.id === cfg.sizeId)!;
  const wall = isWallpaper(size);
  const H = posterHeight(size, cfg.landscape);
  const rect = mapRect(H, size, cfg.showText);
  const theme = themeOf(cfg.themeId);

  const stageRef = useRef<HTMLDivElement>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [fit, setFit] = useState(0.5);

  // Fit the fixed-size poster into the stage.
  useEffect(() => {
    const el = stageRef.current!;
    const ro = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      setFit(Math.min((width - 48) / W, (height - 48) / H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [H]);

  // Create the map once.
  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapEl.current!,
      style: buildStyle(theme, cfg.layers),
      center: [-9.1393, 38.7223],
      zoom: 12,
      attributionControl: false,
      fadeDuration: 0,
    });
    map.on("zoom", () => setZoom(+map.getZoom().toFixed(2)));
    map.on("moveend", () => {
      const c = map.getCenter();
      set("coords", formatCoords(c.lat, c.lng));
    });
    mapRef.current = map;
    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mapRef.current?.setStyle(buildStyle(theme, cfg.layers));
  }, [cfg.themeId, cfg.layers]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Wait a frame so the container has its new size before MapLibre measures it.
    const id = requestAnimationFrame(() => mapRef.current?.resize());
    return () => cancelAnimationFrame(id);
  }, [H, wall, cfg.showText]);

  // Load fonts, then redraw overlay.
  useEffect(() => {
    const f = fontOf(cfg.fontId);
    Promise.all([
      document.fonts.load(`${f.weight} 40px "${f.family}"`),
      document.fonts.load(`500 20px "DM Sans"`),
    ]).then(() => setFontTick((n) => n + 1));
  }, [cfg.fontId]);

  useEffect(() => {
    const c = overlay.current!;
    const dpr = 2;
    c.width = W * dpr;
    c.height = H * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    drawDecor(ctx, cfg, size, H);
  }, [cfg, size, H, fontTick]);

  // Debounced search.
  useEffect(() => {
    if (query.trim().length < 3) { setResults([]); return; }
    const ac = new AbortController();
    const t = setTimeout(() => {
      searchPlaces(query, ac.signal).then(setResults).catch(() => {});
    }, 450);
    return () => { clearTimeout(t); ac.abort(); };
  }, [query]);

  const pick = (p: Place) => {
    setResults([]);
    setQuery("");
    setCfg((c) => ({ ...c, city: p.city, country: p.country, coords: formatCoords(p.lat, p.lon) }));
    mapRef.current?.jumpTo({ center: [p.lon, p.lat], zoom: 12 });
  };

  const download = async () => {
    const map = mapRef.current!;
    const c = map.getCenter();
    const view: View = { center: [c.lng, c.lat], zoom: map.getZoom() };
    const res = RES.find((r) => r.id === resId)!;
    setBusy(true);
    setMsg("Rendering poster…");
    try {
      const blob = await exportPoster(cfg, size, view, res.w);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `sibimap-${cfg.city.toLowerCase().replace(/\s+/g, "-") || "poster"}-${size.id}.png`;
      a.click();
      setMsg("Saved ✓");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(false);
    }
  };

  const chips = useMemo(
    () => THEMES.map((t) => (
      <button key={t.id} className={"theme" + (t.id === cfg.themeId ? " on" : "")} onClick={() => set("themeId", t.id)} title={t.name}>
        <span style={{ background: t.bg }}><i style={{ background: t.water }} /><i style={{ background: t.roadMajor }} /><i style={{ background: t.park }} /></span>
        {t.name}
      </button>
    )),
    [cfg.themeId],
  );

  return (
    <div className="app">
      <aside className="panel">
        <h1>SibiMap<small>map poster studio</small></h1>

        <label>Find a place
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a city, region or landmark…" />
        </label>
        {results.length > 0 && (
          <ul className="results">
            {results.map((p, i) => <li key={i} onClick={() => pick(p)}>{p.label}</li>)}
          </ul>
        )}

        <div className="row">
          <label>City<input value={cfg.city} onChange={(e) => set("city", e.target.value)} /></label>
          <label>Country<input value={cfg.country} onChange={(e) => set("country", e.target.value)} /></label>
        </div>
        <label>Tagline<input value={cfg.tagline} onChange={(e) => set("tagline", e.target.value)} /></label>
        <label>Coordinates<input value={cfg.coords} onChange={(e) => set("coords", e.target.value)} /></label>

        <label>Zoom · {zoom.toFixed(1)}
          <input type="range" min={2} max={17} step={0.1} value={zoom} onChange={(e) => mapRef.current?.setZoom(+e.target.value)} />
        </label>

        <h2>Theme</h2>
        <div className="themes">{chips}</div>

        <h2>Layers</h2>
        <div className="checks">
          {(Object.keys(cfg.layers) as (keyof PosterConfig["layers"])[]).map((k) => (
            <label key={k} className="check">
              <input type="checkbox" checked={cfg.layers[k]} onChange={(e) => set("layers", { ...cfg.layers, [k]: e.target.checked })} />
              {k}
            </label>
          ))}
        </div>

        <h2>Typography & frame</h2>
        <div className="row">
          <label>Font
            <select value={cfg.fontId} onChange={(e) => set("fontId", e.target.value)}>
              {FONTS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </label>
          <label>Border
            <select value={cfg.border} onChange={(e) => set("border", e.target.value as PosterConfig["border"])}>
              <option value="none">None</option><option value="thin">Thin</option><option value="thick">Thick</option>
            </select>
          </label>
        </div>

        <h2>Size</h2>
        <label>Format
          <select value={cfg.sizeId} onChange={(e) => set("sizeId", e.target.value)}>
            <optgroup label="Print poster">
              {SIZES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </optgroup>
            <optgroup label="Wallpaper · phone & tablet">
              {WALLPAPERS.filter((s) => s.h > s.w).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </optgroup>
            <optgroup label="Wallpaper · desktop">
              {WALLPAPERS.filter((s) => s.h <= s.w).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </optgroup>
          </select>
        </label>
        {wall ? (
          <>
            <label className="check">
              <input type="checkbox" checked={cfg.caption} onChange={(e) => set("caption", e.target.checked)} />
              Show city caption
            </label>
            <p className="msg">Exports at exactly {size.px![0]}×{size.px![1]} px, full-bleed.</p>
          </>
        ) : (
          <>
            <label className="check">
              <input type="checkbox" checked={cfg.showText} onChange={(e) => set("showText", e.target.checked)} />
              Show text under the map
            </label>
            <label>Orientation
              <select value={cfg.landscape ? "l" : "p"} onChange={(e) => set("landscape", e.target.value === "l")}>
                <option value="p">Portrait</option><option value="l">Landscape</option>
              </select>
            </label>
            <label>Export resolution
              <select value={resId} onChange={(e) => setResId(e.target.value)}>
                {RES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
          </>
        )}

        <button className="primary" disabled={busy} onClick={download}>{busy ? "Working…" : wall ? "Download wallpaper" : "Download PNG"}</button>
        <p className="msg">{msg}</p>
        <p className="credit">Map data © OpenStreetMap contributors · tiles by OpenFreeMap · search by Nominatim</p>
        <p className="dev">Developed by <a href="https://farnoud.net" target="_blank" rel="noopener noreferrer">Farnoud Najari</a></p>
      </aside>

      <main className="stage" ref={stageRef}>
        <div className="poster-wrap" style={{ width: W * fit, height: H * fit }}>
          <div className="poster" style={{ width: W, height: H, background: theme.bg, transform: `scale(${fit})` }}>
            <div ref={mapEl} className="map" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }} />
            <canvas ref={overlay} className="overlay" style={{ width: W, height: H }} />
          </div>
        </div>
        <p className="hint">Drag to pan · scroll to zoom — what you see is what you export</p>
      </main>
    </div>
  );
}
