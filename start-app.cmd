@echo off
title WinDev Hub - Windows 11 App Lifecycle & Hot-Sync
cd /d "%~dp0"
echo ===================================================
echo   WinDev Hub - Windows 11 Local Orchestrator (2026)
echo ===================================================
echo [1/2] Starting backend & Vite services...
npm.cmd run desktop
pause
