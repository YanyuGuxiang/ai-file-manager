# 百度翻译API集成实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为AI文件管理器添加百度翻译API功能，自动将非中文描述翻译为中文，并提供非阻塞式的翻译体验和增强的搜索功能。

**Architecture:** 扩展现有的translator.js模块实现百度翻译API调用，添加翻译缓存机制，并修改scanner.js以集成翻译功能。采用非阻塞UI更新模式，使用户在翻译进行时仍可操作界面。

**Tech Stack:** JavaScript, Node.js, Electron, React, Axios, js-yaml

---

## Chunk 1: 设计和实现翻译模块

### Task 1: 更新translator.js模块

**Files:**
- Modify: `src/renderer/utils/translator.js`

- [ ] **Step 1: 备份现有translator.js文件**

```bash
cp src/renderer/utils/translator.js src/renderer/utils/translator.js.backup
```

- [ ] **Step 2: 实现完整的translator.js模块，包含中文检测、API签名生成和翻译功能**

```javascript
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 中文检测函数
function detectLanguage(text) {
  // 检查是否包含中文字符
  const chineseRegex = /[\u4e00-\u9fa5]/;
  return chineseRegex.test(text) ? 'zh' : 'other';
}

// 生成百度翻译API的签名
function generateSign(appid, query, salt, secretKey) {
  const str = appid + query + salt + secretKey;
  return crypto.createHash('md5').update(str).digest('hex');
}

// 翻译文本的异步函数
async function translateText(text) {
  // 检查必要的环境变量
  const baiduAppid = process.env.BAIDU_TRANSLATE_APPID;
  const baiduSecret = process.env.BAIDU_TRANSLATE_SECRET;

  if (!baiduAppid || !baiduSecret) {
    console.warn('BAIDU_TRANSLATE_APPID 或 BAIDU_TRANSLATE_SECRET 环境变量未设置');
    return text; // 返回原文
  }

  try {
    const axios = require('axios');
    const salt = Date.now().toString();
    const sign = generateSign(baiduAppid, text, salt, baiduSecret);

    const params = new URLSearchParams({
      q: encodeURIComponent(text),
      from: 'auto',
      to: 'zh',
      appid: baiduAppid,
      salt: salt,
      sign: sign
    });

    const response = await axios.post(
      'https://fanyi-api.baidu.com/api/trans/vip/translate',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (response.data && response.data.trans_result) {
      return response.data.trans_result.map(item => item.dst).join('\n');
    } else {
      console.error('翻译API返回格式异常:', response.data);
      return text; // 返回原文
    }
  } catch (error) {
    console.error('翻译API调用失败:', error.message);
    return text; // 返回原文
  }
}

// 加载翻译缓存
function loadTranslationCache() {
  const cachePath = path.join(__dirname, '..', '..', '..', 'translation-cache.json');
  try {
    if (fs.existsSync(cachePath)) {
      const cacheData = fs.readFileSync(cachePath, 'utf8');
      return JSON.parse(cacheData);
    }
  } catch (error) {
    console.warn('加载翻译缓存失败:', error.message);
  }
  return {};
}

// 保存翻译缓存
function saveTranslationCache(cache) {
  const cachePath = path.join(__dirname, '..', '..', '..', 'translation-cache.json');
  try {
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('保存翻译缓存失败:', error.message);
  }
}

// 处理描述文本，根据需要进行翻译
async function processDescription(description) {
  if (!description) {
    return {
      original: '',
      translated: ''
    };
  }

  // 检测是否为中文
  if (detectLanguage(description) === 'zh') {
    return {
      original: description,
      translated: description // 如果已经是中文，则不翻译
    };
  }

  // 尝试从缓存中获取翻译结果
  const cache = loadTranslationCache();
  const cacheKey = description.trim(); // 使用原文本作为缓存键
  if (cache[cacheKey]) {
    return {
      original: description,
      translated: cache[cacheKey],
      fromCache: true
    };
  }

  // 调用API进行翻译
  const translatedText = await translateText(description);

  // 将新的翻译结果保存到缓存
  cache[cacheKey] = translatedText;
  saveTranslationCache(cache);

  return {
    original: description,
    translated: translatedText
  };
}

module.exports = {
  processDescription,
  detectLanguage,
  translateText,
  loadTranslationCache,
  saveTranslationCache
};
```

- [ ] **Step 3: 验证translator.js语法正确性**

```bash
node -c src/renderer/utils/translator.js
```

- [ ] **Step 4: 提交变更**

