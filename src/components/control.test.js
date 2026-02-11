/**
 * 五子棋控制组件测试
 *
 * 测试控制面板的积分扣除逻辑：
 * 1. 测试点击开始按钮显示确认对话框
 * 2. 测试确认后调用API扣除积分
 * 3. 测试积分不足时的错误处理
 * 4. 测试网络错误处理
 * 5. 测试取消操作
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Control from './control';
import gameReducer from '../store/gameSlice';
import { STATUS } from '../status';
import fetchMock from 'jest-fetch-mock';

// 启用 fetch mock
fetchMock.enableMocks();

// 创建测试用的 store
function createTestStore(initialState = {}) {
  return configureStore({
    reducer: {
      game: gameReducer,
    },
    preloadedState: {
      game: {
        board: [],
        aiFirst: true,
        currentPlayer: null,
        winner: null,
        history: [],
        status: STATUS.IDLE,
        sessionId: null,
        size: 15,
        loading: false,
        depth: 4,
        index: false,
        score: 0,
        path: [],
        currentDepth: 0,
        debug: false,
        ...initialState,
      },
    },
  });
}

// 包装组件的辅助函数
function renderWithStore(store, ui = <Control />) {
  return render(
    <Provider store={store}>
      {ui}
    </Provider>
  );
}

describe('Control 组件 - 积分扣除功能', () => {
  beforeEach(() => {
    // 清除所有 mocks
    fetchMock.resetMocks();
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'csrftoken=test-csrf-token',
    });
  });

  /**
   * 测试1：组件正常渲染
   */
  describe('基本渲染', () => {
    test('应该渲染开始按钮', () => {
      const store = createTestStore();
      renderWithStore(store);

      const startButton = screen.getByText('开始');
      expect(startButton).toBeInTheDocument();
    });

    test('应该渲染悔棋和认输按钮', () => {
      const store = createTestStore();
      renderWithStore(store);

      expect(screen.getByText('悔棋')).toBeInTheDocument();
      expect(screen.getByText('认输')).toBeInTheDocument();
    });
  });

  /**
   * 测试2：开始按钮点击显示确认对话框
   */
  describe('开始按钮交互', () => {
    test('点击开始按钮应该显示积分确认对话框', async () => {
      const store = createTestStore();
      renderWithStore(store);

      const startButton = screen.getByText('开始');
      fireEvent.click(startButton);

      // 等待 Modal 出现
      await waitFor(() => {
        expect(screen.getByText('开始游戏')).toBeInTheDocument();
      });

      expect(screen.getByText(/开始一局五子棋游戏需要扣除/)).toBeInTheDocument();
      expect(screen.getByText(/5积分/)).toBeInTheDocument();
      expect(screen.getByText('确认开始')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    test('点击取消应该关闭对话框', async () => {
      const store = createTestStore();
      renderWithStore(store);

      // 点击开始按钮
      const startButton = screen.getByText('开始');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('开始游戏')).toBeInTheDocument();
      });

      // 点击取消
      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);

      // 等待 Modal 消失
      await waitFor(() => {
        expect(screen.queryByText('开始游戏')).not.toBeInTheDocument();
      });
    });
  });

  /**
   * 测试3：成功扣除积分并开始游戏
   */
  describe('积分扣除成功', () => {
    test('确认后应该调用API扣除积分', async () => {
      // Mock API 成功响应
      fetchMock.mockResponseOnce(
        JSON.stringify({
          success: true,
          message: '开始游戏成功！扣除5积分',
          remaining_points: 95,
        })
      );

      const store = createTestStore();

      // Mock startGame action
      const mockStartGame = jest.spyOn(store, 'dispatch');

      renderWithStore(store);

      // 点击开始按钮
      const startButton = screen.getByText('开始');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('开始游戏')).toBeInTheDocument();
      });

      // 点击确认
      const confirmButton = screen.getByText('确认开始');
      fireEvent.click(confirmButton);

      // 等待 API 调用
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/gobang/start/',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'X-CSRFToken': 'test-csrf-token',
            }),
          })
        );
      });

      // 验证 dispatch 被调用
      await waitFor(() => {
        expect(mockStartGame).toHaveBeenCalled();
      });
    });

    test('扣除积分成功后应该关闭对话框', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          success: true,
          message: '开始游戏成功！扣除5积分',
          remaining_points: 95,
        })
      );

      const store = createTestStore();
      renderWithStore(store);

      // 点击开始并确认
      fireEvent.click(screen.getByText('开始'));
      await waitFor(() => {
        expect(screen.getByText('开始游戏')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('确认开始'));

      // 等待对话框关闭
      await waitFor(() => {
        expect(screen.queryByText('开始游戏')).not.toBeInTheDocument();
      });
    });
  });

  /**
   * 测试4：积分不足处理
   */
  describe('积分不足处理', () => {
    test('积分不足时应该显示错误提示', async () => {
      // Mock API 失败响应（积分不足）
      fetchMock.mockResponseOnce(
        JSON.stringify({
          success: false,
          message: '积分不足！开始游戏需要5积分，当前3积分',
        })
      );

      const store = createTestStore();
      renderWithStore(store);

      // 点击开始并确认
      fireEvent.click(screen.getByText('开始'));
      await waitFor(() => {
        expect(screen.getByText('开始游戏')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('确认开始'));

      // 等待错误提示
      await waitFor(() => {
        expect(screen.getByText('无法开始游戏')).toBeInTheDocument();
        expect(screen.getByText(/积分不足/)).toBeInTheDocument();
      });
    });

    test('积分不足时应该关闭对话框但不开始游戏', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          success: false,
          message: '积分不足！开始游戏需要5积分，当前3积分',
        })
      );

      const store = createTestStore();
      const mockDispatch = jest.spyOn(store, 'dispatch');

      renderWithStore(store);

      fireEvent.click(screen.getByText('开始'));
      await waitFor(() => {
        expect(screen.getByText('开始游戏')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('确认开始'));

      // 等待错误提示
      await waitFor(() => {
        expect(screen.getByText('无法开始游戏')).toBeInTheDocument();
      });

      // 验证不应该调用 startGame
      expect(mockDispatch).not.toHaveBeenCalled();

      // 关闭错误对话框后，确认对话框也应该关闭
      const errorOkButton = screen.getByText('OK');
      fireEvent.click(errorOkButton);

      await waitFor(() => {
        expect(screen.queryByText('开始游戏')).not.toBeInTheDocument();
      });
    });
  });

  /**
   * 测试5：网络错误处理
   */
  describe('网络错误处理', () => {
    test('网络错误时应该显示错误提示', async () => {
      // Mock 网络错误
      fetchMock.mockRejectOnce(new Error('Network error'));

      const store = createTestStore();
      renderWithStore(store);

      fireEvent.click(screen.getByText('开始'));
      await waitFor(() => {
        expect(screen.getByText('开始游戏')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('确认开始'));

      // 等待错误提示
      await waitFor(() => {
        expect(screen.getByText('网络错误')).toBeInTheDocument();
        expect(screen.getByText(/无法连接到服务器/)).toBeInTheDocument();
      });
    });
  });

  /**
   * 测试6：按钮状态
   */
  describe('按钮状态', () => {
    test('游戏进行中时开始按钮应该禁用', () => {
      const store = createTestStore({ status: STATUS.GAMING });
      renderWithStore(store);

      const startButton = screen.getByText('开始');
      expect(startButton).toBeDisabled();
    });

    test('加载中时开始按钮应该禁用', () => {
      const store = createTestStore({ loading: true });
      renderWithStore(store);

      const startButton = screen.getByText('开始');
      expect(startButton).toBeDisabled();
    });

    test('确认对话框显示加载状态', async () => {
      // Mock 延迟响应
      fetchMock.mockImplementation(
        () => new Promise(resolve => setTimeout(() =>
          resolve({
            ok: true,
            json: async () => ({
              success: true,
              remaining_points: 95,
            }),
          })
        , 100))
      );

      const store = createTestStore();
      renderWithStore(store);

      fireEvent.click(screen.getByText('开始'));
      await waitFor(() => {
        expect(screen.getByText('开始游戏')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText('确认开始');
      fireEvent.click(confirmButton);

      // 检查按钮是否进入加载状态
      await waitFor(() => {
        expect(confirmButton).toBeDisabled();
      });
    });
  });

  /**
   * 测试7：CSRF Token 获取
   */
  describe('CSRF Token', () => {
    test('应该从 cookie 中获取 CSRF token', async () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'csrftoken=my-custom-token',
      });

      fetchMock.mockResponseOnce(
        JSON.stringify({ success: true, remaining_points: 95 })
      );

      const store = createTestStore();
      renderWithStore(store);

      fireEvent.click(screen.getByText('开始'));
      await waitFor(() => {
        expect(screen.getByText('开始游戏')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('确认开始'));

      await waitFor(() => {
        const calls = fetchMock.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const headers = calls[0][1].headers;
        expect(headers['X-CSRFToken']).toBe('my-custom-token');
      });
    });

    test('没有 CSRF token 时应该使用空字符串', async () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: '',
      });

      fetchMock.mockResponseOnce(
        JSON.stringify({ success: true, remaining_points: 95 })
      );

      const store = createTestStore();
      renderWithStore(store);

      fireEvent.click(screen.getByText('开始'));
      await waitFor(() => {
        expect(screen.getByText('开始游戏')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('确认开始'));

      await waitFor(() => {
        const calls = fetchMock.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const headers = calls[0][1].headers;
        expect(headers['X-CSRFToken']).toBe('');
      });
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
 *   npm test control.test.js
 *
 * 运行测试并显示覆盖率：
 *   npm test -- --coverage
 *
 * 监视模式（文件修改时自动重新运行）：
 *   npm test -- --watch
 */
