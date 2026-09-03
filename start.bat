@echo off
rem ── A-Level Hub launcher (Windows) ─────────────────────────────────────
rem Double-click this file (or run `start.bat` from a terminal) to start
rem the site at http://localhost:3000.
rem Optional first argument: port number, e.g. `start.bat 4000`.
setlocal
cd /d "%~dp0"

if not "%1"=="" (set "PORT=%1") else (set "PORT=3000")

rem Use the bundled portable Node (this machine may not have Node installed).
if exist "%~dp0.tools\node\npm.cmd" (
    set "PATH=%~dp0.tools\node;%PATH%"
    set "NPM=npm.cmd"
) else (
    set "NPM=npm"
)

echo Starting A-Level Hub on http://localhost:%PORT% ...
echo (press Ctrl+C to stop)
call %NPM% run dev -- -p %PORT%
if errorlevel 1 (
    echo.
    echo The server failed to start.
    echo If you see "npm is not recognized", install Node.js 22 from https://nodejs.org
    pause
)
endlocal
