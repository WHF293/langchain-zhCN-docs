@echo off
REM Gitee Pages 一键部署脚本 (Windows)
REM 使用方法：deploy-gitee.bat <用户名> <仓库名>

setlocal enabledelayedexpansion

REM 检查参数
if "%~1"=="" (
    echo 使用方法: deploy-gitee.bat ^<用户名^> ^<仓库名^>
    echo 例如: deploy-gitee.bat zhangsan langchain-zhcn-docs
    pause
    exit /b 1
)

if "%~2"=="" (
    echo 使用方法: deploy-gitee.bat ^<用户名^> ^<仓库名^>
    echo 例如: deploy-gitee.bat zhangsan langchain-zhcn-docs
    pause
    exit /b 1
)

set USERNAME=%~1
set REPO=%~2

echo ==========================================
echo 🚀 开始部署到 Gitee Pages
echo ==========================================
echo 用户名: %USERNAME%
echo 仓库名: %REPO%
echo 部署地址: https://%USERNAME%.gitee.io/%REPO%
echo ==========================================

REM 构建项目
echo 📦 构建项目...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ 构建失败！
    pause
    exit /b 1
)

REM 进入构建目录
cd docs\.vitepress\dist

echo 📁 初始化 Git 仓库...
git init
git add -A
git commit -m "deploy: %date% %time%"

echo 🚀 推送到 Gitee...
git push -f "git@gitee.com:%USERNAME%/%REPO%.git" master:gh-pages

if %errorlevel% neq 0 (
    echo ❌ 推送失败！请检查 SSH 密钥配置
    pause
    exit /b 1
)

echo ==========================================
echo ✅ 部署完成！
echo ==========================================
echo 🔗 访问地址: https://%USERNAME%.gitee.io/%REPO%
echo.
echo 📋 下一步：
echo 1. 进入 Gitee 仓库 - 服务 - Gitee Pages
echo 2. 选择 gh-pages 分支
echo 3. 点击启动
echo ==========================================

cd ..\..\..
pause
