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