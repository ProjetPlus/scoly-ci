import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CategoryProductRow from "@/components/CategoryProductRow";
import { sortCategories } from "@/lib/categoryAssets";

interface Category {
  id: string;
  slug: string | null;
  name_fr: string;
}

interface Product {
  id: string;
  name_fr: string;
  name_en: string;
  name_de: string;
  name_es: string;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  stock: number | null;
  image_url: string | null;
  is_featured: boolean | null;
  category_id: string | null;
  free_shipping: boolean | null;
  views: number | null;
  rating: number | null;
  created_at: string | null;
}

/**
 * Sur la Home : une ligne horizontale par catégorie (style Jumia).
 * Rendu léger : max 6 catégories, max 12 produits par ligne.
 */
const HomeCategoryRows = () => {
  const [rows, setRows] = useState<Array<{ cat: Category; products: Product[] }>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: cats } = await supabase
        .from("categories")
        .select("id,slug,name_fr")
        .limit(20);
      const sorted = sortCategories((cats || []) as any[]).slice(0, 6);
      if (sorted.length === 0) {
        if (!cancelled) setRows([]);
        return;
      }

      const results = await Promise.all(
        sorted.map(async (c) => {
          const { data } = await supabase
            .from("products")
            .select(
              "id,name_fr,name_en,name_de,name_es,price,original_price,discount_percent,stock,image_url,is_featured,category_id,free_shipping,views,rating,created_at"
            )
            .eq("is_active", true)
            .eq("category_id", c.id)
            .gt("stock", 0)
            .order("is_featured", { ascending: false })
            .order("views", { ascending: false })
            .limit(12);
          return { cat: c as Category, products: ((data as any) || []) as Product[] };
        })
      );

      if (!cancelled) setRows(results.filter((r) => r.products.length > 0));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows.length === 0) return null;

  return (
    <div className="bg-background">
      {rows.map(({ cat, products }) => (
        <CategoryProductRow
          key={cat.id}
          title={cat.name_fr}
          slug={cat.slug || undefined}
          products={products as any}
        />
      ))}
    </div>
  );
};

export default HomeCategoryRows;
