@echo off
title CodSoft Task 5: Cloud Student Management System
echo ========================================================
echo Starting CodSoft Task 5: Student Management System
echo URL: http://localhost:5003
echo ========================================================
timeout /t 2 >nul
start http://localhost:5003
cd TASK-5_Student-Management-System
node server.js
pause
