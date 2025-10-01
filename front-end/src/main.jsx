// front-end/src/main.jsx - CORREGIDO
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './assets/styles/aglomex.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />  {/* ✅ Ya NO necesita BrowserRouter aquí */}
  </React.StrictMode>
);