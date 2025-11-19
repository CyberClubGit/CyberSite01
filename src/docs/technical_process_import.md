# DESCRIPTION DÉTAILLÉE DU PROCESSUS D'IMPORTATION DES DONNÉES (au 25/07/2024)

Ce document décrit avec précision le mécanisme actuel par lequel l'application importe et gère les données depuis les Google Sheets. Il inclut également ma compréhension de vos objectifs pour le projet "CYBER CLUB".


======================================================================
## PARTIE 1 : COMPRÉHENSION DE VOS INTENTIONS POUR LE PROJET "CYBER CLUB"
======================================================================

### Vision d'ensemble (résumé)
---
Vous souhaitez construire une plateforme web dynamique et modulable ("CYBER CLUB") qui fonctionne comme un portfolio multi-marques, un catalogue de produits/projets, et potentiellement un site e-commerce. La caractéristique centrale du projet est que **l'intégralité du contenu et de la structure du site doit être pilotée par des Google Sheets**, permettant des mises à jour en temps réel sans intervention sur le code.

### Objectifs détaillés
---
1.  **Architecture 100% "Data-Driven"** :
    *   **Source de vérité unique** : Les Google Sheets sont le cerveau de l'application. Le code n'est qu'un "moteur" qui interprète et affiche les données.
    *   **Gestion de contenu décentralisée** : Vous (ou d'autres) devez pouvoir modifier le contenu, ajouter des projets, des produits ou même des catégories entières en éditant simplement des cellules dans une feuille de calcul.

2.  **Navigation et Structure Dynamiques** :
    *   Le menu de navigation principal n'est pas codé en dur. Il est généré automatiquement en lisant les lignes du **"Master Sheet"**.
    *   **Scalabilité** : Si vous ajoutez une nouvelle ligne pour une catégorie "Blog" dans le Master Sheet, un lien "Blog" doit apparaître automatiquement dans le header, créant une nouvelle page fonctionnelle.

3.  **Système de "Marques" (Branding) Adaptatif** :
    *   Le **"Brand Selector"** est un élément clé. Il est lui-même alimenté par le "Brand Sheet".
    *   **Thématisation dynamique** : Sélectionner une marque (ex: "Artefact") doit instantanément changer l'identité visuelle du site (couleurs d'accentuation, ombres, etc.) en se basant sur les styles définis dans le Brand Sheet.
    *   **Routage contextuel** : L'URL doit refléter la marque active, passant d'une structure par défaut (`/projects`) à une structure de marque (`/design/projects`).
    *   **Filtrage de contenu** (objectif futur) : À terme, la sélection d'une marque ne changera pas seulement le style, mais filtrera aussi le contenu affiché sur la page pour ne montrer que les éléments pertinents à cette marque.


======================================================================
## PARTIE 2 : FONCTIONNEMENT TECHNIQUE ACTUEL DE L'IMPORTATION
======================================================================

Le processus se déroule principalement dans le fichier `src/lib/sheets.ts` et peut être décomposé en 3 étapes majeures.

### Étape 1 : Récupération des Catégories (depuis le Master Sheet)
---
1.  **Appel Initial** : Tout commence par un appel à la fonction `getCategories()`. Cette fonction est la porte d'entrée pour connaître la structure de base du site (les pages comme Home, Projects, Catalog, etc.).

2.  **Mise en Cache (`unstable_cache`)** : Pour optimiser les performances et ne pas solliciter l'API de Google à chaque visite, le résultat de cette fonction est mis en cache. La durée de validité est de 5 minutes (`revalidate: 300`). Cela signifie que si vous modifiez le Master Sheet, le site mettra jusqu'à 5 minutes pour refléter le changement.

3.  **Fetch du CSV** : La fonction utilise `fetch` pour télécharger le contenu brut du "Master Sheet" via son URL de publication CSV :
    `.../pub?gid=177392102&single=true&output=csv`