```bash
git add src/renderer/utils/translator.js
git commit -m "feat: 实现百度翻译API集成，包括翻译缓存和中文检测功能

- 实现百度翻译API签名生成
- 添加翻译缓存机制
- 实现中文检测逻辑
- 支持环境变量配置
- 实现错误处理返回原文"
```

### Task 2: 更新scanner.js模块以集成翻译功能

**Files:**
- Modify: `src/renderer/utils/scanner.js`

- [ ] **Step 1: 备份现有scanner.js文件**

```bash
cp src/renderer/utils/scanner.js src/renderer/utils/scanner.js.backup
```

- [ ] **Step 2: 实现集成翻译功能的scanner.js模块**

```javascript
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { processDescription } = require('./translator'); // 导入翻译功能

async function scanFiles(categories) {
  const results = {};

  for (const category of categories) {
    const categoryId = category.id;
    results[categoryId] = [];
    console.log(`\n=== 开始扫描类别: ${category.name} (${categoryId}) ===`);

    for (const searchPath of category.searchPaths) {
      console.log(`扫描路径: ${searchPath}`);
      if (!fs.existsSync(searchPath)) {
        console.warn(`路径不存在: ${searchPath}`);
        continue;
      }

      if (category.displayType === 'folder') {
        // 文件夹形式：扫描一级子文件夹
        const items = await scanFolderCategory(searchPath, category);
        console.log(`找到 ${items.length} 个文件夹`);
        results[categoryId].push(...items);
      } else if (category.displayType === 'file') {
        // 文件形式：递归扫描所有.md文件
        const items = await scanFileCategory(searchPath);
        console.log(`找到 ${items.length} 个文件`);
        results[categoryId].push(...items);
      }
    }
  }

  return results;
}

async function scanFolderCategory(searchPath, category) {
  const items = [];
  const folders = fs.readdirSync(searchPath, { withFileTent: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log(`  子文件夹数量: ${folders.length}`);

  for (const folderName of folders) {
    const folderPath = path.join(searchPath, folderName);
    const descriptionFile = category.descriptionFile || 'description.md';
    const descriptionFilePath = path.join(folderPath, descriptionFile);

    let description = folderName; // 默认使用文件夹名称

    console.log(`  检查文件夹: ${folderName}, 描述文件: ${descriptionFile}`);
    if (fs.existsSync(descriptionFilePath)) {
      console.log(`    找到描述文件: ${descriptionFilePath}`);
      try {
        const content = fs.readFileSync(descriptionFilePath, 'utf8');
        console.log(`    文件前100字符: ${content.substring(0, 100).replace(/\n/g, '\\n')}`);

        // 尝试解析YAML front matter（支持Windows和Unix换行符）
        const frontMatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

        if (frontMatterMatch) {
          console.log(`    匹配到YAML front matter`);
          const yamlStr = frontMatterMatch[1];

          try {
            // 尝试标准YAML解析
            const frontMatter = yaml.load(yamlStr);
            if (frontMatter && frontMatter.description) {
              description = frontMatter.description;
              console.log(`    [YAML解析成功] ${folderName}: ${description.substring(0, 50)}...`);
            }
          } catch (yamlError) {
            console.log(`    [YAML解析失败] ${folderName}, 尝试手动提取`);
            // YAML解析失败，尝试手动提取description字段
            const descMatch = yamlStr.match(/description:\s*(.+?)(?:\n\w+:|$)/s);
            if (descMatch) {
              description = descMatch[1].trim();
              console.log(`    [手动提取成功] ${folderName}: ${description.substring(0, 50)}...`);
            } else {
              console.log(`    [手动提取失败] ${folderName}, 使用文件夹名`);
            }
          }
        } else {
          console.log(`    未匹配到YAML front matter`);
        }
      } catch (error) {
        console.error(`    解析描述文件出错 ${descriptionFilePath}:`, error);
      }
    } else {
      console.log(`    未找到描述文件，使用文件夹名: ${folderName}`);
    }

    // 对描述进行翻译处理
    const translationResult = await processDescription(description);

    items.push({
      id: `${category.id}-${folderName}`,
      name: folderName,
      description: translationResult.translated,
      originalDescription: translationResult.original, // 保留原始描述用于搜索
      path: folderPath,
      type: 'folder',
      isTranslating: translationResult.fromCache ? undefined : true // 标记是否正在翻译（除非是从缓存获取的）
    });
  }

  return items;
}

async function scanFileCategory(searchPath) {
  const items = [];

  // 使用同步方式收集所有.md文件路径
  const mdFiles = [];

  function collectMdFiles(currentPath) {
    const dirents = fs.readdirSync(currentPath, { withFileTent: true });

    for (const dirent of dirents) {
      const fullPath = path.join(currentPath, dirent.name);

      if (dirent.isDirectory()) {
        // 递归扫描子目录
        collectMdFiles(fullPath);
      } else if (dirent.isFile() && path.extname(dirent.name) === '.md') {
        mdFiles.push(fullPath);
      }
    }
  }

  collectMdFiles(searchPath);

  // 处理所有收集到的文件
  for (const fullPath of mdFiles) {
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      let description = path.basename(fullPath, '.md'); // 默认使用文件名（不含扩展名）

      // 尝试解析YAML front matter
      const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

      if (frontMatterMatch) {
        const yamlStr = frontMatterMatch[1];
        const frontMatter = yaml.load(yamlStr);

        if (frontMatter && frontMatter.description) {
          description = frontMatter.description;
        }
      }

      // 对描述进行翻译处理
      const translationResult = await processDescription(description);

      items.push({
        id: `${path.basename(fullPath, '.md')}-${Date.now()}`,
        name: path.basename(fullPath, '.md'),
        description: translationResult.translated,
        originalDescription: translationResult.original, // 保留原始描述用于搜索
        path: fullPath,
        type: 'file',
        isTranslating: translationResult.fromCache ? undefined : true // 标记是否正在翻译（除非是从缓存获取的）
      });
    } catch (error) {
      console.error(`Error processing file ${fullPath}:`, error);
      // 继续处理其他文件
    }
  }

  return items;
}

module.exports = {
  scanFiles
};
```

