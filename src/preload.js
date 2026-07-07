const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cursorApi', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (partial) => ipcRenderer.invoke('set-config', partial),
  getStatus: () => ipcRenderer.invoke('get-status'),
  onStatusUpdate: (callback) => ipcRenderer.on('status-update', (_e, data) => callback(data))
});
