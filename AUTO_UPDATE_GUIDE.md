# Configuration Auto-Update avec GitHub Releases

## Étapes pour activer les mises à jour automatiques :

### 1. Créer un dépôt GitHub
1. Va sur https://github.com/new
2. Crée un dépôt nommé `league-matchup-notes` (ou autre nom)
3. Laisse-le **public** (obligatoire pour les releases gratuites)

### 2. Mettre à jour package.json
Ouvre `package.json` et remplace dans la section `"publish"` :
```json
"owner": "TON_USERNAME_GITHUB",  // Remplace par ton username GitHub
```

### 3. Générer un token GitHub (pour publier les releases)
1. Va sur : https://github.com/settings/tokens
2. Clique sur "Generate new token (classic)"
3. Donne-lui un nom : `electron-builder`
4. Coche la permission : **`public_repo`**
5. Clique sur "Generate token"
6. **COPIE LE TOKEN** (tu ne le reverras plus !)

### 4. Configurer le token localement
Dans PowerShell :
```powershell
$env:GH_TOKEN="ton_token_github_ici"
```

### 5. Build et publier une release
```powershell
# Augmente la version dans package.json avant chaque release
# Par exemple change "1.0.0" en "1.0.1"

npm run package  # Build l'app

# Publier sur GitHub Releases
npx electron-builder --publish always
```

### 6. Pour les futures mises à jour
1. Modifie ton code
2. Augmente la version dans `package.json` (ex: 1.0.1 → 1.0.2)
3. Build : `npm run package`
4. Publie : `npx electron-builder --publish always`
5. L'app installée chez les utilisateurs détectera automatiquement la nouvelle version !

---

## Comment ça marche ?

- **Au démarrage** : L'app vérifie GitHub Releases pour une nouvelle version
- **Si disponible** : Notification s'affiche avec bouton "Télécharger"
- **Téléchargement** : Barre de progression
- **Prêt** : Demande de redémarrer l'app
- **Redémarrage** : Installation automatique de la mise à jour

---

## Commandes utiles

```powershell
# Build local (sans publier)
npm run package

# Build ET publier sur GitHub
npx electron-builder --publish always

# Tester localement (mode dev)
npm run electron:dev
```

---

## Notes importantes

- Le dépôt GitHub DOIT être **public** (gratuit)
- Change la version dans `package.json` AVANT chaque release
- Les utilisateurs doivent avoir installé l'app avec le Setup.exe pour que l'auto-update fonctionne
- L'exécutable portable (non-installé) ne peut pas se mettre à jour automatiquement
