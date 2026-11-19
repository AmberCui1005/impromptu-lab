@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   Starting CORS proxy on http://localhost:8787/v1 ...
echo   Edit proxy.config.json first if you have not.
echo.
node proxy.js
echo.
echo   Proxy stopped. Press any key to close.
pause >nul
