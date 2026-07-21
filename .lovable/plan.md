# Refonte majeure — Produits, Kits, Images & Portails

Cette demande couvre 8 chantiers indépendants. Je propose de les livrer en **3 lots** pour garder chaque étape vérifiable. Confirmez-moi le lot par lequel démarrer (ou "tout dans l'ordre").

---

## Lot A — Catalogue produits façon Jumia (§1, §3, §5)

**Page /shop et Accueil**
- Remplacer la grille unique par une **section par catégorie**, chacune en **carrousel horizontal** (défilement fluide mobile/tablet/desktop, snap scroll).
- Nouveau composant `CategoryProductRow` réutilisable (accueil + shop).
- Ordre des catégories : par nombre de produits actifs, kits exclus.
- **Kits École retirés du flux produits standard** partout (filtre `is_kit=false` ou table `smart_kits` séparée déjà existante).

**Catégories sans image (§3)**
- Retrait des visuels décoratifs sur : Accueil, Menu Navbar, Filtres Shop, Recherche, Admin.
- Remplacement par **badges / boutons / cartes texte** (utilisation des tokens design existants, pas de couleurs codées en dur).
- `categoryAssets.ts` neutralisé (retourne `null` pour l'image, garde éventuellement l'icône Lucide).

**Formulaire produit (§5)**
- `category_id` devient **requis** côté formulaire (validation zod) + contrainte `NOT NULL` en base (migration).
- Sélecteur catégorie uniquement (pas de saisie libre).
- Blocage publication si absent.

## Lot B — Kits École mis en avant (§1 suite)

- **Hero Carousel** : nouveau composant `KitsHeroCarousel` affichant image du kit, nom, établissement (`schools.name`).
- Bannière dédiée "Kits École 2026" sur l'accueil.
- Section promo dédiée sur `/kits-ecole` renforcée.
- Kits jamais mélangés aux produits standards.

## Lot C — Images, reclassement, portails & sécurité (§2, §4, §6, §7, §8)

**Images (§2)**
- Audit systématique : produits, kits, bannières, avatars, articles.
- Correction `SmartImage` : fallback propre, gestion erreur onError, lazy loading uniforme.
- Vérif buckets Storage Supabase : `product-images`, `kit-images`, `article-covers`, `advertisements` → public + policies lecture anon.
- Script one-shot (edge function `fix-image-urls`) qui nettoie les URLs cassées en base (chemins relatifs → URLs publiques).
- Résultat cible : 0 placeholder résiduel.

**Reclassement auto (§4)**
- Edge function `auto-categorize-products` : analyse `name_fr` + `description_fr` + mots-clés → propose une catégorie via IA (Lovable AI Gateway, `google/gemini-2.5-flash`).
- Interface admin : tableau "Produits à reclasser" avec suggestion + boutons Valider / Modifier / Ignorer.
- Aucune modification automatique sans validation admin.

**Portails distincts (§6)**
- `/auth` → **Portail Client** : messaging orienté achat, aucun lien équipe/référent visible.
- `/me` → **Portail Référent** : landing + login dédiés, focus commissions/retraits/perfs. RoleGuard `[referent, association, school, school_admin]`.
- `/team` → **Portail Équipe** : login dédié, focus opérations. RoleGuard `[admin, moderator, vendor, delivery]`.
- Chaque portail = page login avec branding et copywriting propre.

**Sécurité captcha (§7)**
- `/auth` : suppression du `MathCaptcha`.
- `/me` et `/team` : intégration **Cloudflare Turnstile** (invisible, gratuit, moderne). Nécessite :
  - Secret `TURNSTILE_SECRET_KEY` (edge function de vérif).
  - Clé publique en variable env (`VITE_TURNSTILE_SITE_KEY`).
  - Edge function `verify-turnstile` qui valide le token avant `signInWithPassword`.
- Fallback MathCaptcha conservé si Turnstile indisponible.

**Redirections (§8)**
- `getDashboardPath()` dans `AuthContext` déjà présent — à affiner :
  - Client (`user` seul) → `/account`
  - Référent → `/me`
  - Équipe → `/team`
- Ajout garde stricte : un client tapant `/team` → redirigé `/account` (déjà en place via `RoleGuard`, à vérifier sur toutes les routes).
- Après logout depuis `/team` ou `/me` → retour à la page login **correspondante**, pas `/auth`.

---

## Détails techniques

### Migrations SQL prévues (Lot A + C)
```sql
-- category obligatoire
ALTER TABLE public.products
  ALTER COLUMN category_id SET NOT NULL;

-- flag kit (si absent) pour exclure des listings
-- (à vérifier : products.is_kit ou table smart_kits séparée)
```

### Nouveaux fichiers
```text
src/components/CategoryProductRow.tsx
src/components/KitsHeroCarousel.tsx
src/pages/MeLogin.tsx           (portail Référent)
src/pages/TeamLogin.tsx         (portail Équipe)
src/components/TurnstileWidget.tsx
supabase/functions/verify-turnstile/index.ts
supabase/functions/auto-categorize-products/index.ts
supabase/functions/fix-image-urls/index.ts
src/components/admin/ProductReclassificationQueue.tsx
```

### Secrets requis (Lot C)
- `TURNSTILE_SECRET_KEY` (Cloudflare)
- `VITE_TURNSTILE_SITE_KEY` (public)

---

## Question avant de démarrer

**Par quel lot commencer ?**
- **A** — Catalogue + catégories texte + formulaire produit (impact visuel immédiat sur /shop et accueil)
- **B** — Kits École mis en avant (Hero carousel dédié)
- **C** — Images + reclassement + portails distincts + Turnstile (le plus lourd, nécessite les secrets Turnstile)
- **Tout** — j'enchaîne A → B → C sans repasser en revue

Précisez aussi si vous avez déjà un compte **Cloudflare Turnstile** ou si je dois vous guider pour le créer (gratuit, 5 min).
