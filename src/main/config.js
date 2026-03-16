const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// 确定配置文件位置的函数
function getConfigPath() {
  const isPackaged = app.isPackaged;

  if (isPackaged) {
    const exeDir = path.dirname(process.execPath);
    return path.join(exeDir, 'config.json');
  } else {
    return path.join(process.cwd(), 'config.json');
  }
}

const CONFIG_FILE = getConfigPath();

const DEFAULT_CONFIG = {
  "categories": [
    {
      "id": "default",
      "name": "默认类别",
      "displayType": "file",
      "searchPaths": []
    }
  ]
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    } else {
      // 如果配置文件不存在，创建默认配置
      saveConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    console.error('Error loading config:', error);
    return DEFAULT_CONFIG;
  }
}

function saveConfig(config) {
  try {
    // 确保目录存在
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error saving config:', error);

    // 显示错误信息
    const { dialog } = require('electron');
    dialog.showErrorBox('保存失败', `无法保存配置文件：\n${error.message}\n\n目标路径：${CONFIG_FILE}`);

    return { success: false, error: error.message };
  }
}

module.exports = {
  loadConfig,
  saveConfig,
  CONFIG_FILE
};