- [ ] **Step 3: 验证scanner.js语法正确性**

```bash
node -c src/renderer/utils/scanner.js
```

- [ ] **Step 4: 提交变更**

```bash
git add src/renderer/utils/scanner.js
git commit -m "feat: 更新scanner模块以集成翻译功能

- 在扫描过程中调用翻译功能
- 添加originalDescription字段用于搜索
- 添加isTranslating状态标记"
```

## Chunk 2: 更新UI组件以支持翻译状态显示

### Task 3: 更新ResourceList组件以显示翻译状态

**Files:**
- Modify: `src/renderer/components/ResourceList.js`

- [ ] **Step 1: 备份现有ResourceList.js文件**

```bash
cp src/renderer/components/ResourceList.js src/renderer/components/ResourceList.js.backup
```

- [ ] **Step 2: 实现支持翻译状态显示的ResourceList组件**

```javascript
const React = require('react');

const ResourceList = ({ resources, onResourceClick, categoryName }) => {
  // 截取描述文本的函数
  const truncateDescription = (desc, maxLength = 100) => {
    if (!desc) return '';
    return desc.length > maxLength ? `${desc.substring(0, maxLength)}...` : desc;
  };

  return (
    <div>
      <div style={{ marginBottom: '15px' }}>
        <h2>{categoryName} ({resources.length})</h2>
      </div>

      {resources.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#999', paddingTop: '50px' }}>
          未找到资源
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '15px'
        }}>
          {resources.map((resource) => (
            <div
              key={resource.id}
              onClick={() => onResourceClick(resource)}
              style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
                opacity: resource.isTranslating ? 0.6 : 1, // 翻译时降低透明度
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
              title={`${resource.name}\n${resource.description}\n路径: ${resource.path}`} // 鼠标悬停显示完整信息
            >
              <div style={{ fontWeight: 'bold', marginBottom: '5px', wordBreak: 'break-word' }}>
                {resource.name}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: '#666',
                  marginBottom: '8px',
                  minHeight: '20px',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal'
                }}
                title={resource.description} // 鼠标悬停显示完整描述
              >
                {resource.isTranslating ? (
                  <span style={{ fontStyle: 'italic', color: '#888' }}>
                    {truncateDescription(resource.originalDescription || resource.description, 80)}
                    <span style={{ marginLeft: '5px', color: '#007acc' }}>正在翻译...</span>
                  </span>
                ) : (
                  truncateDescription(resource.description, 80)
                )}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#999',
                  wordBreak: 'break-all',
                  cursor: 'help' // 显示为帮助光标以提示有更多信息
                }}
                title={`完整路径: ${resource.path}`}
              >
                路径: {resource.path.length > 50 ? `${resource.path.substring(0, 50)}...` : resource.path}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

module.exports = ResourceList;
```

- [ ] **Step 3: 验证ResourceList.js语法正确性**

```bash
node -c src/renderer/components/ResourceList.js
```

