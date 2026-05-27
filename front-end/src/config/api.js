// Detecta dinámicamente el origen para que funcione tanto en localhost como en red local (IP).
// Vite se encarga de redirigir (proxy) las llamadas de /api, /uploads, y /models al backend en el puerto 5000.
const getBackendUrl = () => {
    return window.location.origin;
};

export const API_BASE_URL = getBackendUrl();
export const API_URL = `${API_BASE_URL}/api`;
