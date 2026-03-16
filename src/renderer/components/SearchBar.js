const React = require('react');

const SearchBar = ({ value, onChange, placeholder }) => {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || ''}
      style={{
        padding: '8px 12px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        minWidth: '300px',
        outline: 'none'
      }}
      onFocus={(e) => e.target.select()}
    />
  );
};

module.exports = SearchBar;