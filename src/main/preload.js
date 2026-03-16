const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  loadConfig: () => ipcRenderer.invoke('load-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  scanFiles: (categories) => ipcRenderer.invoke('scan-files', categories),
  showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),
  onConfigLoaded: (callback) => ipcRenderer.on('config-loaded', callback)
});