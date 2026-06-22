#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

# 生成静态文件
npm run build

# 进入生成的文件夹
cd docs/.vitepress/dist

git init
git add -A
git commit -m 'deploy'

# 发布到 https://<USERNAME>.gitee.io/<REPO>
# 如果是发布到 https://<USERNAME>.gitee.io
# git push -f git@gitee.com:<USERNAME>/<USERNAME>.gitee.io.git master

# 如果是发布到 https://<USERNAME>.gitee.io/<REPO>
git push -f git@gitee.com:<USERNAME>/<REPO>.git master:gh-pages

cd -
