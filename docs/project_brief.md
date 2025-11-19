# CYBER CLUB - Maxiprompt pour App Builder Firebase
## Architecture Générale & Plan d'Implémentation (Phase 0-1)

📌 **CONTEXTE DU PROJET**
Nous construisons CYBER CLUB : un portfolio multi-marques + e-commerce + plateforme de publication avec :

- **Données sources** : Google Sheets (CSV publics)
- **Filtrage dynamique** : Par marque (Brand) et par catégorie (Page)
- **Styling adaptatif** : Thème qui change selon la marque sélectionnée
- **Navigation flexible** : Menu généré dynamiquement depuis les données

L'objectif de cette première étape est de construire une architecture générale fonctionnelle et épurée qui servira de socle à tout le reste. Pas de contenu détaillé, juste la structure.

---

🎯 **OBJECTIF PHASE 0-1 : ARCHITECTURE DE BASE**

### Résultat attendu
Un site fonctionnel avec :
- Header navigable qui démontre la lecture des données Google Sheets
- Pages dynamiques (8 catégories) qui se créent automatiquement
- Brand Selector qui filtre/change le thème
- URL architecture correctement implémentée
- Système visuel épuré en place (Blanc/Noir, Orbitron/Kode Mono, dark/light mode)

Le contenu détaillé de chaque page viendra plus tard. Pour l'instant : structure + test de connexion aux données.

---

📊 **DONNÉES SOURCES**

