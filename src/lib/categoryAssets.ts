/**
 * Category helpers — TEXT ONLY.
 *
 * Les catégories ne doivent plus afficher d'images décoratives.
 * Ce module ne renvoie plus d'URL d'image ; il conserve uniquement
 * la clé logique (utilisée pour trier et pour choisir une icône Lucide
 * côté composant si besoin).
 */

export type CategoryAssetKey =
  | "maternelle"
  | "primaire"
  | "secondaire"
  | "universitaire"
  | "bureautique"
  | "librairie";

const ORDER: CategoryAssetKey[] = [
  "maternelle",
  "primaire",
  "secondaire",
  "universitaire",
  "bureautique",
  "librairie",
];

export function getCategoryAssetKey(
  category: { slug?: string | null; name_fr?: string | null } | string,
): CategoryAssetKey | null {
  const raw =
    typeof category === "string"
      ? category
      : `${category.slug || ""} ${category.name_fr || ""}`;
  const value = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    value.includes("maternelle") ||
    value.includes("prescolaire") ||
    value.includes("preschool")
  )
    return "maternelle";
  if (value.includes("primaire") || value.includes("primary")) return "primaire";
  if (
    value.includes("secondaire") ||
    value.includes("college") ||
    value.includes("lycee") ||
    value.includes("secondary")
  )
    return "secondaire";
  if (
    value.includes("univers") ||
    value.includes("superieur") ||
    value.includes("university")
  )
    return "universitaire";
  if (value.includes("bureau") || value.includes("office")) return "bureautique";
  if (
    value.includes("librairie") ||
    value.includes("lecture") ||
    value.includes("bookstore")
  )
    return "librairie";
  return null;
}

export function sortCategories<
  T extends { slug?: string | null; name_fr?: string | null },
>(categories: T[]): T[] {
  return [...categories].sort((a, b) => {
    const ak = getCategoryAssetKey(a);
    const bk = getCategoryAssetKey(b);
    const ai = ak ? ORDER.indexOf(ak) : 999;
    const bi = bk ? ORDER.indexOf(bk) : 999;
    if (ai !== bi) return ai - bi;
    return (a.name_fr || "").localeCompare(b.name_fr || "", "fr");
  });
}

/**
 * @deprecated Les catégories n'affichent plus d'image décorative.
 * Conservé uniquement pour la compatibilité ascendante — renvoie toujours null.
 */
export function getCategoryImageUrl(_category: unknown): string | null {
  return null;
}

/** Initiales lisibles à afficher dans un badge/rondelle si un visuel est nécessaire. */
export function getCategoryInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
