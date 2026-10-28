@echo off
title CodSoft Task 1: Cloud File Storage System
echo ===================================================
echo Starting CodSoft Task 1: Cloud File Storage System
echo URL: http://localhost:5001
echo ===================================================
timeout /t 2 >nul
start http://localhost:5001
cd TASK-1_Cloud-File-Storage
node server.js
pause
