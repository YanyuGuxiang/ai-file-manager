const fs = require('fs');
const path = require('path');

// 根据环境决定配置文件位置
const isDev = !require.main.filename.includes('app.asar');
const CONFIG_FILE = isDev
  ? path.join(process.cwd(), 'config.json')  // 开发环境中使用当前目录
  : path.join(path.dirname(require.main.filename), 'config.json'); // 生产环境中使用exe同目录

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
    return { success: false, error: error.message };
  }
}

module.exports = {
  loadConfig,
  saveConfig,
  CONFIG_FILE
};