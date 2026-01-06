const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadMainPage: () => ipcRenderer.invoke('load-main-page'),
  togglePause: () => ipcRenderer.send('toggle-pause'),
  onStatusUpdate: (callback) => ipcRenderer.on('update-status', (_, data) => callback(data)),
  sendUsername: (username) => ipcRenderer.send('set-username', username),
  onScreenshot: (callback) => ipcRenderer.on('screenshot-taken', (e, path) => callback(path)),
  sendTokenToMain: (token) => ipcRenderer.send('session-token', token)
});