4.  **Parsing du CSV en Objets (LA CORRECTION CLÉ)** : Le texte CSV obtenu est ensuite analysé par la fonction `fetchAndParseCsv`. C'est l'étape la plus critique qui a été corrigée.
    *   **Ancien problème** : Le parser précédent utilisait un `split(',')` simple ou un regex fragile qui cassait les lignes contenant des URLs ou des textes longs avec des virgules.
    *   **Nouvelle solution** : Le parser actuel (`parseCSVLine`) lit la ligne CSV caractère par caractère. Il gère intelligemment les guillemets pour ne découper la ligne en colonnes que sur les virgules qui agissent comme de vrais séparateurs. Cela garantit que les champs contenant des virgules (comme des descriptions ou des listes d'URLs) ne sont pas tronqués. Chaque ligne est transformée en un objet JavaScript fiable.
    *Exemple d'objet généré :* `{ "Name": "Projects", "Url": "projects", "Url Sheet": "...", ... }`

### Étape 2 : Pas de Correctif des GIDs
---
Contrairement aux versions précédentes, il n'y a **PLUS AUCUNE LOGIQUE DE CORRECTION** des `gid` dans le code. Le principe est que le `Master Sheet` est la source de vérité. Si un lien dans la colonne `'Url Sheet'` est incorrect, il doit être corrigé directement dans le Google Sheet, et non dans le code.

### Étape 3 : Récupération des Données Spécifiques à une Page
---
1.  **Navigation de l'utilisateur** : Lorsque vous cliquez sur un lien du menu (ex: "Projects"), le navigateur charge l'URL correspondante (ex: `/projects`).

2.  **Exécution de la Page Dynamique** : Le composant de page `src/app/[...slug]/page.tsx` s'exécute. Il analyse l'URL (`/projects`) pour identifier la catégorie demandée ("projects").

3.  **Appel de `getCategoryData`** : Le composant trouve l'objet "catégorie" correspondant (qui contient maintenant l'URL de la feuille correcte lue à l'étape 1) et passe cette URL à la fonction `getCategoryData(slug)`.

4.  **Fetch des Données Finales** : `getCategoryData` prend le `slug`, retrouve la catégorie, extrait la propriété `'Url Sheet'` et effectue un nouveau `fetch` pour récupérer le CSV de la feuille de calcul spécifique (par exemple, la feuille de données des projets).

5.  **Parsing et Affichage** : Les données de cette feuille spécifique sont parsées par le même `fetchAndParseCsv` robuste et finalement affichées sur la page.

**En résumé :** Le système fonctionne maintenant sur un principe simple et direct. Il lit la structure du site depuis le Master Sheet en utilisant un parser fiable, puis, pour chaque page visitée, il utilise l'URL exacte fournie dans le Master Sheet pour charger et afficher les données correspondantes. La complexité et les sources d'erreurs ont été éliminées.

======================================================================
## PARTIE 3 : GESTION DES IMAGES GOOGLE DRIVE
======================================================================

### Le Problème
---
Les liens de partage standard de Google Drive (ex: `https://drive.google.com/file/d/ID/view`) ne sont pas des URLs d'images directes. Ils pointent vers une page web de prévisualisation Google. Ils ne peuvent donc pas être utilisés directement dans une balise `<img>` ou le composant `next/image`, ce qui résulterait en une image cassée.

### La Solution
---
Pour afficher une image hébergée sur Google Drive, son lien doit être converti en une URL d'image directe. Le processus est le suivant :

1.  **Extraction de l'ID du Fichier** : Isoler l'identifiant unique du fichier à partir de l'URL de partage.
    *   *Exemple :* `1NU2qTrw8JZ8ura9JpJsH3O2crcafz_Yx`

2.  **Construction de l'URL Directe** : Utiliser cet ID pour construire une nouvelle URL pointant vers le service de contenu de Google. Le format le plus fiable est :
    *   `https://lh3.googleusercontent.com/d/{ID_DU_FICHIER}`

### Implémentation dans le Code
---
Cette logique de conversion a été centralisée pour être réutilisable et maintenable.

*   **Fichier Utilitaire** : `src/lib/google-drive-utils.ts`
*   **Fonctions Clés** :
    *   `extractGoogleDriveId(url)` : Extrait l'ID de n'importe quel format de lien Google Drive.
    *   `convertGoogleDriveLinkToDirect(url)` : Prend une URL de partage et retourne l'URL d'image directe.

Cette conversion est appliquée automatiquement lors de la récupération des données dans `src/lib/sheets.ts`, assurant que les composants UI reçoivent toujours des URLs d'images prêtes à l'emploi.

### Configuration Requise
---
Pour que le composant `next/image` puisse charger ces images, le nom de domaine qui les héberge doit être autorisé dans la configuration de Next.js.

*   **Fichier** : `next.config.ts`
*   **Configuration** : Le domaine `lh3.googleusercontent.com` a été ajouté à la liste `images.remotePatterns`.

```javascript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      // ... autres domaines
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};
```
