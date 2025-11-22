
# Architecture Guide: Google Sheets & Stripe Integration

**Status: ACTIVE**
**Last Updated: 2024-07-27**

This document is the **source of truth** for the data architecture of the e-commerce functionality. Its purpose is to ensure stability and prevent recurring bugs by clearly defining roles and workflows.

---

## 1. Principe Fondamental : Découplage de l'Affichage et du Paiement

L'architecture repose sur une séparation stricte des responsabilités pour garantir que la boutique est toujours visible et fonctionnelle, même en cas de problème avec le système de paiement.

### **Google Sheets : La Vitrine (Source de l'Affichage)**

- **Rôle Exclusif** : Gérer **tout ce que l'utilisateur voit** dans le catalogue.
- **Contenu** :
    - `ID` : Identifiant unique et stable du produit. **C'est la clé de voûte.**
    - `Title` : Nom du produit.
    - `Description` : Description.
    - `Gallery` : URLs des images.
    - `Price_Model` : Prix pour l'affichage (le vrai prix est dans Stripe).
- **Règle d'or** : Le composant `catalog-page-client.tsx` **doit** lire ses données depuis le Google Sheet via la fonction `getCategoryData()`. L'affichage de la grille de produits est et doit rester **totalement indépendant de Stripe**.

### **Stripe : La Caisse Enregistreuse (Source du Paiement)**

- **Rôle Exclusif** : Gérer **toutes les transactions financières**.
- **Contenu** :
    - `Stripe Product`: Représentation du produit dans Stripe.
    - `Stripe Price`: Le prix réel et unique utilisé pour la facturation.
    - `Stripe Checkout Session`: La session de paiement sécurisée.
- **Règle d'or** : Le code côté client (React) n'interagit **jamais** directement avec l'API Stripe avec des clés secrètes. Tout passe par des fonctions Firebase sécurisées.

---

## 2. Le Pont : Mapping via les Métadonnées

Pour qu'un clic sur un produit de la "vitrine" (Sheet) puisse déclencher le paiement du bon article dans la "caisse" (Stripe), nous utilisons une **métadonnée** comme pont.

### Schéma du Mapping

1.  **Dans Google Sheets (Source)**
    - La colonne `ID` contient l'identifiant unique.
    - *Exemple :* `PROD_001`

2.  **Dans Stripe (Destination)**
    - Lors de la synchronisation des produits, un champ `metadata` est ajouté à chaque produit Stripe.
    - Ce champ contient une clé `sheet_id` dont la valeur est l'ID du Google Sheet.
    - *Exemple :* Produit Stripe `prod_ABC...` a `metadata: { sheet_id: "PROD_001" }`.

### Workflow du Checkout (Le "Pont" en action)

`Panier du Client`
    |
    v
Envoie `{ id: "PROD_001", quantity: 1 }` à la fonction Firebase
    |
    v
`Fonction Firebase createCheckoutSession`
    |
    v
Recherche dans Stripe : "Trouve-moi le produit où `metadata.sheet_id` est égal à `PROD_001`"
    |
    v
`Stripe` renvoie le bon produit (`prod_ABC...`)
    |
    v
La fonction récupère le `price_id` de ce produit et crée la session de paiement.

---

## 3. Bonnes Pratiques & Points de Contrôle

- **NE JAMAIS CASSER LA GRILLE** : Le composant `catalog-page-client.tsx` doit toujours fonctionner, même si un produit est mal synchronisé dans Stripe. Il doit uniquement dépendre des données du Google Sheet.
- **VALIDER LES ID** : Le bouton "Ajouter au panier" doit être désactivé si l'`ID` d'un produit dans le Sheet est manquant ou invalide (ex: `#NAME?`). C'est une sécurité cruciale pour ne pas polluer le panier.
- **SYNCHRONISATION UNIDIRECTIONNELLE** : Le flux de données est toujours `Google Sheet -> Stripe -> Firestore`. Ne jamais modifier les produits manuellement dans Stripe ou Firestore si cela peut être fait depuis le Sheet.
- **RÔLE DE FIRESTORE** : Firestore est un cache des données de Stripe. Il pourrait être utilisé pour l'affichage, mais pour garantir la robustesse face aux erreurs de synchronisation, nous avons décidé de nous fier **uniquement au Google Sheet pour l'affichage du catalogue**.

---

## 4. Maintenance et Débogage

- **Checklist avant MEP** :
    1.  Vérifier la colonne `ID` dans le Google Sheet du catalogue. Chaque produit doit avoir un ID unique, non vide et sans erreur.
    2.  Lancer la fonction `syncProductsFromSheet` si des produits ont été modifiés.
    3.  Consulter les logs de la fonction dans Firebase pour vérifier qu'il n'y a pas d'erreurs de synchronisation.
    4.  Tester le parcours d'ajout au panier. Utiliser la boîte de "Debug Info" dans le panier pour vérifier que l'`id` envoyé correspond bien à l'ID du Sheet.

- **Messages d'Erreur pour les Développeurs** :
    - Dans la fonction `createCheckoutSession`, les erreurs doivent être explicites.
        - **MAUVAIS** : `"Internal Error"`
        - **BON** : `"Product with sheet_id 'PROD_001' not found in Stripe. Please re-sync products."`
        - **BON** : `"No active price found for product 'PROD_001'. Please check Stripe configuration."`
    - Ces messages doivent être loggés côté serveur (Firebase Logs) pour un débogage facile.

    