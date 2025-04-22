@echo off
set REDIS_PATH=c:\Users\goyal\OneDrive\Documents\server\redis
cd "%REDIS_PATH%" || (
    echo Failed to change directory to %REDIS_PATH%
    pause
    exit /b 1
)

if exist redis-server.exe (
    echo Found Redis server, starting...
    start /B redis-server.exe redis.conf
    echo Redis server started successfully
) else (
    echo Redis server not found at %REDIS_PATH%
    dir
    pause
    exit /b 1
)