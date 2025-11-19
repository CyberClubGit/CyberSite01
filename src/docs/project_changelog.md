# Journal des Modifications - Projet CYBER CLUB

Ce document retrace les décisions techniques et les fonctionnalités implémentées au fil du développement de l'application.

---

## Architecture Fondamentale (Data-Driven)

L'application repose sur une architecture entièrement pilotée par des données externes hébergées sur **Google Sheets**. C'est le principe fondamental du projet.

- **Source de Vérité** : Deux Google Sheets principaux dictent la structure et le style du site.
  1.  **Master Sheet** : Définit les catégories (pages) du site, leurs URLs (slugs), et les liens vers les feuilles de données spécifiques à chaque catégorie.
  2.  **Brand Sheet** : Définit les "marques" ou thèmes visuels, incluant leurs noms, logos, et couleurs d'accentuation pour les modes clair (Light) et sombre (Dark).

- **Navigation Dynamique** : Le menu de navigation principal dans le `Header` est généré automatiquement à partir des entrées du Master Sheet. Ajouter une nouvelle catégorie dans le Sheet ajoute automatiquement une nouvelle page au site, sans toucher au code.

- **Parsing CSV Robuste** : Un analyseur CSV personnalisé et fiable (`src/lib/sheets-parser.ts`) a été implémenté pour gérer les données complexes, y compris les cellules contenant des sauts de ligne ou des virgules, ce qui a résolu les problèmes de parsing initiaux.

---

## Système de Branding Adaptatif

Un sélecteur de marque (`Brand Selector`) permet de changer l'identité visuelle de l'ensemble du site en temps réel.

- **Changement de Thème** : La sélection d'une marque dans le `Header` met à jour dynamiquement une variable CSS (`--brand-color`) avec la couleur correspondante (light ou dark) depuis le Brand Sheet. Cette variable est ensuite utilisée pour colorer les éléments d'interface (bordures, liens actifs, etc.).

- **Routage Dynamique** : L'URL du site s'adapte à la marque sélectionnée.
  - Par défaut (marque "Cyber Club") : `/categorie` (ex: `/projects`)
  - Avec une marque sélectionnée : `/<brand_activity>/categorie` (ex: `/design/projects`)

---

## Gestion des Médias

Des solutions spécifiques ont été mises en place pour gérer les images et les vidéos hébergées sur des services externes.

### Images depuis Google Drive

- **Problème** : Les liens de partage Google Drive ne sont pas des liens d'images directs et ne peuvent pas être utilisés dans les balises `<img>`.
- **Solution** : Une fonction utilitaire (`convertGoogleDriveLinkToDirect`) a été créée pour transformer les liens de partage en URLs d'images directes (`lh3.googleusercontent.com/d/...`). Cette conversion est appliquée automatiquement lors de la récupération des données.
- **Configuration** : Le domaine `lh3.googleusercontent.com` a été ajouté à la configuration de Next.js (`next.config.ts`) pour autoriser le chargement des images.

### Vidéos d'Arrière-Plan (Background)

- **Première Tentative (Échec)** : L'utilisation de vidéos hébergées sur Google Drive a échoué. Les serveurs de Google Drive ne supportent pas les requêtes de streaming ("Range Requests") nécessaires à la balise `<video>`, ce qui empêchait la lecture.

- **Solution Viable (Firebase Storage)** : Les vidéos ont été déplacées vers **Firebase Storage**, qui est conçu pour la distribution de contenu et supporte nativement le streaming vidéo. Les liens générés par Firebase Storage sont directement compatibles.

- **Composant `VideoBackground`** :
  - **Position Fixe** : La vidéo reste fixe et couvre l'intégralité du viewport pendant le défilement (`position: fixed`).
  - **Adaptation au Thème (Light/Dark)** :
    - Un **filtre CSS `invert(1)`** est appliqué à la vidéo en mode clair pour inverser ses couleurs (le noir devient blanc et vice-versa).
    - Ce filtre est désactivé en mode sombre pour afficher les couleurs originales.
  - **Lisibilité** : Un **calque de surcouche (overlay)** est placé sur la vidéo avec une opacité de 80% pour réduire son intensité et améliorer la lisibilité du contenu au premier plan. Cet overlay est blanc en mode clair et noir en mode sombre.

---

## Pages et Mises en Page

- **Layouts Dynamiques** : Les composants `default-page-layout.tsx` et `catalog-page-client.tsx` récupèrent les données de la catégorie correspondante et affichent le contenu.
- **Fond Vidéo Conditionnel** : Ces layouts affichent le composant `VideoBackground` uniquement si une URL de vidéo est spécifiée dans la colonne `Background` du Master Sheet pour la catégorie en cours.
