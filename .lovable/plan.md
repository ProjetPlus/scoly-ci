## Contexte

Vous demandez 5 chantiers en parallèle. Trois sont des correctifs ciblés livrables aujourd'hui ; deux sont des refontes lourdes (dashboards complets + audit total) qui doivent être découpées pour rester stables. Je propose la séquence ci-dessous pour livrer du concret aujourd'hui sans tout casser.

---

## Aujourd'hui (livré dans la foulée après votre OK)

### 1. Fix clignotement du menu (Admin / Vendeur / Livreur / Modérateur)

Cause : dans `Navbar.tsx`, les rôles sont lus dès le 1er rendu alors que `rolesLoading` n'est pas pris en compte. À chaque refresh du token Supabase, `isAdmin`/`roles` repassent à `false` une fraction de seconde → le bouton Admin disparaît/réapparaît.

Correctif :
- Exposer `rolesLoading` déjà présent dans `AuthContext` et l'utiliser dans `Navbar.tsx`.
- N'afficher les boutons de rôle (Admin / Vendeur / Modérateur / Livreur) que lorsque `!loading && !rolesLoading`. Avant ça : skeleton fin (même largeur) pour éviter le saut.
- Mémoïser `isVendor/isModerator/isDelivery` pour éviter les re-renders en cascade.
- Idem dans les autres surfaces qui lisent `roles` directement (vérification rapide : `NotificationBell`, `Footer`, pages `Account`, `Admin`, etc.).

### 2. Tri "façon Jumia" sur la page Boutique

Aujourd'hui : tri par `created_at desc` uniquement.

Nouveau tri par défaut (mix intelligent, sans backend lourd) :
1. **Featured/Promo en tête** (produits avec `is_flash_deal` ou `discount_percent > 0`).
2. **Mix par catégorie** : on regroupe les produits par `category`, puis on entrelace une ligne de chaque (round-robin) pour qu'aucune catégorie ne domine.
3. À l'intérieur d'une catégorie : score = `0.5 * normalize(views) + 0.3 * normalize(sales) + 0.2 * recency_decay(created_at)`.
4. Conserver les filtres existants (catégorie, prix, classe) et ajouter un sélecteur "Trier par" : **Recommandés (défaut)** / Nouveautés / Prix ↑ / Prix ↓ / Meilleures ventes / Mieux notés.
5. Pagination "load more" inchangée.

Implémentation : pur frontend dans `src/pages/Shop.tsx` (helper `mixProducts()` dans `src/lib/productSort.ts`). Aucune migration nécessaire.

### 3. Optimisation Kits (page lente)

Diagnostic à faire vite : la page `SmartKits` charge probablement `smart_kits` + `smart_kit_items` + `products` en cascade.

Actions :
- Une seule requête `smart_kits` avec `select('*, smart_kit_items(*, products(id,name_fr,price,image_url))')` au lieu de N+1.
- Cache React Query (déjà configuré, staleTime 5 min) — vérifier que la clé est stable.
- Skeleton dès le mount (pas d'écran blanc).
- Images lazy + `loading="eager"` uniquement pour le 1er kit visible.
- Si la requête imbriquée dépasse 800 ms → créer une vue SQL `smart_kits_with_items` matérialisée légère.

### 4. Audit pages publiques (passe rapide aujourd'hui)

Pages concernées : `/`, `/shop`, `/product/:id`, `/ecoles`, `/kits`, `/actualites`, `/about`, `/contact`, `/faq`, `/parrainage`, `/ressources`, `/livraison-retours`, pages légales.

Checklist par page (rapide, non destructif) :
- SEO : `<title>` < 60 car, meta desc < 160, un seul `<h1>`, OG/Twitter, JSON-LD si pertinent.
- Performance : LCP image en `loading="eager" fetchpriority="high"`, le reste en `lazy`.
- Liens cassés / boutons morts → corrigés.
- États vides + skeletons cohérents.
- Responsive 360 / 768 / 1280.
- Tokens couleur (pas de `text-white` / `bg-black` en dur).

Livré sous forme de petits commits ciblés, pas une réécriture massive.

---

## Demain (chantier dashboards — à part)

Finaliser CRUD + synchronisation des espaces : Admin, Modérateur, Vendeur, Livreur, Auteur, Client. C'est ~2 à 4 jours de travail soigné (RLS + UI + temps réel + tests). Je prépare un plan détaillé dédié demain matin avec :
- Inventaire de l'existant par rôle
- Liste des CRUD manquants
- Matrice de synchronisation temps réel (qui voit quoi en live)
- Découpage en lots livrables

---

## Ce que je NE fais PAS dans ce passage

- Pas de refonte visuelle des pages publiques (juste corrections).
- Pas de changement RLS (sauf si bug bloquant trouvé pendant l'audit).
- Pas de touche aux vidéos `SCOLY.mp4` / `SCOLY_2.mp4` — précisez où vous voulez les utiliser (hero ? page À propos ? section produit ?) et je les intègre via `lovable-assets`.

---

## Détails techniques (pour référence)

- Fichiers modifiés aujourd'hui : `src/components/Navbar.tsx`, `src/pages/Shop.tsx`, nouveau `src/lib/productSort.ts`, `src/pages/SmartKits.tsx`, + petits patchs SEO/perf sur ~10 pages publiques.
- Pas de nouvelle migration DB requise pour les 4 chantiers du jour.
- Tests : je relance `vitest` sur les composants touchés et je vérifie le preview après chaque lot.

---

**Validez ce plan** (ou dites quels chantiers vous voulez prioriser/retirer) et je lance l'implémentation immédiatement, en parallèle, lot par lot.
