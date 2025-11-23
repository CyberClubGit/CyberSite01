# Guide de la Source de Données du Catalogue

## Principe Fondamental : Le Google Sheet est la Source de Vérité pour l'Affichage

**Date de décision : 27/07/2024**

**Statut : ACTIF. Le catalogue est 100% piloté par Google Sheets.**

---

### Contexte
Suite à de multiples erreurs critiques (erreurs "internal", "Missing permissions", et la disparition de la grille des produits), une décision a été prise pour stabiliser l'application.

L'erreur la plus grave (disparition de la grille) était causée par une **désynchronisation** entre les différentes sources de données (Google Sheets, Firestore, Stripe).

### Règle d'Or
Pour garantir la stabilité et la prévisibilité, l'architecture suivante DOIT être respectée :

1.  **Source de Données UNIQUE pour l'Affichage : Google Sheets.**
    *   Le composant `catalog-page-client.tsx` et la page `[...slug]/page.tsx` doivent **TOUJOURS** récupérer les données des produits en utilisant la fonction `getCategoryData()`.
    *   Cette fonction lit les données directement depuis le Google Sheet défini dans le Master Sheet.
    *   **NE JAMAIS** faire appel à une base de données comme Firestore ou à une API externe pour l'affichage de la grille du catalogue. L'affichage est et doit rester totalement indépendant de tout système externe.

2.  **Gestion des Paiements (Désactivée pour l'instant)**
    *   Le système de paiement Stripe, bien que l'architecture soit documentée, n'est plus activement utilisé.
    *   Lorsque l'utilisateur ajoute un article au panier, c'est l'**ID du produit venant du Google Sheet** (colonne `ID`) qui est stocké.
    *   La soumission de la commande se fait via Firestore, sans interaction directe avec Stripe côté client.

### Flux de Données du Catalogue (Correct et Verrouillé)

```
[Google Sheet "Catalog"]  <-- (Source de vérité unique pour l'affichage)
         |
         V
[getCategoryData()]  <-- (Récupère les données brutes)
         |
         V
[catalog-page-client.tsx]  <-- (Affiche la grille des produits. Utilise l'ID et les données du Sheet)
         |
         |--- (Ajout au panier) ---> [useCart Hook]  <-- (Stocke l'ID et les données du Sheet)
                                         |
                                         V
      (Clic sur "Envoyer Commande") ---> [Crée un document dans la collection 'orders' de Firestore]
```

**Toute modification de ce flux doit être considérée comme une rupture majeure de l'architecture.** Ce document sert de "contrat" pour éviter de reproduire les erreurs passées.
