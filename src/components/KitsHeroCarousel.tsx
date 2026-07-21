import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Package, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import SmartImage from "@/components/SmartImage";

interface Kit {
  id: string;
  name: string;
  grade_level: string;
  category: string | null;
  image_url: string | null;
  discount_price: number | null;
  total_price: number | null;
  school_id: string | null;
  school_name?: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  kit_cahiers: "Kit Cahiers",
  kit_livres: "Kit Livres",
  kit_complet_cl: "Kit Complet",
  kit_complet_clad: "Kit Complet +",
};

const formatFCFA = (v: number) =>
  new Intl.NumberFormat("fr-FR").format(Math.round(v || 0)) + " FCFA";

/**
 * Hero Carrousel dédié aux Kits École — mis en avant sur la Home.
 * Affiche image officielle du kit + nom de l'école + niveau.
 */
const KitsHeroCarousel = () => {
  const [kits, setKits] = useState<Kit[]>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("smart_kits")
        .select("id,name,grade_level,category,image_url,discount_price,total_price,school_id,schools(name)")
        .eq("is_active", true)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(12);
      if (cancelled) return;
      const mapped: Kit[] = (data || []).map((k: any) => ({
        ...k,
        school_name: k.schools?.name ?? null,
      }));
      setKits(mapped);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: Math.round(el.clientWidth * 0.9) * dir, behavior: "smooth" });
  };

  if (kits.length === 0) return null;

  return (
    <section className="py-8 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                Kits officiels
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              Kits École — validés par les établissements
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Retrouvez le kit officiel de votre école, par niveau.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/kits-scolaires" className="text-xs sm:text-sm text-primary hover:underline font-medium">
              Tout voir
            </Link>
            <div className="hidden sm:flex gap-1">
              <Button variant="outline" size="icon" onClick={() => scrollBy(-1)} className="rounded-full h-8 w-8" aria-label="Précédent">
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" size="icon" onClick={() => scrollBy(1)} className="rounded-full h-8 w-8" aria-label="Suivant">
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-3 px-3 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: "thin" }}
        >
          {kits.map((kit) => {
            const price = kit.discount_price ?? kit.total_price ?? 0;
            return (
              <Link
                key={kit.id}
                to="/kits-scolaires"
                className="snap-start shrink-0 w-[78%] sm:w-[46%] md:w-[32%] lg:w-[24%] group"
              >
                <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all h-full flex flex-col">
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                    {kit.image_url ? (
                      <SmartImage
                        src={kit.image_url}
                        alt={kit.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        fallbackSrc="/placeholder.svg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary via-primary/80 to-accent text-primary-foreground">
                        <div className="text-center px-4">
                          <Package className="h-8 w-8 mx-auto mb-2" />
                          <p className="font-display font-bold text-sm leading-tight">
                            {CATEGORY_LABELS[kit.category || ""] || "Kit École"}
                          </p>
                          <p className="text-[11px] opacity-90 mt-1">{kit.grade_level}</p>
                        </div>
                      </div>
                    )}
                    {kit.category && (
                      <Badge className="absolute top-2 left-2 bg-background/95 text-foreground border text-[10px]">
                        {CATEGORY_LABELS[kit.category] || kit.category}
                      </Badge>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col gap-1">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {kit.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {kit.school_name ? `${kit.school_name} · ` : ""}
                      {kit.grade_level}
                    </p>
                    {price > 0 && (
                      <p className="mt-auto text-primary font-bold text-sm tabular-nums">
                        {formatFCFA(price)}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default KitsHeroCarousel;
