# 五子棋游戏部署指南

## 问题解答

### 1. 为什么每次构建会生成新的 `main.xxx.js` 文件？

这是 **Webpack 的缓存破坏（Cache Busting）机制**：

```
main.[contenthash:8].js
└─ 6d39045b 是根据文件内容生成的哈希值
```

**目的**：
- ✅ 强制浏览器更新（文件名不同，浏览器不使用缓存）
- ✅ CDN 友好（可同时存在多个版本，回滚方便）
- ✅ 增量更新（只有变化的文件需要重新下载）

### 2. 这些文件是否需要提交到 Git？

**答案：不需要！** 构建产物应该被 `.gitignore` 忽略。

**已配置的忽略规则**：
- ✅ 主项目 `.gitignore`：`static/gobang/`
- ✅ 子模块 `.gitignore`：`/build`

### 3. 对服务器部署的影响

**正确做法**：
1. ✅ 只提交**源代码**到 Git
2. ✅ 在服务器上运行部署脚本，重新构建
3. ✅ 部署脚本会自动清理旧文件

**错误做法**：
- ❌ 提交构建产物到 Git（增加仓库大小）
- ❌ 手动复制文件（容易遗漏，导致旧文件堆积）
- ❌ 不清理旧文件（浪费服务器空间）

---

## 本地开发部署

### Windows 系统

```bash
# 进入项目目录
cd external\gobang

# 运行部署脚本
deploy.bat
```

### Linux/Mac/Git Bash

```bash
# 进入项目目录
cd external/gobang

# 运行部署脚本
bash deploy.sh
```

### 手动部署（不推荐）

```bash
cd external/gobang
npm run build
rm -rf ../../static/gobang/*
cp -r build/* ../../static/gobang/
```

---

## 服务器部署流程

### 方案1：手动部署（适合小型项目）

```bash
# 1. 拉取最新代码
git pull origin feat_游戏_五子棋

# 2. 初始化子模块（如果需要）
git submodule update --init --recursive

# 3. 进入子模块目录
cd external/gobang

# 4. 安装依赖（首次部署或依赖变化时）
npm install

# 5. 运行部署脚本
bash deploy.sh  # Linux/Mac
# 或
deploy.bat     # Windows

# 6. 重启 Django 应用（如果需要）
# systemctl restart myapp.service  # Linux
# 或直接重启 runserver
```

### 方案2：自动化部署脚本

创建 `deploy-production.sh`：

```bash
#!/bin/bash
set -e

APP_DIR="/path/to/EbbinghausAnywhere"
VENV_DIR="$APP_DIR/.conda"
PYTHON="$VENV_DIR/python.exe"

echo "=========================================="
echo "  五子棋游戏生产环境部署"
echo "=========================================="

# 1. 拉取最新代码
echo "[1/6] 拉取最新代码..."
cd "$APP_DIR"
git pull origin feat_游戏_五子棋

# 2. 更新子模块
echo "[2/6] 更新子模块..."
git submodule update --init --recursive

# 3. 构建前端
echo "[3/6] 构建五子棋游戏..."
cd "$APP_DIR/external/gobang"
bash deploy.sh

# 4. 收集静态文件（Django）
echo "[4/6] 收集静态文件..."
cd "$APP_DIR"
"$PYTHON" manage.py collectstatic --noinput

# 5. 运行数据库迁移（如果有）
echo "[5/6] 运行数据库迁移..."
"$PYTHON" manage.py migrate

# 6. 重启应用
echo "[6/6] 重启应用..."
# systemctl restart myapp.service
# 或使用其他重启方式

echo "=========================================="
echo "部署完成！"
echo "=========================================="
```

### 方案3：CI/CD 自动部署（推荐）

**GitHub Actions 示例**：

```yaml
name: Deploy Gobang Game

on:
  push:
    branches:
      - feat_游戏_五子棋
    paths:
      - 'external/gobang/src/**'
      - 'external/gobang/package.json'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          submodules: recursive

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: ./external/gobang
        run: npm ci

      - name: Build game
        working-directory: ./external/gobang
        run: npm run build

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /path/to/EbbinghausAnywhere
            git pull
            cd external/gobang
            rm -rf ../../static/gobang/*
            cp -r build/* ../../static/gobang/
            # 重启应用
            systemctl restart myapp.service
```

---

## 部署脚本说明

### `deploy.sh` / `deploy.bat` 功能

