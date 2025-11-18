# CYBER CLUB - Guide de Développement et Leçons Apprises

Ce document sert de "source de vérité" pour l'architecture des données de l'application. Son but est d'éviter les erreurs passées et de garantir une base de code stable et prévisible.

---

## 1. Principe Fondamental : Le Google Sheet est le Cerveau

**L'intégralité du contenu et de la structure du site est pilotée par les Google Sheets.** Le code n'est qu'un "moteur" qui interprète et affiche ces données.

- **NE JAMAIS** coder en dur des données qui existent dans un Sheet (ex: GID, URLs, noms de catégories).
- **TOUJOURS** corriger les données à la source (dans le Google Sheet), pas dans le code.

---

## 2. Leçons des Erreurs Passées (À ne plus jamais reproduire)

Nous avons fait face à une série de pannes critiques. En voici les causes racines, qui sont désormais nos **anti-patrons** :

### Leçon n°1 : Incohérence des Noms de Colonnes (L'erreur `Slug` vs `Url`)
- **Problème :** Le code TypeScript (`interface Category`) utilisait une propriété `Slug`, alors que la colonne du Google Sheet s'appelait `Url`. Cela a rendu toutes les données de catégorie invalides.
- **Règle d'or :** Les noms de propriétés dans les interfaces TypeScript (`src/lib/sheets.ts`) **DOIVENT CORRESPONDRE EXACTEMENT** aux noms des en-têtes de colonnes du Google Sheet, y compris la casse.

### Leçon n°2 : Mauvais Parsing du CSV
- **Problème :** Une première version de la fonction de parsing CSV découpait les lignes avec `split(',')`, ce qui cassait les URLs contenant elles-mêmes des virgules.
- **Règle d'or :** Toujours utiliser un parsing CSV robuste qui respecte les guillemets (`line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)`). La version actuelle dans `sheets.ts` est la bonne.

### Leçon n°3 : Complexité Inutile (L'erreur `gidCorrectionMap`)
- **Problème :** Pour corriger des `gid` invalides dans le Sheet, nous avons ajouté une `gidCorrectionMap` dans le code. C'était une rustine fragile qui a ajouté de la complexité et est devenue une source d'erreurs.
- **Règle d'or :** **ZÉRO LOGIQUE DE CORRECTION DANS LE CODE.** Si une donnée (comme une URL de feuille) est incorrecte, elle doit être corrigée dans le Google Sheet lui-même.

### Leçon n°4 : Conflit Client/Serveur (L'erreur `useMemo`)
- **Problème :** Des composants utilisant des hooks React (ex: `useMemo`, `useState`) mais destinés à un contexte client n'avaient pas la directive `"use client";`. Cela faisait planter tout le rendu côté serveur.
- **Règle d'or :** Tout composant React qui utilise des hooks (`useState`, `useEffect`, `useContext`, etc.) ou gère une interaction utilisateur **DOIT** commencer par la directive `"use client";`.

### Leçon n°5 : Syntaxe des Interfaces (L'erreur des `quotes`)
- **Problème :** L'ajout de guillemets inutiles autour de noms de propriétés simples (`'Name'`) dans une interface TypeScript a forcé l'utilisation de la notation `objet['propriété']`, cassant le code qui utilisait `objet.propriété`.
- **Règle d'or :** Dans une interface TypeScript, les guillemets autour d'une propriété ne sont utilisés **QUE SI** le nom contient un espace ou un caractère spécial (ex: `'Url Sheet'`). Pour les noms simples, ne pas utiliser de guillemets.

---

## 3. Flux de Données et Affichage Correct des Éléments

Voici le flux de données **correct et unique** pour afficher les pages et leurs données.

### Étape A : Récupération des Catégories (`getCategories`)
1.  Le `RootLayout` (`src/app/layout.tsx`) appelle `getCategories()` depuis `src/lib/sheets.ts`.
2.  `getCategories` lit le **Master Sheet** et transforme chaque ligne en un objet `Category`.
3.  Le résultat (un tableau `Category[]`) est passé au `Header`.

### Étape B : Construction du Menu dans le Header (`Header.tsx`)
1.  Le `Header` reçoit le tableau `categories`.
2.  Il boucle (`map`) sur ce tableau pour créer les liens de navigation.
3.  Pour chaque `category` :
    - Le texte du lien est `category.Name`.
    - L'URL du lien (`href`) est construite avec `category.Url` (le slug).
    - Exemple: `<Link href={`/${category.Url}`}> {category.Name} </Link>`

### Étape C : Affichage d'une Page Dynamique (`[...slug]/page.tsx`)
1.  L'utilisateur clique sur un lien (ex: `/projects`). Le slug de l'URL est `"projects"`.
2.  La page appelle `getCategoryData("projects")`.
3.  `getCategoryData` exécute la logique suivante :
    a.  Elle appelle `getCategories()` pour avoir la liste complète et à jour.
    b.  Elle trouve la catégorie correspondante : `categories.find(c => c.Url === "projects")`.
    c.  Elle extrait la propriété `'Url Sheet'` de cette catégorie. C'est l'URL de la feuille de données des projets.
    d.  Elle "fetche" cette URL pour récupérer et parser les données spécifiques aux projets.
4.  La page reçoit les données des projets et les affiche.

Ce flux garantit que toute modification dans le Master Sheet (ajout d'une page, changement de nom ou de slug) est **automatiquement** répercutée sur le site sans toucher au code.
