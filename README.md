# League of Legends - Matchup Notes

Application Electron pour gérer vos matchups League of Legends avec notes et runes.

## 🚀 Installation

1. Installez les dépendances :
```powershell
npm install
```

## 💻 Utilisation

### Mode développement
```powershell
npm run electron:dev
```
Cette commande lance Vite (serveur de développement) et Electron simultanément.

### Build de production
```powershell
npm run build
npm run package
```

## 📋 Fonctionnalités

- ✅ Créer et gérer des matchups
- ✅ Enregistrer les runes utilisées
- ✅ Prendre des notes sur les stratégies
- ✅ Filtrer par lane (Top, Jungle, Mid, ADC, Support)
- ✅ Éditer et supprimer des matchups
- ✅ Stockage local persistant

## 🛠️ Technologies

- **Electron** - Framework desktop
- **Svelte** - Interface utilisateur
- **Vite** - Build tool
- **electron-store** - Stockage de données

## 📁 Structure

```
leagueMatchupNote/
├── src/
│   ├── components/
│   │   ├── MatchupList.svelte
│   │   └── MatchupForm.svelte
│   ├── App.svelte
│   └── main.js
├── main.js (Electron main process)
├── preload.js (Electron preload)
├── index.html
├── vite.config.js
└── package.json
```
