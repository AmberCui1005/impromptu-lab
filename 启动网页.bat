@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   Starting local server for speech recognition...
echo.
node serve.js
echo.
echo   Server stopped. Press any key to close.
pause >nul
