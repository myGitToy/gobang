import { configureStore } from '@reduxjs/toolkit';
import gameReducer, {
  setDepth,
  setAiFirst,
  startGame,
  endGame,
  undoMove
} from './gameSlice';
import { STATUS } from '../status';

/**
 * 游戏状态管理测试套件
 * 主要测试游戏难度设置在游戏结束后的保留逻辑
 */
describe('GameSlice - 难度保留测试', () => {
  let store;

  beforeEach(() => {
    // 每个测试前创建一个新的 store
    store = configureStore({
      reducer: {
        game: gameReducer,
      },
    });
  });

  /**
   * 测试1：验证初始状态
   */
  describe('初始状态', () => {
    test('应该有默认的深度值 4（中级）', () => {
      const state = store.getState().game;
      expect(state.depth).toBe(4);
      expect(state.aiFirst).toBe(true);
      expect(state.status).toBe(STATUS.IDLE);
    });
  });

  /**
   * 测试2：设置难度功能
   */
  describe('setDepth', () => {
    test('应该能够设置难度为初级（2）', () => {
      store.dispatch(setDepth('2'));
      const state = store.getState().game;
      expect(state.depth).toBe(2);
    });

    test('应该能够设置难度为中级（4）', () => {
      store.dispatch(setDepth('4'));
      const state = store.getState().game;
      expect(state.depth).toBe(4);
    });

    test('应该能够设置难度为高级（6）', () => {
      store.dispatch(setDepth('6'));
      const state = store.getState().game;
      expect(state.depth).toBe(6);
    });

    test('应该能够设置难度为竞赛级（8）', () => {
      store.dispatch(setDepth('8'));
      const state = store.getState().game;
      expect(state.depth).toBe(8);
    });

    test('应该能够将字符串转换为数字', () => {
      store.dispatch(setDepth('2'));
      const state = store.getState().game;
      expect(state.depth).toBe(2);
      expect(typeof state.depth).toBe('number');
    });
  });

  /**
   * 测试3：游戏结束后保留难度设置（核心测试）
   */
  describe('endGame - 难度保留', () => {
    test('游戏结束后应该保留初级难度设置', async () => {
      // 1. 设置难度为初级
      store.dispatch(setDepth('2'));
      expect(store.getState().game.depth).toBe(2);

      // 2. 模拟游戏结束（不需要真的调用API，直接分发fulfilled action）
      const endAction = {
        type: endGame.fulfilled.type,
        payload: {}
      };
      store.dispatch(endAction);

      // 3. 验证难度仍然为初级
      const state = store.getState().game;
      expect(state.depth).toBe(2);
      expect(state.status).toBe(STATUS.IDLE);
      expect(state.board).toBeDefined();
    });

    test('游戏结束后应该保留高级难度设置', async () => {
      // 1. 设置难度为高级
      store.dispatch(setDepth('6'));
      expect(store.getState().game.depth).toBe(6);

      // 2. 模拟游戏结束
      const endAction = {
        type: endGame.fulfilled.type,
        payload: {}
      };
      store.dispatch(endAction);

      // 3. 验证难度仍然为高级
      const state = store.getState().game;
      expect(state.depth).toBe(6);
    });

    test('游戏结束后应该保留竞赛级难度设置', async () => {
      // 1. 设置难度为竞赛级
      store.dispatch(setDepth('8'));
      expect(store.getState().game.depth).toBe(8);

      // 2. 模拟游戏结束
      const endAction = {
        type: endGame.fulfilled.type,
        payload: {}
      };
      store.dispatch(endAction);

      // 3. 验证难度仍然为竞赛级
      const state = store.getState().game;
      expect(state.depth).toBe(8);
    });

    test('游戏结束后其他状态应该被重置', async () => {
      // 1. 设置各种状态
      store.dispatch(setDepth('2'));
      store.dispatch(setAiFirst(false));

      // 2. 模拟游戏结束
      const endAction = {
        type: endGame.fulfilled.type,
        payload: {}
      };
      store.dispatch(endAction);

      // 3. 验证：难度保留，但其他状态被重置
      const state = store.getState().game;
      expect(state.depth).toBe(2); // 难度保留
      expect(state.status).toBe(STATUS.IDLE); // 状态重置
      expect(state.history).toEqual([]); // 历史清空
      expect(state.winner).toBe(null); // 赢家清空
    });
  });

  /**
   * 测试4：连续游戏场景
   */
  describe('连续游戏场景', () => {
    test('初级 → 认输 → 重新开始 → 认输 → 难度应该保持初级', async () => {
      // 第一局：选择初级
      store.dispatch(setDepth('2'));
      expect(store.getState().game.depth).toBe(2);

      // 第一局：认输
      const endAction1 = {
        type: endGame.fulfilled.type,
        payload: {}
      };
      store.dispatch(endAction1);
      expect(store.getState().game.depth).toBe(2);

      // 第二局：重新开始（难度保持）
      expect(store.getState().game.depth).toBe(2);

      // 第二局：再次认输
      const endAction2 = {
        type: endGame.fulfilled.type,
        payload: {}
      };
      store.dispatch(endAction2);

      // 验证：难度仍然保持初级
      expect(store.getState().game.depth).toBe(2);
    });

    test('中级 → 高级 → 认输 → 难度应该保持高级', async () => {
      // 默认是中级
      expect(store.getState().game.depth).toBe(4);

      // 修改为高级
      store.dispatch(setDepth('6'));
      expect(store.getState().game.depth).toBe(6);

      // 认输
      const endAction = {
        type: endGame.fulfilled.type,
        payload: {}
      };
      store.dispatch(endAction);

      // 验证：难度保持高级，而不是回退到中级
      expect(store.getState().game.depth).toBe(6);
    });
  });

  /**
   * 测试5：与游戏流程集成测试
   */
  describe('游戏流程集成测试', () => {
    test('完整的游戏流程：设置难度 → 开始 → 悔棋 → 结束 → 难度保留', async () => {
      // 1. 用户选择竞赛级难度
      store.dispatch(setDepth('8'));
      expect(store.getState().game.depth).toBe(8);

      // 2. 用户设置电脑后手
      store.dispatch(setAiFirst(false));
      expect(store.getState().game.aiFirst).toBe(false);

      // 3. 模拟游戏开始（这里只测试状态，不真的调用API）
      // startGame 实际会调用 bridge.start，我们跳过这部分

      // 4. 模拟悔棋（不应该影响难度）
      const undoAction = {
        type: undoMove.fulfilled.type,
        payload: {
          board: [],
          current_player: 1,
          winner: 0,
          history: [],
          score: 0,
          bestPath: [],
          currentDepth: 0
        }
      };
      store.dispatch(undoAction);
      expect(store.getState().game.depth).toBe(8);

      // 5. 游戏结束
      const endAction = {
        type: endGame.fulfilled.type,
        payload: {}
      };
      store.dispatch(endAction);

      // 6. 验证：难度仍然是竞赛级
      const finalState = store.getState().game;
      expect(finalState.depth).toBe(8);
      expect(finalState.status).toBe('IDLE');
    });
  });

  /**
   * 测试6：边界情况
   */
  describe('边界情况', () => {
    test('多次连续认输，难度应该始终保留', async () => {
      // 设置初级
      store.dispatch(setDepth('2'));

      // 连续认输5次
      for (let i = 0; i < 5; i++) {
        const endAction = {
          type: endGame.fulfilled.type,
          payload: {}
        };
        store.dispatch(endAction);
        expect(store.getState().game.depth).toBe(2);
      }
    });

    test('在不同难度之间切换，最后一次选择的应该在认输后保留', async () => {
      // 初级
      store.dispatch(setDepth('2'));
      store.dispatch({ type: endGame.fulfilled.type, payload: {} });
      expect(store.getState().game.depth).toBe(2);

      // 切换到高级
      store.dispatch(setDepth('6'));
      store.dispatch({ type: endGame.fulfilled.type, payload: {} });
      expect(store.getState().game.depth).toBe(6);

      // 切换到竞赛级
      store.dispatch(setDepth('8'));
      store.dispatch({ type: endGame.fulfilled.type, payload: {} });
      expect(store.getState().game.depth).toBe(8);
    });
  });
});

/**
 * 测试运行说明：
 *
 * 运行所有测试：
 *   npm test
 *
 * 只运行这个测试文件：
 *   npm test gameSlice.test.js
 *
 * 运行测试并显示覆盖率：
 *   npm test -- --coverage
 *
 * 监视模式（文件修改时自动重新运行）：
 *   npm test -- --watch
 */
