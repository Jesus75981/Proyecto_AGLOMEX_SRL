import React, { useState } from 'react';
import { API_URL, API_BASE_URL } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import aglomexLogo from '../images/aglomex6.jpg'; // Asegúrate de que la ruta sea correcta

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        setError(data.error || data.message || 'Error en el login');
      }
    } catch (error) {
      console.error('Error de red:', error);
      setError('Error de conexión. Verifica que el servidor esté funcionando.');
    } finally {
      setIsLoading(false);
    }
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
            <div className="relative">
              <input
                className="shadow-sm appearance-none border border-gray-300 bg-white rounded-lg w-full py-3 pl-4 pr-12 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-orange-500 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
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






      </div>
    </div>
  );
};

export default LoginPage;