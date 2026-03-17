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

  const [isSaving, setIsSaving] = useState(false); // 添加保存状态

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 确保ID始终存在
    const finalData = {
      ...formData,
      id: formData.id || Date.now().toString()
    };

    setIsSaving(true); // 设置保存状态

    try {
      await onSave(finalData); // 等待保存完成
    } finally {
      setIsSaving(false); // 重置保存状态
    }

    // 仅在保存成功后关闭对话框
    onClose();
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
        overflowY: 'auto',
        position: 'relative' // 为加载遮罩添加相对定位
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
              disabled={isSaving} // 保存时禁用输入
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
                  disabled={isSaving} // 保存时禁用输入
                />
                文件夹形式
              </label>
              <label>
                <input
                  type="radio"
                  checked={formData.displayType === 'file'}
                  onChange={() => handleChange('displayType', 'file')}
                  disabled={isSaving} // 保存时禁用输入
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
                disabled={isSaving} // 保存时禁用输入
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
                disabled={isSaving} // 保存时禁用输入
              />
              <button
                type="button"
                onClick={handleAddPath}
                disabled={isSaving} // 保存时禁用按钮
                style={{
                  padding: '8px 15px',
                  border: '1px solid #ccc',
                  borderTop: '1px solid #ccc',
                  borderBottom: '1px solid #ccc',
                  borderLeft: 'none',
                  borderRadius: '0 4px 4px 0',
                  backgroundColor: isSaving ? '#e0e0e0' : '#f0f0f0', // 保存时显示灰色
                  cursor: isSaving ? 'not-allowed' : 'pointer'
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
                    disabled={isSaving} // 保存时禁用按钮
                    style={{
                      padding: '2px 8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      backgroundColor: isSaving ? '#e0e0e0' : '#ffebee', // 保存时显示灰色
                      cursor: isSaving ? 'not-allowed' : 'pointer'
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
              disabled={isSaving} // 保存时禁用按钮
              style={{
                padding: '8px 16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: isSaving ? 'not-allowed' : 'pointer'
              }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSaving} // 保存时禁用按钮
              style={{
                padding: '8px 16px',
                backgroundColor: isSaving ? '#cccccc' : '#1890ff', // 保存时显示灰色
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                position: 'relative'
              }}
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>

        {/* 保存时显示加载遮罩 */}
        {isSaving && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1001,
            borderRadius: '8px'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '20px'
            }}>
              <div style={{
                fontSize: '16px',
                marginBottom: '10px'
              }}>
                正在保存并处理资源...
              </div>
              <div style={{
                fontSize: '14px',
                color: '#666'
              }}>
                扫描并翻译资源可能需要一些时间
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

module.exports = CategoryDialog;