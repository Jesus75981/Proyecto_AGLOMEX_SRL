// src/assets/components/App.jsx
import React, { useState } from 'react';
import VentasPage from '../pages/VentasPage';
import LoginPage from '../pages/LoginPage';
import AdminCatalogPage from '../pages/AdminCatalogPage';

function App() {
  const [userRole, setUserRole] = useState(null);

  const handleLogin = (role) => {
    setUserRole(role);
  };

  // Si no hay un rol de usuario, muestra la página de inicio de sesión
  if (!userRole) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Si el rol es "administrador", muestra el catálogo
  if (userRole === 'administrador') {
    return <AdminCatalogPage />;
  }

  // Si el rol es "vendedor", muestra la página de ventas
  if (userRole === 'vendedor') {
    return <VentasPage />;
  }
}

export default App;