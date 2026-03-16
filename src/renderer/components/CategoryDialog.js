const React = require('react');
const { useState, useEffect } = React;

const CategoryDialog = ({ category, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    displayType: 'file',
    descriptionFile: 'description.md',
    searchPaths: []
  });

  const [newPath, setNewPath] = useState('');

  useEffect(() => {
    if (category) {
      setFormData({
        id: category.id || '',
        name: category.name || '',
        displayType: category.displayType || 'file',
        descriptionFile: category.descriptionFile || 'description.md',
        searchPaths: category.searchPaths || []
      });
    } else {
      // 新建类别时设置默认值
      setFormData({
        id: Date.now().toString(),
        name: '',
        displayType: 'file',
        descriptionFile: 'description.md',
        searchPaths: []
      });
    }
  }, [category]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddPath = () => {
    if (newPath.trim() && !formData.searchPaths.includes(newPath.trim())) {
      setFormData(prev => ({
        ...prev,
        searchPaths: [...prev.searchPaths, newPath.trim()]
      }));
      setNewPath('');
    }
  };

  const handleRemovePath = (index) => {
    setFormData(prev => ({
      ...prev,
      searchPaths: prev.searchPaths.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 确保ID始终存在
    const finalData = {
      ...formData,
      id: formData.id || Date.now().toString()
    };

    onSave(finalData);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '500px',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <h2>{category ? '编辑类别' : '新建类别'}</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>类别名称:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>展示类型:</label>
            <div>
              <label style={{ marginRight: '15px' }}>
                <input
                  type="radio"
                  checked={formData.displayType === 'folder'}
                  onChange={() => handleChange('displayType', 'folder')}
                />
                文件夹形式
              </label>
              <label>
                <input
                  type="radio"
                  checked={formData.displayType === 'file'}
                  onChange={() => handleChange('displayType', 'file')}
                />
                文件形式
              </label>
            </div>
          </div>

          {formData.displayType === 'folder' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>描述文件名:</label>
              <input
                type="text"
                value={formData.descriptionFile}
                onChange={(e) => handleChange('descriptionFile', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>搜索路径:</label>

            <div style={{ display: 'flex', marginBottom: '10px' }}>
              <input
                type="text"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                placeholder="输入路径，例如: C:\Users\..."
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px 0 0 4px'
                }}
              />
              <button
                type="button"
                onClick={handleAddPath}
                style={{
                  padding: '8px 15px',
                  border: '1px solid #ccc',
                  borderTop: '1px solid #ccc',
                  borderBottom: '1px solid #ccc',
                  borderLeft: 'none',
                  borderRadius: '0 4px 4px 0',
                  backgroundColor: '#f0f0f0',
                  cursor: 'pointer'
                }}
              >
                添加路径
              </button>
            </div>

            <div>
              {formData.searchPaths.map((path, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '5px',
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #eee',
                  borderRadius: '4px',
                  marginBottom: '5px'
                }}>
                  <span style={{ wordBreak: 'break-all', flex: 1 }}>{path}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePath(index)}
                    style={{
                      padding: '2px 8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      backgroundColor: '#ffebee',
                      cursor: 'pointer'
                    }}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

module.exports = CategoryDialog;