@echo off
echo 正在启动前端服务...
cd /d "D:\Animal Protection毕业设计\Animal Protection毕业设计\frontend"
echo 当前目录: %CD%
echo.
echo 检查依赖...
if not exist "node_modules" (
    echo 依赖未安装，正在安装...
    call npm install
)
echo.
echo 启动React应用...
npm start
pause

