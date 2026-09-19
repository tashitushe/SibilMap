export interface Theme {
  id: string;
  name: string;
  bg: string;
  land: string;
  water: string;
  park: string;
  building: string;
  roadMajor: string;
  roadMinor: string;
  text: string;
}

export const THEMES: Theme[] = [
  { id: "paper", name: "Paper", bg: "#f6f1e7", land: "#f6f1e7", water: "#b9cfd6", park: "#dde5cf", building: "#e6dcc8", roadMajor: "#2b2b2b", roadMinor: "#7b7468", text: "#1f1f1f" },
  { id: "midnight", name: "Midnight", bg: "#0d1321", land: "#0d1321", water: "#16233d", park: "#12203a", building: "#182338", roadMajor: "#f2c14e", roadMinor: "#5c6b8a", text: "#f4efe1" },
  { id: "blueprint", name: "Blueprint", bg: "#123a6b", land: "#123a6b", water: "#0c2a50", park: "#164579", building: "#1a4d87", roadMajor: "#ffffff", roadMinor: "#9cc3ee", text: "#ffffff" },
  { id: "noir", name: "Noir", bg: "#111111", land: "#111111", water: "#000000", park: "#1a1a1a", building: "#1e1e1e", roadMajor: "#f5f5f5", roadMinor: "#6a6a6a", text: "#f5f5f5" },
  { id: "sage", name: "Sage", bg: "#eef1e6", land: "#eef1e6", water: "#a9c7c1", park: "#c8d8b4", building: "#dfe3d0", roadMajor: "#3c5a44", roadMinor: "#8fa58f", text: "#2c4433" },
  { id: "sunset", name: "Sunset", bg: "#fbe9d8", land: "#fbe9d8", water: "#f2a487", park: "#f5cfa9", building: "#f0d2b8", roadMajor: "#7a2e3a", roadMinor: "#c98a7a", text: "#5a1f2b" },
  { id: "ocean", name: "Ocean", bg: "#e8f3f5", land: "#e8f3f5", water: "#4a9bb5", park: "#cfe6df", building: "#d5e6ea", roadMajor: "#0b3c52", roadMinor: "#7fa9b6", text: "#0b3c52" },
  { id: "terracotta", name: "Terracotta", bg: "#f3e3d3", land: "#f3e3d3", water: "#c9b29b", park: "#e2cdb0", building: "#e8d0b9", roadMajor: "#a4472a", roadMinor: "#c9977c", text: "#6b2a17" },
  { id: "mono", name: "Mono", bg: "#ffffff", land: "#ffffff", water: "#dcdcdc", park: "#f0f0f0", building: "#ececec", roadMajor: "#000000", roadMinor: "#999999", text: "#000000" },
  { id: "neon", name: "Neon", bg: "#0a0014", land: "#0a0014", water: "#1a0033", park: "#12001f", building: "#1b0a2e", roadMajor: "#ff2bd6", roadMinor: "#2bd9ff", text: "#ffffff" },
];

export interface FontChoice { id: string; name: string; family: string; weight: string; }

export const FONTS: FontChoice[] = [
  { id: "cormorant", name: "Cormorant", family: "Cormorant Garamond", weight: "700" },
  { id: "playfair", name: "Playfair", family: "Playfair Display", weight: "700" },
  { id: "dmsans", name: "DM Sans", family: "DM Sans", weight: "700" },
  { id: "bebas", name: "Bebas", family: "Bebas Neue", weight: "400" },
  { id: "mono", name: "Space Mono", family: "Space Mono", weight: "700" },
];

export interface PaperSize {
  id: string; name: string; w: number; h: number;
  /** Wallpaper presets have an exact pixel size and a full-bleed map. */
  px?: [number, number];
}

export const SIZES: PaperSize[] = [
  { id: "a4", name: "A4", w: 210, h: 297 },
  { id: "a3", name: "A3", w: 297, h: 420 },
  { id: "12x16", name: '12×16"', w: 12, h: 16 },
  { id: "18x24", name: '18×24"', w: 18, h: 24 },
  { id: "24x36", name: '24×36"', w: 24, h: 36 },
  { id: "square", name: "Square", w: 1, h: 1 },
];

export const WALLPAPERS: PaperSize[] = [
  { id: "w-iphone", name: "iPhone · 1290×2796", w: 1290, h: 2796, px: [1290, 2796] },
  { id: "w-iphone-se", name: "iPhone (small) · 1170×2532", w: 1170, h: 2532, px: [1170, 2532] },
  { id: "w-android", name: "Android · 1440×3120", w: 1440, h: 3120, px: [1440, 3120] },
  { id: "w-ipad", name: "iPad · 2048×2732", w: 2048, h: 2732, px: [2048, 2732] },
  { id: "w-fhd", name: "Desktop Full HD · 1920×1080", w: 1920, h: 1080, px: [1920, 1080] },
  { id: "w-qhd", name: "Desktop QHD · 2560×1440", w: 2560, h: 1440, px: [2560, 1440] },
  { id: "w-4k", name: "Desktop 4K · 3840×2160", w: 3840, h: 2160, px: [3840, 2160] },
  { id: "w-mbp", name: "MacBook · 3024×1964", w: 3024, h: 1964, px: [3024, 1964] },
  { id: "w-ultra", name: "Ultrawide · 3440×1440", w: 3440, h: 1440, px: [3440, 1440] },
];

export const ALL_SIZES: PaperSize[] = [...SIZES, ...WALLPAPERS];
