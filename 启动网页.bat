@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   Starting page (localhost:8080) + AI proxy (localhost:8787)...
echo.
node serve.js
echo.
echo   Server stopped. Press any key to close.
pause >nul
