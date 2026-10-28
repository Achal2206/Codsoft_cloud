@echo off
title CodSoft Cloud Computing Internship - All Tasks
echo ========================================================
echo Starting All 3 CodSoft Internship Tasks
echo Task 1: http://localhost:5001 (Cloud File Storage)
echo Task 3: http://localhost:5002 (Bus Ticket Reservation)
echo Task 5: http://localhost:5003 (Student Management System)
echo ========================================================

start cmd /k "title Task 1: Cloud File Storage && cd TASK-1_Cloud-File-Storage && node server.js"
start cmd /k "title Task 3: Bus Ticket Reservation && cd TASK-3_Bus-Ticket-Reservation && node server.js"
start cmd /k "title Task 5: Student Management System && cd TASK-5_Student-Management-System && node server.js"

timeout /t 3 >nul
start http://localhost:5001
start http://localhost:5002
start http://localhost:5003

echo All 3 tasks are running in background windows!
