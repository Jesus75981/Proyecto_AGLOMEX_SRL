import React, { useState } from 'react';
import { API_URL, API_BASE_URL } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import aglomexLogo from '../images/aglomex6.jpg'; // Asegúrate de que la ruta sea correcta

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
      const response = await fetch(`${API_URL}/auth/login`, {
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
      const response = await fetch(`${API_URL}/auth/create-test-users`, {
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
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 font-sans">
      <div className="p-8 bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200">
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

        <h2 className="text-3xl font-extrabold text-gray-800 text-center mb-2">
          Iniciar Sesión
        </h2>

        <p className="text-gray-600 text-sm text-center mb-8">
          Accede a tu panel de gestión de Muebles
        </p>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="username">
              Nombre de Usuario
            </label>
            <input
              className="shadow-sm appearance-none border border-gray-300 bg-white rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
              id="username"
              type="text"
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
              Contraseña
            </label>
            <input
              className="shadow-sm appearance-none border border-gray-300 bg-white rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
              id="password"
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-center mb-4">
            <button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition-colors duration-200 shadow-sm"
            type="button"
          >
            Ver la página inicial
          </button>
        </div>

        {/* Información de usuarios de prueba - REMOVIDO POR SEGURIDAD */}
        {/* <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700"> ... </div> */}

        {/* Información de conexión */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Servidor: {API_BASE_URL}
          </p>
          <p className="text-xs text-gray-400">
            {isLoading ? 'Conectando al servidor...' : 'Servidor listo'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;