| 步骤 | 操作 | 说明 |
|------|------|------|
| 1/5 | 清理旧构建 | 删除 `build/` 目录 |
| 2/5 | 清理目标目录 | 删除 `static/gobang/` 下的旧文件 |
| 3/5 | 检查依赖 | 确保 `node_modules` 存在 |
| 4/5 | 构建生产版本 | 运行 `npm run build` |
| 5/5 | 复制文件 | 将构建产物复制到 `static/gobang/` |

### 脚本优势

- ✅ **自动化**：一键完成所有步骤
- ✅ **清理旧文件**：避免磁盘空间浪费
- ✅ **错误处理**：遇到错误立即退出
- ✅ **跨平台**：支持 Windows 和 Linux/Mac

---

## 常见问题

### Q1: 为什么要清理旧文件？

**A**:
- 避免磁盘空间浪费（每个版本约 3MB）
- 避免部署时传输无用文件
- 避免浏览器加载错误版本的文件

### Q2: 如何回滚到之前的版本？

**A**:
```bash
# 方法1：Git 回退
git checkout <previous-commit>
cd external/gobang && bash deploy.sh

# 方法2：保留旧版本的 build/ 目录
cp -r build/ build.backup/
# 需要回滚时
cp -r build.backup/ build/
```

### Q3: 如何验证部署成功？

**A**:
1. 检查文件大小：`du -sh static/gobang/`（应该约 3-4MB）
2. 检查文件数量：`ls static/gobang/static/js/main.*.js`（应该只有 1 个）
3. 浏览器刷新游戏，检查功能正常

### Q4: 构建失败怎么办？

**A**:
1. 检查 Node.js 版本：`node --version`（建议 >= 16）
2. 删除 `node_modules` 重新安装：`rm -rf node_modules && npm install`
3. 查看错误日志：`npm run build 2>&1 | tee build.log`

### Q5: 如何在多台服务器上部署？

**A**:
```bash
# 使用 SSH 批量部署
for server in server1.example.com server2.example.com; do
    ssh $server "cd /path/to/app && git pull && cd external/gobang && bash deploy.sh"
done
```

---

## 性能优化建议

### 1. 启用 Gzip 压缩

**Nginx 配置**：
```nginx
location /static/ {
    gzip on;
    gzip_types application/javascript text/css;
    gzip_min_length 1000;
}
```

**效果**：将 585KB 的 JS 文件压缩到 ~192KB

### 2. 设置浏览器缓存

**Nginx 配置**：
```nginx
location /static/gobang/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**说明**：由于文件名包含哈希值，可以安全地设置长期缓存

### 3. 使用 CDN

将 `static/gobang/` 部署到 CDN（如阿里云 OSS、腾讯云 COS）：
```python
# Django settings.py
STATIC_URL = 'https://cdn.example.com/static/'
```

---

## 监控和日志

### 构建日志

```bash
# 保存构建日志
npm run build 2>&1 | tee logs/build-$(date +%Y%m%d-%H%M%S).log
```

### 部署监控

创建 `monitor-deploy.sh`：
```bash
#!/bin/bash
# 监控部署脚本
LOG_FILE="/var/log/gobang-deploy.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Starting deployment..." >> $LOG_FILE

# 执行部署
bash deploy.sh >> $LOG_FILE 2>&1

if [ $? -eq 0 ]; then
    echo "[$DATE] Deployment successful" >> $LOG_FILE
    # 发送成功通知
else
    echo "[$DATE] Deployment FAILED" >> $LOG_FILE
    # 发送失败通知
fi
```

---

## 总结

### 推荐工作流

```
开发阶段：
1. 修改源代码 (src/)
2. 运行部署脚本
3. 本地测试

提交阶段：
1. Git 提交源代码（不提交构建产物）
2. 推送到远程仓库

服务器部署：
1. 拉取最新代码
2. 运行部署脚本
3. 重启应用
```

### 关键要点

- ✅ **源代码管理**：只提交源代码到 Git
- ✅ **构建产物**：通过部署脚本生成
- ✅ **清理旧文件**：每次部署前清理
- ✅ **自动化**：使用脚本或 CI/CD

### 相关文件

- **部署脚本**: `external/gobang/deploy.sh` (Linux/Mac) / `deploy.bat` (Windows)
- **Git 忽略**: `.gitignore` (主项目和子模块)
- **配置文件**: `external/gobang/package.json`
