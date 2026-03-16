const React = require('react');

const CategoryList = ({ categories, selectedCategory, onSelectCategory, onEditCategory, onDeleteCategory, onAddCategory }) => {
  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <strong>类别列表</strong>
      </div>

      {categories.map((category) => (
        <div
          key={category.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px',
            margin: '5px 0',
            backgroundColor: selectedCategory && selectedCategory.id === category.id ? '#d1e7ff' : 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          onClick={() => onSelectCategory(category)}
        >
          <span>{category.name}</span>
          <div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditCategory(category);
              }}
              style={{
                padding: '2px 5px',
                fontSize: '12px',
                marginRight: '5px',
                border: '1px solid #ccc',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              编辑
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCategory(category.id);
              }}
              style={{
                padding: '2px 5px',
                fontSize: '12px',
                border: '1px solid #ccc',
                borderRadius: '3px',
                cursor: 'pointer',
                backgroundColor: '#ffcccc'
              }}
            >
              删除
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddCategory();
        }}
        style={{
          width: '100%',
          padding: '8px',
          marginTop: '10px',
          border: '1px dashed #ccc',
          borderRadius: '4px',
          backgroundColor: '#f0f0f0',
          cursor: 'pointer'
        }}
      >
        + 新建
      </button>
    </div>
  );
};

module.exports = CategoryList;