const React = require('react');
const ReactDOM = require('react-dom');
const { App } = require('./App');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);