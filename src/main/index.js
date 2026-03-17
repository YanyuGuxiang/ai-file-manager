require('dotenv').config(); // 加载环境变量
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { scanFiles } = require('../renderer/utils/scanner');
const { loadConfig, saveConfig } = require('./config'); // 使用主进程专用的配置模块

// 设置userData路径到exe同级目录
if (app.isPackaged) {
  const exeDir = path.dirname(process.execPath);
  app.setPath('userData', path.join(exeDir, 'data'));
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../../build/icon.png') // 如果有图标的话
  });

  // 添加F12快捷键打开开发者工具
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // 加载React应用
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    // 开发环境下打开开发者工具
    mainWindow.webContents.openDevTools();
  }

  // 当窗口准备就绪时，发送配置数据
  mainWindow.webContents.on('dom-ready', () => {
    const config = loadConfig();
    mainWindow.webContents.send('config-loaded', config);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for file operations
ipcMain.handle('load-config', async () => {
  return loadConfig();
});

ipcMain.handle('save-config', async (event, config) => {
  return saveConfig(config);
});

ipcMain.handle('scan-files', async (event, categories) => {
  return scanFiles(categories);
});

ipcMain.handle('show-item-in-folder', async (event, filePath) => {
  shell.showItemInFolder(filePath);
});