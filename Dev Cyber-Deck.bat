@echo off
title Cyber-Deck DEV
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0launch.ps1" dev
pause
