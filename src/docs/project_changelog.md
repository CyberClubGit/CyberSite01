# Journal des Modifications - Projet CYBER CLUB

Ce document retrace les décisions techniques et les fonctionnalités implémentées au fil du développement de l'application.

---

## Résolution des Erreurs Critiques

### L'Erreur "Fantôme" : `Missing or insufficient permissions` au Chargement

**Problème :** Une erreur `Missing or insufficient permissions` apparaissait systématiquement dans la console au chargement de n'importe quelle page, même pour un visiteur non connecté. L'erreur se produisait avant toute interaction de l'utilisateur.

**Cause Racine :** Le hook `useUser` (qui gère l'état de l'utilisateur) était "trop zélé". Il tentait de lire des informations de profil supplémentaires depuis la base de données Firestore (`/users/{userId}`) pour chaque visiteur, dès l'initialisation de l'application. Pour un visiteur non authentifié, cette lecture était systématiquement bloquée par les règles de sécurité, déclenchant l'erreur. Le problème n'était donc lié ni aux commandes, ni aux favoris, mais à cette lecture prématurée et non autorisée.

---

## Migration de Firebase Hosting vers App Hosting

L'objectif était de migrer le site de la solution classique Firebase Hosting vers la nouvelle plateforme **Firebase App Hosting**, spécialisée pour les applications dynamiques comme Next.js. Cette migration a nécessité plusieurs ajustements techniques pour s'adapter au nouvel environnement de build.

### Étape 1 : Résolution de l'erreur de build "routes-manifest.json"

**Problème :** Le premier déploiement sur App Hosting a échoué avec une erreur `ENOENT: no such file or directory, open '/workspace/.next/standalone/.next/routes-manifest.json'`. L'environnement de build ne trouvait pas un fichier essentiel de Next.js à son emplacement attendu.

**Cause Racine :** La configuration de Next.js (`next.config.js`) n'était pas explicitement définie pour le mode `standalone`, qui est requis par l'environnement de build d'App Hosting pour créer un serveur autonome.

**Solution :**
1.  Modification du fichier `next.config.js` pour y inclure `output: "standalone"`.
2.  Par mesure de précaution et d'optimisation, la génération des "source maps" en production a également été désactivée via `productionBrowserSourceMaps: false`.

### Étape 2 : Résolution du conflit de dépendances "ERESOLVE"

**Problème :** Après la première correction, le build échouait toujours, mais à une étape antérieure : l'installation des dépendances. Le log affichait une erreur `npm error ERESOLVE could not resolve`, indiquant un conflit de versions entre le package `@genkit-ai/next` (qui exigeait Next.js v15) et la version du projet (Next.js v14).

**Cause Racine :** L'environnement de build de Firebase utilise une version stricte de `npm` qui, par défaut, refuse d'installer des dépendances dont les "peer dependencies" ne correspondent pas exactement.

**Solution :**
1.  Création d'un fichier `.npmrc` à la racine du projet.
2.  Ajout de la ligne `legacy-peer-deps=true` dans ce fichier. Cette directive ordonne à `npm` d'ignorer les conflits de "peer dependencies" et de procéder à l'installation, reproduisant ainsi un comportement plus souple des anciennes versions de `npm`.

### Étape 3 : Autorisation du domaine pour les images externes

**Problème :** Une fois le build et le déploiement réussis, le site se chargeait mais affichait une erreur dans la console du navigateur : `Error: Invalid src prop ... hostname "lh3.googleusercontent.com" is not configured`. Les images provenant de comptes Google (avatars, etc.) ne s'affichaient pas.

**Cause Racine :** Par mesure de sécurité, Next.js oblige les développeurs à déclarer explicitement tous les noms de domaine externes autorisés à servir des images via le composant `<Image>`. Le domaine de Google n'était pas dans cette liste blanche.

**Solution :**
1.  Mise à jour du fichier `next.config.js` pour y ajouter une section `images`.
2.  Configuration de `remotePatterns` pour autoriser spécifiquement le protocole `https` et le nom de domaine `lh3.googleusercontent.com`.

---
