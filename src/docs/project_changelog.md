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

## Synchronisation des Produits avec Stripe et Firestore

Pour le catalogue, les données des produits suivent un flux de synchronisation en trois étapes pour garantir la cohérence entre la gestion de l'inventaire, le paiement et l'affichage sur le site.

- **Étape 1 : Source de Données (Google Sheets)**
  - Une feuille de calcul dédiée contient la liste complète des produits avec leurs détails (ID, titre, description, prix, type, images, etc.). C'est le point d'entrée pour la gestion de l'inventaire.

- **Étape 2 : Synchronisation vers Stripe (Firebase Functions)**
  - Une fonction Firebase (`syncProductsFromSheet`) est déclenchée manuellement (via un appel `curl` sécurisé).
  - Cette fonction lit la feuille de calcul des produits, la parse, et pour chaque ligne :
    - Elle crée ou met à jour un produit correspondant dans **Stripe**.
    - Elle crée les prix associés (ex: "Fichier 3D", "Impression 3D") dans Stripe.
  - Stripe devient ainsi la source de vérité pour tout ce qui concerne les paiements.

- **Étape 3 : Synchronisation vers Firestore**
  - Après avoir créé ou mis à jour le produit dans Stripe, la même fonction Firebase synchronise ces informations dans la base de données **Firestore**, dans une collection `/products`.
  - Firestore devient alors la source de vérité pour l'affichage du catalogue sur le site web. Cette approche permet de charger les données rapidement côté client sans exposer directement les clés d'API Stripe.

- **Affichage sur le Site**
  - La page "Catalogue" de l'application lit les données directement depuis la collection `/products` de Firestore pour afficher la liste des articles. Les règles de sécurité de Firestore sont configurées pour autoriser la lecture publique de cette collection.

---

## Gestion des Utilisateurs et Authentification

Le système gère les membres via Firebase Authentication et stocke les informations de profil dans Firestore.

- **Fournisseurs d'Authentification** :
  - Inscription et connexion via **Google**.
  - Inscription et connexion par **Email et Mot de passe**.

- **Base de Données des Utilisateurs (Firestore)** :
  - Lors de la première connexion ou inscription d'un utilisateur, un document est créé pour lui dans Firestore à l'emplacement `/users/{userId}`.
  - Ce document stocke des informations publiques et privées telles que :
    - `uid`, `email`, `displayName`, `photoURL` (depuis Firebase Auth)
    - `nickname`, `firstName`, `lastName` (renseignés à l'inscription)
    - **`favorites`** : Un tableau contenant les IDs des produits que l'utilisateur a marqués comme favoris.

- **Gestion des Favoris** :
  - Le hook `useFavorites` permet d'interagir avec le tableau `favorites` de l'utilisateur connecté.
  - Les utilisateurs peuvent ajouter ou retirer des produits de leurs favoris, et ces changements sont mis à jour en temps réel dans leur document Firestore.
  - Les règles de sécurité de Firestore garantissent qu'un utilisateur ne peut modifier que son propre document (et donc sa propre liste de favoris).

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
