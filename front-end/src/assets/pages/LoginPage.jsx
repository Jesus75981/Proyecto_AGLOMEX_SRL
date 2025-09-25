import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import aglomexLogo from '../images/aglomex8.jpg'; // Asegúrate de que la ruta sea correcta

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(data.user.role);
        navigate('/');
      } else {
        const errorData = await response.json();
        setError(errorData.message);
      }
    } catch (error) {
      console.error('Error de red:', error);
      setError('Error de conexión. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-gray-900 to-gray-700 font-sans">
      <div className="p-8 bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm border-2 border-gray-700">
        <div className="flex justify-center mb-6">
          {/* Muestra el logo de Aglomex */}
          <img src={aglomexLogo} alt="Logo Aglomex" className="w-48 h-auto object-contain rounded-xl" />
        </div>
        <h2 className="text-3xl font-extrabold text-white text-center mb-2">Iniciar Sesión</h2>
        <p className="text-gray-400 text-sm text-center mb-8">
          Accede a tu panel de gestión de Muebles 2025.
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
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-red-400 text-sm italic mb-4 text-center">{error}</p>}
          <div className="flex items-center justify-center">
            <button
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-colors duration-200 shadow-md"
              type="submit"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;