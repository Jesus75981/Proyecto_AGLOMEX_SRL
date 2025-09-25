import React, { useState } from 'react';

// Componente principal de la página de finanzas
const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-6 sm:p-8">
        {/* Título de la página */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Tus Finanzas Personales</h1>
          <p className="text-gray-500 mt-2">Una vista simple de tus movimientos.</p>
        </div>

        {/* Contenido principal de la página */}
        <div className="p-6 bg-gray-50 rounded-lg border-dashed border-2 border-gray-200 text-center">
          <p className="text-gray-500 italic">No hay transacciones para mostrar por ahora.</p>
          <p className="text-gray-500 text-sm mt-2">Puedes empezar a agregar nuevas transacciones aquí.</p>
        </div>
      </div>
    </div>
  );
};

export default App;
