@echo off
TITLE Iniciando Sistema de Muebles
echo ====================================================
echo      INICIANDO SISTEMA DE GESTION DE MUEBLES
echo ====================================================
echo.

echo 1. Iniciando Servidor Backend (Base de Datos y API)...
start "Backend Muebles" cmd /k "cd back-end && npm run dev"

echo 2. Esperando 5 segundos para que arranque el servidor...
timeout /t 5 /nobreak >nul

echo 3. Iniciando Interfaz de Usuario (Frontend)...
start "Frontend Muebles" cmd /k "cd front-end && npm run dev -- --host"

echo 4. Abriendo el navegador...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ====================================================
echo             SISTEMA INICIADO EXITOSAMENTE
echo    No cierres las ventanas negras de fondo.
echo    Para cerrar el sistema, cierra esas ventanas.
echo ====================================================
pause
exit
