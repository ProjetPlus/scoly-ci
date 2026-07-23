import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Package, ShoppingCart, Search, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { SchoolCombobox, type SchoolOption } from "@/components/kits/SchoolCombobox";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import SmartImage from "@/components/SmartImage";

const CATEGORY_LABELS: Record<string, string> = {
  kit_cahiers: "Kit Cahiers",
  kit_livres: "Kit Livres",
  kit_complet_cl: "Kit Complet (Cahiers + Livres)",
  kit_complet_clad: "Kit Complet (Cahiers + Livres + Annales + Dictionnaires)",
};

type KitItem = {
  id: string;
  item_name: string;
  quantity: number;
  estimated_price: number;
  is_optional: boolean;
  product_id: string | null;
};

type Kit = {
  id: string;
  name: string;
  description: string | null;
  grade_level: string;
  school_id: string | null;
  category: string | null;
  image_url: string | null;
  total_price: number | null;
  discount_price: number | null;
  items?: KitItem[];
};

const formatFCFA = (v: number) =>
  new Intl.NumberFormat("fr-FR").format(Math.round(v || 0)) + " FCFA";

const KitCoverFallback = ({ kit, schoolName }: { kit: Kit; schoolName?: string }) => (
  <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-accent text-primary-foreground">
    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_60%,white,transparent_40%)]" />
    <div className="relative z-10 flex flex-col items-center gap-2 p-4 text-center">
      <Sparkles className="h-8 w-8" />
      <p className="font-display text-lg font-bold leading-tight">
        {CATEGORY_LABELS[kit.category || ""] || "Kit École"}
      </p>
      <p className="text-xs opacity-90">{kit.grade_level}</p>
      {schoolName ? <p className="text-[11px] font-semibold uppercase tracking-wide opacity-90">{schoolName}</p> : null}
    </div>
  </div>
);

