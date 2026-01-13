
// Detecta dinámicamente la IP del servidor backend.
// Asume que el backend corre en el puerto 5000 de la misma máquina que sirve el frontend.
const getBackendUrl = () => {
    const hostname = window.location.hostname;
    return `http://${hostname}:5000`;
};

export const API_BASE_URL = getBackendUrl();
export const API_URL = `${API_BASE_URL}/api`;
