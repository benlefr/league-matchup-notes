const { app, BrowserWindow, ipcMain } = require('electron');
const { join } = require('path');
const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');

const store = new Store();

// Configuration de l'auto-updater
autoUpdater.autoDownload = false; // Demander avant de télécharger
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    icon: join(__dirname, 'assets', 'Icon.png'),
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  // Vérifier les mises à jour au démarrage (seulement en production)
  if (app.isPackaged) {
    autoUpdater.checkForUpdates();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers pour les matchups
ipcMain.handle('get-matchups', () => {
  return store.get('matchups', []);
});

ipcMain.handle('save-matchup', (event, matchup) => {
  const matchups = store.get('matchups', []);
  matchup.id = Date.now().toString();
  matchup.createdAt = new Date().toISOString();
  matchups.push(matchup);
  store.set('matchups', matchups);
  return matchup;
});

ipcMain.handle('update-matchup', (event, updatedMatchup) => {
  const matchups = store.get('matchups', []);
  const index = matchups.findIndex(m => m.id === updatedMatchup.id);
  if (index !== -1) {
    matchups[index] = { ...matchups[index], ...updatedMatchup };
    store.set('matchups', matchups);
    return matchups[index];
  }
  return null;
});

ipcMain.handle('delete-matchup', (event, id) => {
  const matchups = store.get('matchups', []);
  const filtered = matchups.filter(m => m.id !== id);
  store.set('matchups', filtered);
  return true;
});

// ============ Auto-Updater Events ============

// Quand une mise à jour est disponible
autoUpdater.on('update-available', (info) => {
  mainWindow.webContents.send('update-available', {
    version: info.version,
    releaseNotes: info.releaseNotes
  });
});

// Quand aucune mise à jour n'est disponible
autoUpdater.on('update-not-available', () => {
  console.log('Aucune mise à jour disponible');
});

// Progression du téléchargement
autoUpdater.on('download-progress', (progressObj) => {
  mainWindow.webContents.send('download-progress', {
    percent: Math.round(progressObj.percent),
    transferred: progressObj.transferred,
    total: progressObj.total
  });
});

// Mise à jour téléchargée et prête
autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update-downloaded');
});

// Erreur lors de la mise à jour
autoUpdater.on('error', (error) => {
  console.error('Erreur de mise à jour:', error);
  mainWindow.webContents.send('update-error', error.message);
});

// IPC Handlers pour les actions de mise à jour
ipcMain.handle('download-update', () => {
  autoUpdater.downloadUpdate();
  return true;
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
  return true;
});

ipcMain.handle('check-for-updates', () => {
  if (app.isPackaged) {
    autoUpdater.checkForUpdates();
  }
  return true;
});
