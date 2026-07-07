// Sector branding: cinematic image (where available) + brand color fallback.
// Sectors without a generated image fall back to a branded gradient monogram.

export type SectorBrand = {
  image?: string; // /images/sectors/<slug>.jpg
  color: string; // primary accent
  color2: string; // gradient end
};

const MAP: Record<string, SectorBrand> = {
  banking: { image: "banking", color: "#00e676", color2: "#006b3c" },
  telecommunications: { image: "telecom", color: "#4ee8b0", color2: "#0b8a4f" },
  energy: { image: "energy", color: "#34e0a0", color2: "#00875a" },
  agriculture: { image: "agriculture", color: "#00ff9d", color2: "#00a651" },
  insurance: { image: "insurance", color: "#5fdaa0", color2: "#006b3c" },
  construction: { image: "construction", color: "#4ee8b0", color2: "#143827" },
  "consumer goods": { image: "consumer", color: "#34e0a0", color2: "#00875a" },
  media: { image: "media", color: "#4ee8b0", color2: "#225540" },
  // monogram-only fallbacks
  utilities: { color: "#7dffba", color2: "#00c853" },
  industrials: { color: "#4ee8b0", color2: "#1a4530" },
  "investment services": { color: "#34e0a0", color2: "#00b865" },
  "financial services": { color: "#00e676", color2: "#00c853" },
  hospitality: { color: "#7dffba", color2: "#34e0a0" },
};

export function brandFor(sector: string | null | undefined): SectorBrand {
  const key = (sector || "").trim().toLowerCase();
  return MAP[key] ?? { color: "#ffb020", color2: "#1fd585" };
}

export function sectorImage(sector: string | null | undefined): string | null {
  const img = brandFor(sector).image;
  return img ? `/images/sectors/${img}.jpg` : null;
}