### Master Sheet (Source de vérité)
- **URL**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=177392102&single=true&output=csv`
- **Colonnes principales**:
  - `Category`: Nom de la page (Home, Projects, Catalog, Research, Events, Tools, Collabs, Ressources)
  - `Url Sheet`: Lien CSV de la feuille associée (que nous récupérerons plus tard pour le contenu)
- **Rôle**:
  - Génère le menu de navigation automatiquement
  - Chaque ligne = une page du site
  - Flexible : si on ajoute une catégorie au sheet, elle apparaît automatiquement dans le menu

### Brand Sheet (Styles + Filtrage)
- **URL**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vR8LriovOmQutplLgD0twV1nJbX02to87y2rCdXY-oErtwQTIZRp5gi7KIlfSzNA_gDbmJVZ80bD2l1/pub?gid=1634708260&single=true&output=csv`
- **Colonnes principales**:
  - `Brand`: Nom de la marque/activité (Cyber Club, Design, Code, Mécatronique, etc.)
  - `Activity`: Type d'activité (utilisé pour filtrer les contenus)
  - `Color`: Code couleur de la marque (#XXXXXX)
  - `[Autres colonnes de style à définir: shadow, border, details]`
- **Rôle**:
  - Alimente le dropdown "Brand Selector"
  - Chaque sélection change le thème couleurs + URL
  - Chaque sélection filtre les contenus (implémenté plus tard)

---

🏗️ **ARCHITECTURE SYSTÈME**

### Stack
- **Frontend**: Firebase App Builder (ou Next.js si vous préférez)
- **Fetch données**: Google Sheets CSV (fetch via URL publique)
- **Parsing**: Convertir CSV en objets JavaScript
- **Affichage**: Générer UI dynamiquement
- **Hosting**: Firebase Hosting

### Flux de Données (Phase 0-1)
1. Page charge
2. Fetch Master Sheet CSV
3. Parse categories → génère menu navigation
4. Fetch Brand Sheet CSV
5. Parse brands → génère dropdown Brand Selector
6. Applique thème visuel selon brand sélectionné
7. Navigation fonctionne (changement de page/URL)
8. Brand selector fonctionne (change thème + URL)

---

🧭 **STRUCTURE DE NAVIGATION**

### Header Component (Première étape de test)
Le header est notre test pilote pour vérifier que la récupération de données fonctionne.

**Contenu du Header:**

- **Partie gauche**:
  - Logo/Titre "CYBER CLUB"
  - Brand Selector (Dropdown)
    - Liste générée dynamiquement depuis Brand Sheet
    - Défaut : "Cyber Club" (tous les filtres)
    - Au clic : change couleur de fond + change URL
    - Format URL : `/brand/category` (ex: `/design/catalog`)

- **Partie centre**:
  - Menu Navigation (Horizontal)
    - Généré dynamiquement depuis Master Sheet (chaque Category = un lien)
    - Ordre : Home, Projects, Catalog, Research, Events, Tools, Collabs, Ressources
    - Liens : `/category` (ex: `/projects`, `/catalog`)
    - Actif : highlight la page actuelle
    - Réactif au Brand Selector : URL change si brand sélectionné

- **Partie droite**:
  - Dark/Light Mode Toggle (simple bouton)
    - Basculer entre thème clair et thème sombre
    - Persiste en localStorage
    - Change fond blanc ↔ noir + ajuste texte
  - User Menu (pour plus tard)
    - Placeholder pour maintenant

### Pages dynamiques
8 pages créées automatiquement (une par catégorie du Master Sheet) :
- `/` ou `/home` - Home
- `/projects` - Projects
- `/catalog` - Catalog
- `/research` - Research
- `/events` - Events
- `/tools` - Tools
- `/collabs` - Collabs
- `/resources` - Ressources

**Contenu de chaque page (Phase 0-1):**
- Titre : nom de la catégorie
- Sous-titre: placeholder "Contenu à venir"
- Layout épuré (juste structure, pas de contenu)
- Appliquer le thème Brand sélectionné

### URL Architecture
- **Format 1 - Par défaut (Cyber Club, pas affiché dans URL):**
  - `/category`
  - `/category/item-name`
  - Ex: `/projects`, `/projects/mon-projet`

- **Format 2 - Avec Brand sélectionné (affiché dans URL):**
  - `/brand/category`
  - `/brand/category/item-name`
  - Ex: `/design/projects`, `/design/projects/mon-projet`

- **Logique:**
  - Au chargement : URL = format 1 (Cyber Club défaut)
  - Clic sur Brand "Design" : URL bascule à `/design/...`
  - Clic sur "Cyber Club" (défaut) : URL revient à format 1
  - Navigation page → URL change avec brand actif

---

🎨 **SYSTÈME VISUEL (Phase 0-1)**

### Theme Général (Base)
- **Couleurs**: Blanc et Noir minimal
- **Polices**: 
  - Titres: Orbitron (Google Fonts)
  - Texte/Code: Kode Mono (Google Fonts)
- **Approche**: Épurée, computationnelle, moderne
- **Structure**:
  - Background: blanc (light mode) ou noir (dark mode)
  - Texte principal: noir (light) ou blanc (dark)
  - Spacing: généreux, clean

### Brand System (Testé via Header)
- **Par défaut: "Cyber Club"**
  - Pas d'indication visuelle spéciale
  - Tous les filtres actifs
- **Lors sélection d'une Brand (ex: "Design"):**
  - Change couleur d'accentuation (ex: rouge si Design = #FF0000)
  - Affecte: Border du dropdown, highlight menu, liens actifs
  - Subtle : pas envahissant, utiliser avec parcimonie
  - Peut affecter: ombre, contours, détails
- **CSS:**
  - Utiliser CSS variables (`--brand-color`, `--brand-accent`, etc.)
  - Changement dynamique au sélection Brand Selector
  - Persister en localStorage

### Dark/Light Mode
- **Toggle simple dans header (partie droite)**
- **Basculer entre deux palettes:**
  - **Light Mode:**
    - Background: `#FFFFFF` ou `#FAFAFA` (très légèrement grisé)
    - Texte principal: `#000000`
    - Texte secondaire: `#666666`
    - Borders: `#CCCCCC` (subtle)
  - **Dark Mode:**
    - Background: `#000000` ou `#0D0D0D` (très léger gris foncé)
    - Texte principal: `#FFFFFF`
    - Texte secondaire: `#AAAAAA`
    - Borders: `#333333` (subtle)
- **Persistance**: localStorage key = `"darkMode"` (true/false)

---

🛠️ **IMPLÉMENTATION TECHNIQUE (Détails généraux, pas de code)**

1.  **Récupérer et Parser Google Sheets CSV**
    - **Étape 1: Fetch Master Sheet**
      - URL publique CSV (déjà fournie)
      - Fetch au montage du composant
      - Parser chaque ligne comme objet : `{ Category, UrlSheet }`
      - Stocker en état : `categories`
    - **Étape 2: Fetch Brand Sheet**
      - URL publique CSV (déjà fournie)
      - Fetch au montage du composant
      - Parser chaque ligne comme objet : `{ Brand, Activity, Color, ... }`
      - Stocker en état : `brands`
    - **Étape 3: Gestion des erreurs**
      - Si fetch échoue : afficher message "Données indisponibles"
      - Log les erreurs pour debug

2.  **Générer le Menu Navigation**
    - Basé sur: `categories` (Master Sheet)
    - **Logique**:
      - `Map` `categories` → créer un lien pour chaque
      - Lien texte = `Category`
      - Lien URL = `/:category` (convertir en lowercase/slug si nécessaire)
      - Ajouter classe "active" selon page actuelle
      - Click sur lien = naviguer + mettre à jour URL

3.  **Générer le Brand Selector Dropdown**
    - Basé sur: `brands` (Brand Sheet)
    - **Logique**:
      - `Map` `brands` → créer option pour chaque
      - Option texte = `Brand`
      - Option valeur = `Brand` ou `Activity`
      - Défaut sélectionné = "Cyber Club"
      - Au changement sélection:
        - Mettre à jour couleur thème (utiliser colonne `Color`)
        - Mettre à jour URL (ajouter `brand` au début si pas "Cyber Club")
        - Persister sélection en localStorage

4.  **Routing & URL Management**
    - **Pages créées**:
      - Route principale : `/` (redirect vers `/home`)
      - Routes catégories : `/:category`
      - Routes avec brand : `/:brand/:category`
      - Routes détail (plus tard) : `/:category/:itemId` ou `/:brand/:category/:itemId`
    - **Logique**:
      - Parser URL au chargement
      - Extraire `brand` (optionnel) et `category` (obligatoire)
      - Si `brand` dans URL → mettre à jour Brand Selector à cette valeur
      - Si pas de `brand` dans URL → garder Cyber Club par défaut
      - Navigation menu → met à jour URL avec `brand` actuel

5.  **Styling & Dark Mode**
    - **Approche**:
      - Utiliser CSS variables pour tous les couleurs/espacements
      - `:root` = theme light (défaut)
      - `[data-theme="dark"]` ou `body.dark-mode` = theme dark
      - Toggle = change attribut `data-theme` ou classe `dark-mode`
      - Toggle → persister choix en localStorage
    - **Hiérarchie CSS**:
      1. CSS variables globales (light mode défaut)
      2. Media query `@media (prefers-color-scheme: dark)` ou manual toggle
      3. Brand-specific colors appliquées dynamiquement

6.  **Composants à Créer**
    - `Header.tsx`:
      - Logo/Title
      - Brand Selector Dropdown (généré depuis Brand Sheet)
      - Menu Navigation (généré depuis Master Sheet)
      - Dark/Light Toggle
      - User Menu (placeholder)
    - `Layout.tsx`:
      - Wraps Header
      - Wraps Page Content (changeable selon route)
      - Wraps Footer (placeholder)
    - **Pages (8 pages)**:
      - `Home.tsx`
      - `Projects.tsx`
      - `Catalog.tsx`
      - etc.
    - **Chaque page (Phase 0-1)**:
      - Titre (nom de la page)
      - Contenu placeholder : "Contenu à venir pour [Category]"
      - Layout clean (empty state)

7.  **Persistance & État Local**
    - `localStorage`:
      - `brandSelected` : Brand sélectionné (défaut: "Cyber Club")
      - `darkMode` : Mode sombre on/off (défaut: false)
    - **État mémoire (state)**:
      - `categories` : données Master Sheet
      - `brands` : données Brand Sheet
      - `currentBrand` : brand actuellement sélectionné
      - `isDarkMode` : booléen dark mode
      - `currentPage` : page/route actuelle

---

🚀 **PLAN D'EXÉCUTION DÉTAILLÉ**

- **Étape 1: Setup de Base**
  - [ ] Créer projet Firebase Hosting dans App Builder
  - [ ] Créer page d'accueil vierge
  - [ ] Importer polices Google : Orbitron + Kode Mono
  - [ ] Créer fichier CSS global avec variables

- **Étape 2: Fetch & Parsing Données**
  - [ ] Fonction pour fetcher Master Sheet CSV
  - [ ] Fonction pour fetcher Brand Sheet CSV
  - [ ] Test: Afficher données dans console pour debug

- **Étape 3: Construire le Header**
  - [ ] Logo/Title "CYBER CLUB"
  - [ ] Brand Selector Dropdown
  - [ ] Menu Navigation
  - [ ] Dark/Light Toggle
  - [ ] Styling global

- **Étape 4: Créer les 8 Pages**
  - [ ] Générer 8 pages (une par catégorie du Master Sheet)
  - [ ] Ajouter routing dynamique

- **Étape 5: Système de Routage Avancé**
  - [ ] Router capable de gérer `/home`, `/projects`, `/design/projects`
  - [ ] Navigation cohérente

- **Étape 6: Test Complet**
  - [ ] Vérifier récupération données
  - [ ] Tester navigation, Brand Selector, Dark Mode
  - [ ] Tester URLs directes
  - [ ] Test mobile responsif

---

🎯 **DÉFINITION DE "SUCCÈS" POUR CETTE PHASE**
La Phase 0-1 est complète quand :
- ✅ Le Header fonctionne
- ✅ La Navigation fonctionne
- ✅ Les 8 Pages existent
- ✅ État & Persistance fonctionne
- ✅ Sans Erreurs critiques
- ✅ Responsive & Accessible

---

🎬 **PROCHAINES PHASES**
- **Phase 2**: Contenu Home
- **Phase 3**: Catalog + Panier
- ... et ainsi de suite.
