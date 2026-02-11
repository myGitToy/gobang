#!/bin/bash
# 五子棋游戏部署脚本
# 用于在本地或服务器上构建和部署五子棋游戏

set -e  # 遇到错误立即退出

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  五子棋游戏自动部署脚本${NC}"
echo -e "${BLUE}========================================${NC}"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BUILD_DIR="$SCRIPT_DIR/build"
TARGET_DIR="$PROJECT_ROOT/static/gobang"

echo -e "${BLUE}[1/5] 清理旧构建文件...${NC}"
rm -rf "$BUILD_DIR"
echo -e "${GREEN}✓ 清理完成${NC}"

echo -e "${BLUE}[2/5] 清理目标目录...${NC}"
rm -rf "$TARGET_DIR"/*
mkdir -p "$TARGET_DIR"
echo -e "${GREEN}✓ 清理完成${NC}"

echo -e "${BLUE}[3/5] 安装依赖...${NC}"
cd "$SCRIPT_DIR"
if [ ! -d "node_modules" ]; then
    npm install
else
    echo -e "${GREEN}✓ 依赖已存在${NC}"
fi

echo -e "${BLUE}[4/5] 构建生产版本...${NC}"
npm run build
echo -e "${GREEN}✓ 构建完成${NC}"

echo -e "${BLUE}[5/5] 复制到静态目录...${NC}"
cp -r "$BUILD_DIR"/* "$TARGET_DIR/"
echo -e "${GREEN}✓ 复制完成${NC}"

# 显示部署信息
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ 部署成功！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "构建产物位置: $TARGET_DIR"
echo "最新文件: $(ls -t "$TARGET_DIR"/static/js/main.*.js 2>/dev/null | head -1 | xargs basename)"
echo "总大小: $(du -sh "$TARGET_DIR" | cut -f1)"
echo ""
echo -e "${BLUE}下一步操作：${NC}"
echo "1. 刷新浏览器测试游戏"
echo "2. Git 提交源代码（不需要提交构建产物）"
echo "3. 在服务器上运行此脚本进行部署"