- [ ] **Step 4: 提交变更**

```bash
git add src/renderer/components/ResourceList.js
git commit -m "feat: 更新ResourceList组件以显示翻译状态

- 添加翻译中的视觉提示
- 在资源项中显示翻译进度状态
- 优化UI以反映翻译状态"
```

### Task 4: 更新App.js以增强搜索功能支持翻译内容

**Files:**
- Modify: `src/renderer/App.js`

- [ ] **Step 1: 备份现有App.js文件**

```bash
cp src/renderer/App.js src/renderer/App.js.backup
```

- [ ] **Step 2: 实现增强搜索功能的App.js组件**

```javascript
const React = require('react');
const { useState, useEffect } = React;
const { ipcRenderer } = require('electron');

const CategoryList = require('./components/CategoryList');
const ResourceList = require('./components/ResourceList');
const SearchBar = require('./components/SearchBar');
const CategoryDialog = require('./components/CategoryDialog');

const App = () => {
  const [config, setConfig] = useState({ categories: [] });
  const [resources, setResources] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredResources, setFilteredResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // 加载配置
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const loadedConfig = await ipcRenderer.invoke('load-config');
        setConfig(loadedConfig);

        // 如果有类别，扫描资源
        if (loadedConfig.categories && loadedConfig.categories.length > 0) {
          const scannedResources = await ipcRenderer.invoke('scan-files', loadedConfig.categories);
          setResources(scannedResources);

          // 默认选择第一个类别
          if (loadedConfig.categories.length > 0) {
            setSelectedCategory(loadedConfig.categories[0]);
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();

    // 监听配置变化事件
    const handleConfigLoaded = (event, newConfig) => {
      setConfig(newConfig);
    };

    ipcRenderer.on('config-loaded', handleConfigLoaded);

    return () => {
      ipcRenderer.removeListener('config-loaded', handleConfigLoaded);
    };
  }, []);

  // 当选中类别变化或搜索查询变化时，更新过滤后的资源
  useEffect(() => {
    if (selectedCategory) {
      let categoryResources = resources[selectedCategory.id] || [];

      // 应用搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        categoryResources = categoryResources.filter(resource =>
          resource.name.toLowerCase().includes(query) ||
          resource.description.toLowerCase().includes(query) ||  // 翻译后的描述
          (resource.originalDescription && resource.originalDescription.toLowerCase().includes(query)) || // 原始描述
          resource.path.toLowerCase().includes(query)
        );
      }

      setFilteredResources(categoryResources);
    } else {
      setFilteredResources([]);
    }
  }, [selectedCategory, resources, searchQuery]);

  const handleRefresh = async () => {
    try {
      const updatedResources = await ipcRenderer.invoke('scan-files', config.categories);
      setResources(updatedResources);
    } catch (error) {
      console.error('Error refreshing resources:', error);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleSaveCategory = async (category) => {
    try {
      let updatedCategories;

      if (editingCategory) {
        // 更新现有类别
        updatedCategories = config.categories.map(cat =>
          cat.id === category.id ? category : cat
        );
      } else {
        // 添加新类别
        updatedCategories = [...config.categories, category];
      }

      const updatedConfig = { ...config, categories: updatedCategories };
      await ipcRenderer.invoke('save-config', updatedConfig);
      setConfig(updatedConfig);

      // 重新扫描资源
      const updatedResources = await ipcRenderer.invoke('scan-files', updatedConfig.categories);
      setResources(updatedResources);

      setIsDialogOpen(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      const updatedCategories = config.categories.filter(cat => cat.id !== categoryId);
      const updatedConfig = { ...config, categories: updatedCategories };
      await ipcRenderer.invoke('save-config', updatedConfig);
      setConfig(updatedConfig);

      // 从资源中移除该类别的数据
      const updatedResources = { ...resources };
      delete updatedResources[categoryId];
      setResources(updatedResources);

      // 如果删除的是当前选中的类别，则选择第一个可用类别
      if (selectedCategory && selectedCategory.id === categoryId) {
        if (updatedCategories.length > 0) {
          setSelectedCategory(updatedCategories[0]);
        } else {
          setSelectedCategory(null);
        }
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleResourceClick = (resource) => {
    ipcRenderer.invoke('show-item-in-folder', resource.path);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* 顶部工具栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px',
        backgroundColor: '#f0f2f5',
        borderBottom: '1px solid #ddd'
      }}>
        <h1 style={{ margin: 0, marginRight: 'auto' }}>AI 文件管理器</h1>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="搜索资源名称、描述或路径..."
        />

        <button
          onClick={handleRefresh}
          style={{
            marginLeft: '10px',
            padding: '5px 10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          刷新
        </button>

        <button
          onClick={() => {
            setEditingCategory(null);
            setIsDialogOpen(true);
          }}
          style={{
            marginLeft: '10px',
            padding: '5px 10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          设置
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 左侧类别列表 */}
        <div style={{
          width: '200px',
          borderRight: '1px solid #ddd',
          padding: '10px',
          backgroundColor: '#fafafa'
        }}>
          <CategoryList
            categories={config.categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            onAddCategory={handleAddCategory}
          />
        </div>

        {/* 右侧资源列表 */}
        <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
          {selectedCategory ? (
            <ResourceList
              resources={filteredResources}
              onResourceClick={handleResourceClick}
              categoryName={selectedCategory.name}
            />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '50px', color: '#999' }}>
              请选择一个类别以查看资源
            </div>
          )}
        </div>
      </div>

      {/* 类别配置对话框 */}
      {isDialogOpen && (
        <CategoryDialog
          category={editingCategory}
          onClose={() => {
            setIsDialogOpen(false);
            setEditingCategory(null);
          }}
          onSave={handleSaveCategory}
        />
      )}
    </div>
  );
};

module.exports = { App };
```

