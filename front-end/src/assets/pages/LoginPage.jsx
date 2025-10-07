import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import aglomexLogo from '../images/aglomex8.jpg'; // Asegúrate de que la ruta sea correcta

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validación básica
    if (!username || !password) {
      setError('Por favor ingresa usuario y contraseña');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ CORRECCIÓN: usar data.user.rol en lugar de data.user.role
        const userRole = data.user.rol;
        
        // Guardar token en localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // ✅ CORRECCIÓN: Llamar a onLogin con el rol del usuario
        onLogin(userRole);
        
        // Redirigir al dashboard
        navigate('/home');
      } else {
        setError(data.message || 'Error en el login');
      }
    } catch (error) {
      console.error('Error de red:', error);
      setError('Error de conexión. Verifica que el servidor esté funcionando.');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para crear usuarios de prueba (si el servidor no responde)
  const createTestUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/create-test-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        alert('Usuarios de prueba creados exitosamente');
      } else {
        alert('Error creando usuarios de prueba');
      }
    } catch (error) {
      alert('No se pudo conectar al servidor para crear usuarios de prueba');
    }
  };

  // Función para ir al catálogo público
  const goToCatalog = () => {
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-gray-900 to-gray-700 font-sans">
      <div className="p-8 bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm border-2 border-gray-700">
        <div className="flex justify-center mb-6">
          {/* Muestra el logo de Aglomex */}
          <img 
            src={aglomexLogo} 
            alt="Logo Aglomex" 
            className="w-48 h-auto object-contain rounded-xl" 
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkxPR088L3RleHQ+PC9zdmc+';
            }}
          />
        </div>
        
        <h2 className="text-3xl font-extrabold text-white text-center mb-2">
          Iniciar Sesión
        </h2>
        
        <p className="text-gray-400 text-sm text-center mb-8">
          Accede a tu panel de gestión de Muebles 2025
        </p>
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-semibold mb-2" htmlFor="username">
              Nombre de Usuario
            </label>
            <input
              className="shadow-sm appearance-none border border-gray-700 bg-gray-900 rounded-lg w-full py-3 px-4 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              id="username"
              type="text"
              placeholder="dueno, tienda o stock"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-semibold mb-2" htmlFor="password">
              Contraseña
            </label>
            <input
              className="shadow-sm appearance-none border border-gray-700 bg-gray-900 rounded-lg w-full py-3 px-4 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              id="password"
              type="password"
              placeholder="admin123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm text-center">{error}</p>
            </div>
          )}
          
          <div className="flex items-center justify-center mb-4">
            <button
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Conectando...' : 'Entrar al Sistema'}
            </button>
          </div>
        </form>

        {/* Botón para ver catálogo público */}
        <div className="flex items-center justify-center mb-4">
          <button
            onClick={goToCatalog}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors duration-200 shadow-md"
            type="button"
          >
            Ver Catálogo Público
          </button>
        </div>

        {/* Información de usuarios de prueba */}
        <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
          <h3 className="text-white text-sm font-semibold mb-2 text-center">
            Usuarios de Prueba:
          </h3>
          <div className="text-xs text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Admin:</span>
              <span className="text-orange-400">dueno / admin123</span>
            </div>
            <div className="flex justify-between">
              <span>Ventas:</span>
              <span className="text-orange-400">tienda / admin123</span>
            </div>
            <div className="flex justify-between">
              <span>Inventario:</span>
              <span className="text-orange-400">stock / admin123</span>
            </div>
          </div>
          
          <button
            onClick={createTestUsers}
            className="w-full mt-3 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 py-1 px-2 rounded transition-colors duration-200"
            type="button"
          >
            Crear Usuarios de Prueba
          </button>
        </div>

        {/* Información de conexión */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Servidor: localhost:5000
          </p>
          <p className="text-xs text-gray-500">
            {isLoading ? 'Conectando al servidor...' : 'Servidor listo'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;