@echo off
echo Starting KrishiSahAI LocalTunnel...
echo.
echo IMPORTANT: Make sure your Flask backend is running on port 5000 first!
echo.
npx localtunnel --port 5000 --subdomain krishisahai
pause
