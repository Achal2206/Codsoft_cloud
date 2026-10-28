@echo off
title CodSoft Task 3: Cloud Bus Ticket Reservation System
echo ========================================================
echo Starting CodSoft Task 3: Bus Ticket Reservation System
echo URL: http://localhost:5002
echo ========================================================
timeout /t 2 >nul
start http://localhost:5002
cd TASK-3_Bus-Ticket-Reservation
node server.js
pause
