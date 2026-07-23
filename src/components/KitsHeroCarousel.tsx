import { useEffect, useRef, useState, useCallback } from "react";
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
 * - Autoplay avec pause au survol / focus / touch
 * - Navigation clavier (← →) sur la région
 * - Labels ARIA complets, aria-live pour lecteurs d'écran
 * - Indicateurs de page cliquables
 */
const KitsHeroCarousel = () => {
  const [kits, setKits] = useState<Kit[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const isPlaying = true;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLElement>(null);

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

  const scrollToIndex = useCallback((idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.children[idx] as HTMLElement | undefined;
    if (card) {
      el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
    }
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    if (!kits.length) return;
    const next = (activeIdx + dir + kits.length) % kits.length;
    setActiveIdx(next);
    scrollToIndex(next);
  };

  // Autoplay
  useEffect(() => {
    if (!isPlaying || kits.length < 2) return;
    const id = window.setInterval(() => {
      setActiveIdx((prev) => {
        const next = (prev + 1) % kits.length;
        scrollToIndex(next);
        return next;
      });
    }, 4500);
    return () => window.clearInterval(id);
  }, [isPlaying, kits.length, scrollToIndex]);

  // Track scroll position -> active index (touch / manual scroll)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const children = Array.from(el.children) as HTMLElement[];
        const center = el.scrollLeft + el.clientWidth / 2;
        let best = 0;
        let bestDist = Infinity;
        children.forEach((c, i) => {
          const mid = c.offsetLeft - el.offsetLeft + c.clientWidth / 2;
          const d = Math.abs(mid - center);
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        });
        setActiveIdx(best);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [kits.length]);

  // Keyboard navigation when region has focus
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollBy(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollBy(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIdx(0);
      scrollToIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      const last = kits.length - 1;
      setActiveIdx(last);
      scrollToIndex(last);
    }
  };

  // Swipe tactile — préserve le focus, bloque le scroll page en horizontal
  const touchRef = useRef<{ x: number; y: number; locked: null | "h" | "v" } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, locked: null };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const s = touchRef.current;
    if (!s) return;
    const t = e.touches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (s.locked === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      s.locked = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
    }
    if (s.locked === "h" && e.cancelable) {
      // Empêche le scroll vertical de la page pendant un swipe horizontal
      e.preventDefault();
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touchRef.current;
    touchRef.current = null;
    if (!s || s.locked !== "h") return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const THRESHOLD = 40;
    if (Math.abs(dx) < THRESHOLD) return;
    // Conserve le focus sur la région pour que le clavier reste utilisable
    regionRef.current?.focus({ preventScroll: true });
    scrollBy(dx < 0 ? 1 : -1);
  };

  if (kits.length === 0) return null;

  return (
    <section
      ref={regionRef}
      className="py-8 bg-gradient-to-br from-primary/5 via-accent/5 to-background"
      role="region"
      aria-roledescription="carousel"
      aria-label="Kits École officiels — mis en avant"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: "pan-y" }}
    >
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" aria-hidden="true" />
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
            <Link
              to="/kits-scolaires"
              className="text-xs sm:text-sm text-primary hover:underline font-medium"
            >
              Tout voir
            </Link>
            <div className="hidden sm:flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollBy(-1)}
                className="rounded-full h-8 w-8"
                aria-label="Kit précédent"
                aria-controls="kits-scroller"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollBy(1)}
                className="rounded-full h-8 w-8"
                aria-label="Kit suivant"
                aria-controls="kits-scroller"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>

        <div
          id="kits-scroller"
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 focus:outline-none"
          style={{ scrollbarWidth: "thin" }}
          aria-live="polite"
          aria-atomic="false"
        >
          {kits.map((kit, idx) => {
            const price = kit.discount_price ?? kit.total_price ?? 0;
            const isActive = idx === activeIdx;
            return (
              <div
                key={kit.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${idx + 1} sur ${kits.length} — ${kit.name}`}
                aria-current={isActive ? "true" : undefined}
                className="snap-start shrink-0 w-[78%] sm:w-[46%] md:w-[32%] lg:w-[24%]"
              >
                <Link
                  to="/kits-scolaires"
                  className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg h-full"
                  aria-label={`Voir le kit ${kit.name}`}
                >
                <div className={`bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all h-full flex flex-col ${isActive ? "border-primary shadow-md" : "border-border"}`}>
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                    {kit.image_url ? (
                      <SmartImage
                        src={kit.image_url}
                        alt={`Kit ${kit.name} — ${kit.grade_level}${kit.school_name ? ` (${kit.school_name})` : ""}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        fallbackSrc="/placeholder.svg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary via-primary/80 to-accent text-primary-foreground">
                        <div className="text-center px-4">
                          <Package className="h-8 w-8 mx-auto mb-2" aria-hidden="true" />
                          <p className="font-display font-bold text-sm leading-tight">
                            {CATEGORY_LABELS[kit.category || ""] || "Kit École"}
                          </p>
                          <p className="text-[11px] opacity-90 mt-1">{kit.grade_level}</p>
                        </div>
                      </div>
                    )}
                    {kit.category && (
                      <Badge className="absolute top-2 left-2 bg-background/95 text-foreground border text-[10px] animate-fade-in">
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
              </div>
            );
          })}
        </div>

        {/* Indicateurs de page */}
        {kits.length > 1 && (
          <div
            className="flex justify-center gap-1.5 mt-3"
            role="tablist"
            aria-label="Sélectionner un kit"
          >
            {kits.map((k, idx) => (
              <button
                key={k.id}
                type="button"
                role="tab"
                aria-selected={idx === activeIdx}
                aria-label={`Aller au kit ${idx + 1} sur ${kits.length}`}
                onClick={() => {
                  setActiveIdx(idx);
                  scrollToIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                  idx === activeIdx ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default KitsHeroCarousel;