- [ ] **Step 3: 验证App.js语法正确性**

```bash
node -c src/renderer/App.js
```

- [ ] **Step 4: 提交变更**

```bash
git add src/renderer/App.js
git commit -m "feat: 更新App.js以支持翻译内容的搜索

- 修改搜索逻辑以同时搜索原始描述和翻译后的描述
- 确保用户可以用中文搜索原始为其他语言的内容"
```

## Chunk 3: 文档和测试验证

### Task 5: 创建环境变量配置说明文档

**Files:**
- Create: `docs/baidu-translate-setup.md`

- [ ] **Step 1: 创建百度翻译API配置说明文档**

```markdown
# 百度翻译API配置指南

## 环境变量配置

本项目使用百度翻译开放平台API，需要配置以下环境变量：

1. **BAIDU_TRANSLATE_APPID**: 百度翻译API的应用ID
2. **BAIDU_TRANSLATE_SECRET**: 百度翻译API的应用密钥

### Windows 系统设置环境变量

通过命令行设置（临时）：
```cmd
set BAIDU_TRANSLATE_APPID=your_app_id
set BAIDU_TRANSLATE_SECRET=your_secret_key
```

通过命令行设置（永久）：
```cmd
setx BAIDU_TRANSLATE_APPID "your_app_id"
setx BAIDU_TRANSLATE_SECRET "your_secret_key"
```

### 验证环境变量

启动应用前，请确保已正确设置环境变量。可以通过以下方式验证：

```cmd
echo %BAIDU_TRANSLATE_APPID%
echo %BAIDU_TRANSLATE_SECRET%
```

## 百度翻译API申请步骤

1. 访问 [百度翻译开放平台](https://api.fanyi.baidu.com/)
2. 注册账号并登录
3. 进入控制台，创建应用
4. 获取APP ID和密钥
5. 按照上面的方法设置环境变量

## 注意事项

- API调用可能产生费用，请注意查看百度翻译API的收费标准
- 确保网络连接正常，以便访问百度翻译API
- 如果环境变量未设置，应用将保留原始文本而不进行翻译
```

- [ ] **Step 2: 验证文档创建成功**

```bash
ls -l docs/baidu-translate-setup.md
```

- [ ] **Step 3: 提交文档**

```bash
git add docs/baidu-translate-setup.md
git commit -m "docs: 添加百度翻译API配置说明文档

- 介绍环境变量配置方法
- 提供API申请步骤
- 说明注意事项"
```

### Task 6: 验证整体实现

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 验证所有修改的文件语法正确**

```bash
node -c src/renderer/utils/translator.js
node -c src/renderer/utils/scanner.js
node -c src/renderer/components/ResourceList.js
node -c src/renderer/App.js
```

- [ ] **Step 2: 检查package.json中的axios依赖是否已存在**

```bash
grep -i axios package.json
```

- [ ] **Step 3: 如果axios未安装，则更新package.json**

```bash
# 检查当前package.json
cat package.json
```

- [ ] **Step 4: 提交最终验证**

```bash
git status
git add .
git commit -m "chore: 最终验证翻译功能集成

- 确认所有文件语法正确
- 确认依赖项配置正确
- 准备进行功能测试"
```