@echo off
REM 五子棋游戏部署脚本 (Windows)
REM 用于在本地或服务器上构建和部署五子棋游戏

setlocal enabledelayedexpansion

echo ========================================
echo   五子棋游戏自动部署脚本
echo ========================================
echo.

REM 获取脚本所在目录
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..\..\
set BUILD_DIR=%SCRIPT_DIR%build
set TARGET_DIR=%PROJECT_ROOT%static\gobang

echo [1/5] 清理旧构建文件...
if exist "%BUILD_DIR%" rd /s /q "%BUILD_DIR%"
echo [OK] 清理完成
echo.

echo [2/5] 清理目标目录...
if exist "%TARGET_DIR%" rd /s /q "%TARGET_DIR%"
mkdir "%TARGET_DIR%"
echo [OK] 清理完成
echo.

echo [3/5] 安装依赖...
cd "%SCRIPT_DIR%"
if not exist "node_modules" (
    call npm install
) else (
    echo [OK] 依赖已存在
)
echo.

echo [4/5] 构建生产版本...
call npm run build
echo [OK] 构建完成
echo.

echo [5/5] 复制到静态目录...
xcopy /s /e /y /q "%BUILD_DIR%\*" "%TARGET_DIR%\"
echo [OK] 复制完成
echo.

echo ========================================
echo [OK] 部署成功！
echo ========================================
echo.
echo 构建产物位置: %TARGET_DIR%
echo.
echo 下一步操作：
echo 1. 刷新浏览器测试游戏
echo 2. Git 提交源代码（不需要提交构建产物）
echo 3. 在服务器上运行此脚本进行部署
echo.

pause
