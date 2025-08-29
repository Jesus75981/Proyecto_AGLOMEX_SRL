import React from "react";

function LoginPage() {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-xl p-8 w-96">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">Iniciar Sesión</h1>
        <form className="flex flex-col space-y-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
