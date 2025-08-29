import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from "./assets/pages/HomePage.jsx";
import VentasPage from "./assets/pages/VentasPage.jsx";
import LoginPage from "./assets/pages/LoginPage.jsx";
import AdminCatalogPage from "./assets/pages/AdminCatalogPage.jsx";
import ComprasPage from "./assets/pages/ComprasPage.jsx";
import FabricacionPage from "./assets/pages/FabricacionPage.jsx";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ventas" element={<VentasPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin-catalogo" element={<AdminCatalogPage />} />
        <Route path="/compras" element={<ComprasPage />} />
        <Route path="/fabricacion" element={<FabricacionPage />} />
      </Routes>
    </div>
  );
}

export default App;
