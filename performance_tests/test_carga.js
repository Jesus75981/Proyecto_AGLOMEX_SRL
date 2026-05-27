import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 20 },
    { duration: '20s', target: 50 },
    { duration: '5s', target: 0 },
  ],
};

const BASE_URL = 'http://localhost:5000/api';

export default function () {
  // --- 1. LOGIN (Obtener Token) ---
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    username: 'admin',
    password: 'admin123',
  }), { headers: { 'Content-Type': 'application/json' } });

  check(loginRes, { 'Login exitoso': (r) => r.status === 200 });
  
  const token = loginRes.json().token;
  const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

  sleep(1);

  // --- 2. PRUEBA DASHBOARD EJECUTIVO ---
  const dashRes = http.get(`${BASE_URL}/ventas/estadisticas?year=2025&period=year`, authHeaders);
  check(dashRes, { 'Dashboard (Ventas) cargó': (r) => r.status === 200 });

  const prodRes = http.get(`${BASE_URL}/produccion/estadisticas?year=2025&period=year`, authHeaders);
  check(prodRes, { 'Dashboard (Producción) cargó': (r) => r.status === 200 });

  sleep(1);

  // --- 3. PRUEBA FINANZAS ---
  const finRes = http.get(`${BASE_URL}/finanzas/estadisticas?year=2025&period=year`, authHeaders);
  check(finRes, { 'Módulo Finanzas cargó': (r) => r.status === 200 });

  sleep(1);

  // --- 4. PRUEBA LOGÍSTICA ---
  const logRes = http.get(`${BASE_URL}/logistica/estadisticas?year=2025&period=year`, authHeaders);
  check(logRes, { 'Módulo Logística cargó': (r) => r.status === 200 });

  sleep(2);
}
