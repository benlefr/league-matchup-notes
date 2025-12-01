const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getMatchups: () => ipcRenderer.invoke('get-matchups'),
  saveMatchup: (matchup) => ipcRenderer.invoke('save-matchup', matchup),
  updateMatchup: (matchup) => ipcRenderer.invoke('update-matchup', matchup),
  deleteMatchup: (id) => ipcRenderer.invoke('delete-matchup', id),
  
  // Auto-updater
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  
  // Écouter les événements de mise à jour
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_, info) => callback(info)),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_, progress) => callback(progress)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', () => callback()),
  onUpdateError: (callback) => ipcRenderer.on('update-error', (_, error) => callback(error))
});
