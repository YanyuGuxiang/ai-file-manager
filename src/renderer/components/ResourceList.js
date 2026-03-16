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