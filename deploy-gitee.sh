#!/usr/bin/env sh

# Gitee Pages 一键部署脚本
# 使用方法：./deploy-gitee.sh <用户名> <仓库名>

# 确保脚本抛出遇到的错误
set -e

# 检查参数
if [ $# -eq 0 ]; then
    echo "使用方法: ./deploy-gitee.sh <用户名> <仓库名>"
    echo "例如: ./deploy-gitee.sh zhangsan langchain-zhcn-docs"
    exit 1
fi

USERNAME=$1
REPO=$2

echo "=========================================="
echo "🚀 开始部署到 Gitee Pages"
echo "=========================================="
echo "用户名: $USERNAME"
echo "仓库名: $REPO"
echo "部署地址: https://$USERNAME.gitee.io/$REPO"
echo "=========================================="

# 生成静态文件
echo "📦 构建项目..."
npm run build

# 进入生成的文件夹
cd docs/.vitepress/dist

echo "📁 初始化 Git 仓库..."
git init
git add -A
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M:%S')"

echo "🚀 推送到 Gitee..."
git push -f "git@gitee.com:$USERNAME/$REPO.git" master:gh-pages

echo "=========================================="
echo "✅ 部署完成！"
echo "=========================================="
echo "🔗 访问地址: https://$USERNAME.gitee.io/$REPO"
echo ""
echo "📋 下一步："
echo "1. 进入 Gitee 仓库 -> 服务 -> Gitee Pages"
echo "2. 选择 gh-pages 分支"
echo "3. 点击启动"
echo "=========================================="

cd -
