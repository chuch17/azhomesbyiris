@echo off
title AZ Homes Iris - Static Server (3020)
cd /d %~dp0
echo Starting static server on port 3020...
echo If the server exits, any errors will remain visible below.
echo.
cmd /k node server.js
