# Guide de la Source de Données du Catalogue

## Principe Fondamental : Le Google Sheet est la Source de Vérité pour l'Affichage

**Date de décision : 26/07/2024**

**Statut : ACTIF ET À NE PAS MODIFIER SANS DISCUSSION**

---

### Contexte
Suite à de multiples erreurs critiques (erreurs "internal", "Missing permissions", et la disparition de la grille des produits), une décision a été prise pour stabiliser l'application.

L'erreur la plus grave (disparition de la grille) a été causée par une **désynchronisation** entre la source des données (parfois Google Sheets, parfois Firestore) et le composant d'affichage (`catalog-page-client.tsx`) qui ne savait plus quel format de données interpréter.

### Règle d'Or
Pour garantir la stabilité et la prévisibilité du code, l'architecture suivante DOIT être respectée :

1.  **Source pour l'AFFICHAGE : Google Sheets Uniquement.**
    *   Le composant `catalog-page-client.tsx` et la page `[...slug]/page.tsx` doivent **TOUJOURS** récupérer les données des produits en utilisant la fonction `getCategoryData()`.
    *   Cette fonction lit les données directement depuis le Google Sheet défini dans le Master Sheet.
    *   **NE JAMAIS** faire appel à `getProducts()` de Firestore pour l'affichage de la grille du catalogue.

2.  **Source pour le PAIEMENT : Stripe via ID du Google Sheet.**
    *   Lorsque l'utilisateur ajoute un article au panier, c'est l'**ID du produit venant du Google Sheet** (colonne `ID`) qui est stocké.
    *   Lors du passage à la caisse, la fonction Firebase `createCheckoutSession` reçoit cet ID du Google Sheet.
    *   La fonction serveur est responsable de faire le lien : elle utilise l'ID du Sheet pour **rechercher le produit correspondant dans Stripe** et obtenir le `price_id` correct.

### Flux de Données du Catalogue (Correct et Verrouillé)

```
[Google Sheet "Catalog"]  <-- (Source de vérité pour l'affichage)
         |
         V
[getCategoryData()]  <-- (Récupère les données brutes)
         |
         V
[catalog-page-client.tsx]  <-- (Affiche la grille des produits. Utilise l'ID du Sheet)
         |
         |--- (Ajout au panier) ---> [useCart Hook]  <-- (Stocke l'ID du Sheet)
                                         |
                                         V
      (Clic sur "Payer") ---> [createCheckoutSession Firebase Function]
                                         |
                                         V
                             [Recherche dans STRIPE avec l'ID du Sheet]
                                         |
                                         V
                                 [Session de Paiement]
```

**Toute modification de ce flux doit être considérée comme une rupture majeure de l'architecture et est la cause probable des erreurs passées.** Ce document sert de "contrat" pour éviter de reproduire ces erreurs.
