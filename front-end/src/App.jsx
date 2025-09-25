import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import HomePage from "./assets/pages/HomePage.jsx";
import VentasPage from "./assets/pages/VentasPage.jsx";
import LoginPage from "./assets/pages/LoginPage.jsx";
import AdminCatalogPage from "./assets/pages/AdminCatalogPage.jsx";
import ComprasPage from "./assets/pages/ComprasPage.jsx";
import FabricacionPage from "./assets/pages/FabricacionPage.jsx";
import ReporteVentasDiario from "./assets/pages/ReporteVentasDiario.jsx";
import InventarioPage from "./assets/pages/InventarioPage.jsx";
import FinanzasPage from "./assets/pages/FinanzasPage.jsx";

function App() {
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userRole && window.location.pathname !== '/login') {
      navigate('/login');
    }
  }, [userRole, navigate]);

  return (
    <div>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={setUserRole} />} />
        {userRole && (
          <>
            <Route path="/" element={<HomePage userRole={userRole} onLogout={() => setUserRole(null)} />} />
            <Route path="/ventas" element={<VentasPage userRole={userRole} />} />
            <Route path="/admin-catalogo" element={<AdminCatalogPage userRole={userRole} />} />
            <Route path="/compras" element={<ComprasPage userRole={userRole} />} />
            <Route path="/fabricacion" element={<FabricacionPage userRole={userRole} />} />
            <Route path="/reporte-ventas-diario" element={<ReporteVentasDiario userRole={userRole} />} />
            <Route path="/inventario" element={<InventarioPage userRole={userRole} />} />
            <Route path="/finanzas" element={<FinanzasPage userRole={userRole} />} />
          </>
        )}
      </Routes>
    </div>
  );
}

export default App;