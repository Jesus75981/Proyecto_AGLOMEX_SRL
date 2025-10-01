// front-end/src/assets/pages/AdminCatalogPage.jsx
import React from 'react';

const AdminCatalogPage = ({ userRole }) => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">Administrar Catálogo</h1>
      <p>Módulo de administración de productos (Rol: {userRole})</p>
      {/* Tu contenido aquí */}
    </div>
  );
};

// ✅ IMPORTANTE: Export default
export default AdminCatalogPage;