export const CATEGORY_ILLUSTRATIONS = {
  maternelle: "/categories/maternelle.jpg",
  primaire: "/categories/primaire.jpg",
  secondaire: "/categories/secondaire.jpg",
  universitaire: "/categories/universitaire.jpg",
  bureautique: "/categories/bureautique.jpg",
  librairie: "/categories/librairie.jpg",
} as const;

export type CategoryAssetKey = keyof typeof CATEGORY_ILLUSTRATIONS;

const ORDER: CategoryAssetKey[] = [
  "maternelle",
  "primaire",
  "secondaire",
  "universitaire",
  "bureautique",
  "librairie",
];

export function getCategoryAssetKey(category: { slug?: string | null; name_fr?: string | null } | string): CategoryAssetKey | null {
  const raw = typeof category === "string" ? category : `${category.slug || ""} ${category.name_fr || ""}`;
  const value = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (value.includes("maternelle") || value.includes("prescolaire") || value.includes("preschool")) return "maternelle";
  if (value.includes("primaire") || value.includes("primary")) return "primaire";
  if (value.includes("secondaire") || value.includes("college") || value.includes("lycee") || value.includes("secondary")) return "secondaire";
  if (value.includes("univers") || value.includes("superieur") || value.includes("university")) return "universitaire";
  if (value.includes("bureau") || value.includes("office")) return "bureautique";
  if (value.includes("librairie") || value.includes("lecture") || value.includes("bookstore")) return "librairie";
  return null;
}

export function getCategoryImageUrl(category: { slug?: string | null; name_fr?: string | null; image_url?: string | null }) {
  const key = getCategoryAssetKey(category);
  return category.image_url || (key ? CATEGORY_ILLUSTRATIONS[key] : "/placeholder.svg");
}

export function sortCategories<T extends { slug?: string | null; name_fr?: string | null }>(categories: T[]): T[] {
  return [...categories].sort((a, b) => {
    const ak = getCategoryAssetKey(a);
    const bk = getCategoryAssetKey(b);
    const ai = ak ? ORDER.indexOf(ak) : 999;
    const bi = bk ? ORDER.indexOf(bk) : 999;
    if (ai !== bi) return ai - bi;
    return (a.name_fr || "").localeCompare(b.name_fr || "", "fr");
  });
}
