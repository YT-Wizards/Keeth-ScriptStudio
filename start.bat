@echo off
title Script Studio
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js is not installed on this computer.
  echo   Please install the LTS version from https://nodejs.org
  echo   then double-click this file again.
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo First run - installing the app, this takes a few minutes. Please wait...
  call npm install
  if errorlevel 1 (
    echo Installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

if not exist client\dist (
  echo Preparing the app for first use...
  call npm run build
  if errorlevel 1 (
    echo Build failed. Try deleting the node_modules folder and running this file again.
    pause
    exit /b 1
  )
)

echo.
echo   Script Studio is starting...
echo   Your browser will open at http://localhost:3001
echo.
echo   KEEP THIS BLACK WINDOW OPEN while you use the app.
echo   To stop the app, simply close this window.
echo.
start "" http://localhost:3001
call npm start
