// 【临时修复】不使用 Web Worker，直接在主线程中运行 AI
// 原因：Webpack 5 的 Worker 配置存在问题，导致 Worker 无法正确加载
// TODO: 后续需要修复 Webpack 配置以正确支持 Web Worker

import Board from './ai/board';
import { minmax } from './ai/minmax';
import { board_size } from './config';

let board = new Board(board_size);
let score = 0, bestPath = [], currentDepth = 0;

const getBoardData = () => {
  return {
    board: JSON.parse(JSON.stringify(board.board)),
    winner: board.getWinner(),
    current_player: board.role,
    history: JSON.parse(JSON.stringify(board.history)),
    size: board.size,
    score,
    bestPath,
    currentDepth,
  };
};

// 使用 setTimeout 让 AI 计算不阻塞 UI
const runAsync = (fn) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = fn();
      resolve(result);
    }, 10);
  });
};

export const start = async (board_size_param, aiFirst, depth) => {
  return runAsync(() => {
    console.log('start', board_size_param, aiFirst, depth);
    board = new Board(board_size_param);
    try {
      if (aiFirst) {
        const res = minmax(board, board.role, depth);
        let move;
        [score, move, bestPath, currentDepth] = res;
        board.put(move[0], move[1]);
      }
    } catch (e) {
      console.error(e);
    }
    return getBoardData();
  });
};

export const move = async (position, depth) => {
  return runAsync(() => {
    try {
      board.put(position[0], position[1]);
    } catch (e) {
      console.error(e);
    }
    if (!board.isGameOver()) {
      const res = minmax(board, board.role, depth);
      let move;
      [score, move, bestPath, currentDepth] = res;
      board.put(move[0], move[1]);
    }
    return getBoardData();
  });
};

export const end = async () => {
  return runAsync(() => {
    return getBoardData();
  });
};

export const undo = async () => {
  return runAsync(() => {
    board.undo();
    board.undo();
    return getBoardData();
  });
};