const KitsEcole = () => {
  const [school, setSchool] = useState<SchoolOption | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // Selected optional item ids per kit
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const { addToCart } = useCart();

  useEffect(() => {
    if (!school) {
      setKits([]);
      setLevel(null);
      return;
    }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("smart_kits")
        .select(
          "id,name,description,grade_level,school_id,category,image_url,total_price,discount_price,items:smart_kit_items(id,item_name,quantity,estimated_price,is_optional,product_id)"
        )
        .eq("school_id", school.id)
        .eq("is_active", true)
        .eq("status", "published")
        .order("grade_level", { ascending: true });
      const parsed: Kit[] = (data || []).map((k: any) => ({
        ...k,
        items: (k.items || []) as KitItem[],
      }));
      setKits(parsed);
      // Initialize: no optional items selected by default
      const init: Record<string, Set<string>> = {};
      for (const k of parsed) init[k.id] = new Set();
      setSelected(init);
      setLoading(false);
    })();
  }, [school]);

  const levels = useMemo(() => Array.from(new Set(kits.map((k) => k.grade_level))).sort(), [kits]);
  const visibleKits = useMemo(() => (level ? kits.filter((k) => k.grade_level === level) : kits), [kits, level]);

  const computePrice = (kit: Kit) => {
    const sel = selected[kit.id] || new Set<string>();
    return (kit.items || []).reduce((sum, it) => {
      if (it.is_optional && !sel.has(it.id)) return sum;
      return sum + (Number(it.estimated_price) || 0) * (Number(it.quantity) || 0);
    }, 0);
  };

  const toggleOption = (kitId: string, itemId: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      const s = new Set(next[kitId] || []);
      if (s.has(itemId)) s.delete(itemId);
      else s.add(itemId);
      next[kitId] = s;
      return next;
    });
  };

  const handleAddKit = async (kit: Kit) => {
    const sel = selected[kit.id] || new Set<string>();
    const chosen = (kit.items || []).filter(
      (it) => (!it.is_optional || sel.has(it.id)) && it.product_id
    );
    if (chosen.length === 0) {
      toast.error("Ce kit ne contient aucun produit disponible à l'achat.");
      return;
    }
    let ok = 0;
    for (const it of chosen) {
      try {
        await addToCart(it.product_id as string, it.quantity || 1);
        ok++;
      } catch {
        // continue
      }
    }
    if (ok > 0) toast.success(`Kit ajouté au panier (${ok} produit${ok > 1 ? "s" : ""}).`);
    else toast.error("Impossible d'ajouter le kit au panier.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Kit École — Trouvez le kit officiel de votre établissement | Scoly</title>
        <meta
          name="description"
          content="Recherchez votre établissement scolaire et retrouvez le kit officiel correspondant à votre niveau. Kits cahiers, livres et kits complets."
        />
      </Helmet>
      <Navbar />
      <main id="main-content" className="flex-1">
        <section className="border-b bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-10 md:py-16">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <Badge variant="secondary" className="mx-auto">Nouveau · Kits officiels par établissement</Badge>
              <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
                Trouvez le Kit École de votre établissement
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">
                Recherchez votre école ou saisissez votre code référent pour accéder aux kits officiels validés.
              </p>
            </div>

            <div className="mt-8 max-w-2xl mx-auto space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Search className="h-4 w-4" /> Rechercher votre établissement
              </label>
              <SchoolCombobox
                value={school?.id}
                onChange={setSchool}
                placeholder="Entrez le nom de votre établissement ou votre code référent."
              />
              {school && levels.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant={level === null ? "default" : "outline"}
                    onClick={() => setLevel(null)}
                  >
                    Tous les niveaux
                  </Button>
                  {levels.map((lv) => (
                    <Button
                      key={lv}
                      size="sm"
                      variant={level === lv ? "default" : "outline"}
                      onClick={() => setLevel(lv)}
                    >
                      {lv}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10">
          {!school ? (
            <div className="text-center text-muted-foreground py-16">
              <Package className="mx-auto h-10 w-10 mb-3 opacity-40" />
              <p>Sélectionnez votre établissement pour voir les kits disponibles.</p>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-xl" />
              ))}
            </div>
          ) : visibleKits.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <p>Aucun kit publié pour cet établissement pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleKits.map((kit) => {
                const items = kit.items || [];
                const mandatory = items.filter((i) => !i.is_optional);
                const optional = items.filter((i) => i.is_optional);
                const price = computePrice(kit);
                const isOpen = !!expanded[kit.id];
                return (
                  <Card key={kit.id} className="group overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                    <div className="relative aspect-[4/3] w-full bg-muted">
                      {kit.image_url ? (
                        <SmartImage
                          src={kit.image_url}
                          alt={kit.name}
                          fallbackSrc="/placeholder.svg"
                          className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform"
                        />
                      ) : (
                        <KitCoverFallback kit={kit} schoolName={school?.name} />
                      )}
                      {kit.category && (
                        <Badge className="absolute top-2 left-2 bg-background/95 text-foreground border">
                          {CATEGORY_LABELS[kit.category] || kit.category}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4 flex-1 flex flex-col gap-3">
                      <div className="space-y-1">
                        <h3 className="font-display font-semibold text-lg leading-tight line-clamp-2">
                          {kit.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {kit.grade_level} · {school?.name}
                        </p>
                      </div>

                      {items.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpanded((e) => ({ ...e, [kit.id]: !e[kit.id] }))}
                          className="text-xs text-primary flex items-center gap-1 hover:underline w-fit"
                        >
                          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          Voir la composition ({items.length} article{items.length > 1 ? "s" : ""})
                        </button>
                      )}

                      {isOpen && (
                        <div className="space-y-2 rounded-md border p-2 max-h-56 overflow-y-auto">
                          {mandatory.length > 0 && (
                            <div>
                              <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-1">Inclus</p>
                              <ul className="space-y-0.5">
                                {mandatory.map((it) => (
                                  <li key={it.id} className="text-xs flex justify-between gap-2">
                                    <span className="truncate">
                                      {it.item_name} <span className="text-muted-foreground">×{it.quantity}</span>
                                    </span>
                                    <span className="text-muted-foreground shrink-0">
                                      {formatFCFA(it.estimated_price * it.quantity)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {optional.length > 0 && (
                            <div>
                              <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                                Options (à ajouter si souhaité)
                              </p>
                              <ul className="space-y-1">
                                {optional.map((it) => {
                                  const checked = selected[kit.id]?.has(it.id) || false;
                                  return (
                                    <li key={it.id} className="text-xs flex items-center gap-2">
                                      <Checkbox
                                        id={`opt-${it.id}`}
                                        checked={checked}
                                        onCheckedChange={() => toggleOption(kit.id, it.id)}
                                      />
                                      <label htmlFor={`opt-${it.id}`} className="flex-1 flex justify-between gap-2 cursor-pointer">
                                        <span className="truncate">
                                          {it.item_name} <span className="text-muted-foreground">×{it.quantity}</span>
                                        </span>
                                        <span className="text-muted-foreground shrink-0">
                                          +{formatFCFA(it.estimated_price * it.quantity)}
                                        </span>
                                      </label>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-auto">
                        <div>
                          <div className="text-xs text-muted-foreground">Prix total</div>
                          <div className="font-bold text-primary text-lg">{formatFCFA(price)}</div>
                        </div>
                        <Badge variant="secondary" className="whitespace-nowrap">
                          <Package className="h-3 w-3 mr-1" />
                          {items.length} article{items.length > 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" className="w-full" onClick={() => handleAddKit(kit)}>
                          <ShoppingCart className="h-4 w-4 mr-1" /> Ajouter au panier
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default KitsEcole;
