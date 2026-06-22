@echo off
REM Gitee Pages 部署脚本 (Windows)

echo 开始构建项目...
call npm run build

if %errorlevel% neq 0 (
    echo 构建失败！
    exit /b 1
)

echo 构建完成！
echo 进入构建目录...

cd docs\.vitepress\dist

echo 初始化 Git 仓库...
git init
git add -A
git commit -m "deploy"

echo 推送到 Gitee...
REM 请将 <USERNAME> 和 <REPO> 替换为你的 Gitee 用户名和仓库名
REM git push -f git@gitee.com:<USERNAME>/<REPO>.git master:gh-pages

echo 部署完成！
echo 请在 Gitee Pages 设置中部署 gh-pages 分支

cd ..\..\..
pause
