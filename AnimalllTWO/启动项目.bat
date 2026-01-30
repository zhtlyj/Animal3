@echo off
chcp 65001 >nul
color 0A
title 动物保护平台 - 启动程序

echo ====================================
echo   动物保护公益与领养平台
echo   启动程序
echo ====================================
echo.

echo [1/2] 正在启动后端服务...
start "后端服务" cmd /k "cd /d "%~dp0backend" && echo 后端服务目录: %CD% && npm start"

timeout /t 3 /nobreak >nul

echo [2/2] 正在启动前端服务...
start "前端服务" cmd /k "cd /d "%~dp0frontend" && echo 前端服务目录: %CD% && npm start"

echo.
echo ====================================
echo   启动完成！
echo ====================================
echo.
echo 后端服务和前端服务已在新窗口中启动
echo.
echo 等待服务启动后（约10-20秒）：
echo   - 前端访问地址: http://localhost:3000
echo   - 后端API地址: http://localhost:5000
echo.
echo 如需停止服务，请关闭对应的命令行窗口
echo.
pause

