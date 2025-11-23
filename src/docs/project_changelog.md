# Journal des Modifications - Projet CYBER CLUB

Ce document retrace les décisions techniques et les fonctionnalités implémentées au fil du développement de l'application.

---

## Résolution des Erreurs Critiques

### L'Erreur "Fantôme" : `Missing or insufficient permissions` au Chargement

**Problème :** Une erreur `Missing or insufficient permissions` apparaissait systématiquement dans la console au chargement de n'importe quelle page, même pour un visiteur non connecté. L'erreur se produisait avant toute interaction de l'utilisateur.

**Cause Racine :** Le hook `useUser` (qui gère l'état de l'utilisateur) était "trop zélé". Il tentait de lire des informations de profil supplémentaires depuis la base de données Firestore (`/users/{userId}`) pour chaque visiteur, dès l'initialisation de l'application. Pour un visiteur non authentifié, cette lecture était systématiquement bloquée par les règles de sécurité, déclenchant l'erreur. Le problème n'était donc lié ni aux commandes, ni aux favoris, mais à cette lecture prématurée et non autorisée.

**Solution :** La gestion des données utilisateur a été drastiquement simplifiée.
1.  **Suppression de la Lecture Automatique :** La logique qui lisait automatiquement Firestore depuis le hook `useUser` a été complètement retirée.
2.  **Source de Vérité Unique :** Le hook `useUser` se contente désormais des informations de base fournies par **Firebase Authentication** (UID, email, etc.) au moment de la connexion.
3.  **Aucune lecture de Firestore au démarrage :** L'application ne tente plus aucune opération sur la base de données tant qu'un utilisateur n'est pas connecté et n'effectue pas une action explicite (comme passer une commande).

Cette correction a stabilisé l'application en éliminant la cause fondamentale de l'erreur de permission.

---

## Architecture Fondamentale (Data-Driven)

L'application repose sur une architecture entièrement pilotée par des données externes hébergées sur **Google Sheets**. C'est le principe fondamental du projet.

- **Source de Vérité** : Deux Google Sheets principaux dictent la structure et le style du site.
  1.  **Master Sheet** : Définit les catégories (pages) du site, leurs URLs (slugs), et les liens vers les feuilles de données spécifiques à chaque catégorie.
  2.  **Brand Sheet** : Définit les "marques" ou thèmes visuels, incluant leurs noms, logos, et couleurs d'accentuation pour les modes clair (Light) et sombre (Dark).

- **Navigation Dynamique** : Le menu de navigation principal dans le `Header` est généré automatiquement à partir des entrées du Master Sheet. Ajouter une nouvelle catégorie dans le Sheet ajoute automatiquement une nouvelle page au site, sans toucher au code.

- **Parsing CSV Robuste** : Un analyseur CSV personnalisé et fiable (`src/lib/sheets-parser.ts`) a été implémenté pour gérer les données complexes, y compris les cellules contenant des sauts de ligne ou des virgules, ce qui a résolu les problèmes de parsing initiaux.

---

## Synchronisation des Produits avec Stripe et Firestore (Désactivée)

**Statut : L'intégration avec Stripe et la synchronisation Firestore pour le catalogue sont actuellement désactivées pour privilégier une architecture 100% basée sur Google Sheets.**

Pour le catalogue, les données des produits suivaient initialement un flux de synchronisation pour garantir la cohérence entre la gestion de l'inventaire, le paiement et l'affichage. Cette logique est conservée dans le code mais n'est pas active.

- **Source de Données (Google Sheets)** : Une feuille de calcul dédiée contient la liste complète des produits.
- **Affichage sur le Site** : La page "Catalogue" de l'application lit désormais les données **directement depuis le Google Sheet** via la fonction `getCategoryData`, et non plus depuis Firestore.

---

## Gestion des Utilisateurs et Authentification

Le système gère les membres via Firebase Authentication et stocke les informations de profil dans Firestore lors de la création de compte ou de la soumission d'actions spécifiques (comme passer une commande).

- **Fournisseurs d'Authentification** :
  - Inscription et connexion via **Google**.
  - Inscription et connexion par **Email et Mot de passe**.

- **Base de Données des Utilisateurs (Firestore)** :
  - Lors de la première connexion ou inscription d'un utilisateur, un document est créé pour lui dans Firestore à l'emplacement `/users/{userId}`.
  - Ce document stocke des informations telles que : `uid`, `email`, `displayName`, `photoURL`, `nickname`, `firstName`, `lastName`.
  - La lecture de ce document n'est plus automatique au chargement du site.

- **Suppression des Favoris** : La fonctionnalité de "favoris", qui nécessitait une lecture constante du document utilisateur et était une source d'erreurs de permission, a été entièrement supprimée pour simplifier le système.

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
