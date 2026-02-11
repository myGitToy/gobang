# 游戏难度保留测试文档

## 测试概述

这个测试套件用于验证五子棋游戏中**难度设置在游戏结束后的保留逻辑**。

### 问题背景

之前的 Bug：当用户选择非默认难度（如初级、高级、竞赛级）后，点击"认输"按钮，难度会被重置为中级（默认值）。

修复后的行为：难度设置在整个游戏会话中保持不变，直到用户手动修改。

## 测试文件位置

```
external/gobang/src/store/gameSlice.test.js
```

## 快速开始

### 安装依赖
```bash
cd external/gobang
npm install
```

### 运行测试

```bash
# 方式1：运行所有测试
npm test

# 方式2：只运行难度保留测试
npm test -- --testPathPattern=gameSlice.test.js

# 方式3：监视模式（文件修改时自动重新运行）
npm test -- --watch gameSlice.test.js

# 方式4：显示测试覆盖率
npm test -- --coverage --testPathPattern=gameSlice.test.js
```

## 测试用例说明

### 1. 初始状态测试
- ✅ 验证默认深度值为 4（中级）
- ✅ 验证默认电脑先手为 true
- ✅ 验证默认状态为 IDLE

### 2. 设置难度功能测试
- ✅ 能够设置难度为初级（2）
- ✅ 能够设置难度为中级（4）
- ✅ 能够设置难度为高级（6）
- ✅ 能够设置难度为竞赛级（8）
- ✅ 字符串正确转换为数字

### 3. 核心测试：游戏结束后难度保留
- ✅ 游戏结束后保留初级难度
- ✅ 游戏结束后保留高级难度
- ✅ 游戏结束后保留竞赛级难度
- ✅ 其他状态（board、history、winner）被正确重置

### 4. 连续游戏场景测试
- ✅ 初级 → 认输 → 重新开始 → 认输 → 难度保持初级
- ✅ 中级 → 高级 → 认输 → 难度保持高级（不是回退到中级）

### 5. 游戏流程集成测试
- ✅ 完整流程：设置难度 → 开始 → 悔棋 → 结束 → 难度保留

### 6. 边界情况测试
- ✅ 多次连续认输，难度始终保留
- ✅ 不同难度切换，最后一次选择在认输后保留

## 预期测试结果

所有测试应该通过（✅）：

```
PASS src/store/gameSlice.test.js
  GameSlice - 难度保留测试
    初始状态
      ✓ 应该有默认的深度值 4（中级）
    setDepth
      ✓ 应该能够设置难度为初级（2）
      ✓ 应该能够设置难度为中级（4）
      ✓ 应该能够设置难度为高级（6）
      ✓ 应该能够设置难度为竞赛级（8）
      ✓ 应该能够将字符串转换为数字
    endGame - 难度保留
      ✓ 游戏结束后应该保留初级难度设置
      ✓ 游戏结束后应该保留高级难度设置
      ✓ 游戏结束后应该保留竞赛级难度设置
      ✓ 游戏结束后其他状态应该被重置
    连续游戏场景
      ✓ 初级 → 认输 → 重新开始 → 认输 → 难度应该保持初级
      ✓ 中级 → 高级 → 认输 → 难度应该保持高级
    游戏流程集成测试
      ✓ 完整的游戏流程：设置难度 → 开始 → 悔棋 → 结束 → 难度保留
    边界情况
      ✓ 多次连续认输，难度应该始终保留
      ✓ 在不同难度之间切换，最后一次选择的应该在认输后保留
```

## 测试覆盖的代码逻辑

测试验证了 `gameSlice.js` 中的这段代码：

```javascript
.addCase(endGame.fulfilled, (state) => {
  state.board = initialState.board;
  state.currentPlayer = initialState.currentPlayer;
  state.winner = initialState.winner;
  state.history = initialState.history;
  state.status = initialState.status;
  state.sessionId = initialState.sessionId;
  state.size = initialState.size;
  state.loading = initialState.loading;
  // 保留用户选择的难度设置，不重置
  // state.depth = initialState.depth;  ← 这行被注释掉
  state.score = initialState.score;
  state.path = initialState.path;
  state.currentDepth = initialState.currentDepth;
});
```

## 故障排查

### 如果测试失败

1. **检查 STATUS 常量**
   ```javascript
   // 确保使用正确的常量
   import { STATUS } from '../status';
   expect(state.status).toBe(STATUS.IDLE); // 不是 'IDLE'
   ```

2. **检查 Redux store 配置**
   - 确保正确导入 `gameReducer`
   - 确保使用 `configureStore` 创建 store

3. **检查 Action 类型**
   - 使用 `endGame.fulfilled.type` 而不是硬编码字符串
   - Redux Toolkit 会自动生成这些类型

## 手动测试步骤

如果自动化测试无法运行，可以进行手动测试：

1. 打开五子棋游戏页面
2. 选择"初级"难度
3. 点击"开始"按钮
4. 点击"认输"按钮
5. 检查难度选择器是否仍然显示"初级"
6. 点击"开始"按钮
7. 验证游戏使用的是"初级"难度（AI思考时间短）

## 相关文件

- **测试文件**: `src/store/gameSlice.test.js`
- **被测文件**: `src/store/gameSlice.js`
- **状态常量**: `src/status.js`
- **配置文件**: `package.json`, `src/setupTests.js`

## 维护说明

### 添加新的难度级别

如果添加新的难度级别（如 "超高级"），需要：

1. 更新 `src/components/control.js` 中的选项
2. 在测试中添加相应的测试用例
3. 更新本文档

### 修改难度保留逻辑

如果需要修改难度保留的行为（比如在某些情况下重置）：

1. 修改 `src/store/gameSlice.js` 中的 `endGame.fulfilled` 处理逻辑
2. 更新或添加相应的测试用例
3. 确保所有测试通过
4. 更新本文档

## 持续集成

建议在 CI/CD 流程中包含此测试：

```yaml
# .github/workflows/test.yml 示例
- name: Run tests
  run: |
    cd external/gobang
    npm test -- --coverage --watchAll=false
```

## 联系方式

如有问题，请查看项目 README 或提交 Issue。
