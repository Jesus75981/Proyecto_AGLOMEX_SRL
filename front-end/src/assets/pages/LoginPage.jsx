// src/assets/pages/LoginPage.jsx
import React from 'react';

const LoginPage = ({ onLogin }) => {
  const handleLogin = (role) => {
    // En una aplicación real, aquí validarías usuario y contraseña
    // Por ahora, simplemente llamamos a la función con el rol
    onLogin(role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h1>
        <div className="space-y-4">
          <button
            onClick={() => handleLogin('administrador')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition-colors"
          >
            Ingresar como Administrador
          </button>
          <button
            onClick={() => handleLogin('vendedor')}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition-colors"
          >
            Ingresar como Usuario de Tienda
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;