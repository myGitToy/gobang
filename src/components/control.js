import './control.css';
import { useDispatch, useSelector } from 'react-redux';
import { startGame, endGame, undoMove, setAiFirst, setDepth, setIndex, setDebug } from '../store/gameSlice';
import { board_size } from '../config';
import { Button, Switch, Select, Modal } from 'antd';
import { STATUS } from '../status';
import { useCallback, useState } from 'react';

function Control() {
  const dispatch = useDispatch();
  const { loading, winner, status, history, aiFirst, depth, index, score, path, currentDepth, debug } = useSelector((state) => state.game);
  const [pointsModalVisible, setPointsModalVisible] = useState(false);
  const [pointsDeducting, setPointsDeducting] = useState(false);

  const start = useCallback(async () => {
    // 显示确认对话框
    setPointsModalVisible(true);
  }, []);

  const handleConfirmStart = useCallback(async () => {
    setPointsDeducting(true);
    try {
      // 调用API扣除5积分
      const response = await fetch('/api/gobang/start/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
      });

      const data = await response.json();

      if (data.success) {
        // 扣除积分成功，开始游戏
        dispatch(startGame({board_size, aiFirst, depth}));
        setPointsModalVisible(false);

        // 通知父页面更新积分显示
        if (window.parent !== window) {
          // 发送完整的积分数据
          window.parent.postMessage({
            type: 'POINTS_UPDATED',
            remainingPoints: data.remaining_points,
            total_spent: data.total_spent,  // 添加累计消费
            points_per_game: data.points_per_game  // 添加每局消耗
          }, '*');
        }

        // 可选：显示成功消息
        // Modal.success({ content: data.message });
      } else {
        // 扣除积分失败
        Modal.error({
          title: '无法开始游戏',
          content: data.message,
        });
        setPointsModalVisible(false);
      }
    } catch (error) {
      Modal.error({
        title: '网络错误',
        content: '无法连接到服务器，请稍后重试',
      });
      setPointsModalVisible(false);
    } finally {
      setPointsDeducting(false);
    }
  }, [dispatch, board_size, aiFirst, depth]);

  const handleCancelStart = useCallback(() => {
    setPointsModalVisible(false);
  }, []);

  // 获取CSRF Token的辅助函数
  const getCsrfToken = () => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        return decodeURIComponent(value);
      }
    }
    return '';
  };
  const end = useCallback(() => {
    dispatch(endGame());
  }, [dispatch]);
  const undo = useCallback(() => {
    dispatch(undoMove());
  }, [dispatch]);
  const onFirstChange = useCallback((checked) => {
    dispatch(setAiFirst(checked));
  }, [dispatch]);
  const onDepthChange = useCallback((value) => {
    dispatch(setDepth(value));
  }, [dispatch]);
  const onIndexChange = useCallback((checked) => {
    dispatch(setIndex(checked));
  }, [dispatch]);
  const onDebugChange = useCallback((checked) => {
    dispatch(setDebug(checked));
  }, [dispatch]);
  return (
    <div className="control">
      <div className="buttons">
        <Button className="button" type="primary" onClick={start} disabled={loading || status !== STATUS.IDLE}>开始</Button>
        <Button className="button" type="primary" onClick={undo} disabled={loading || status !== STATUS.GAMING || history.length === 0}>悔棋</Button>
        <Button className="button" type="primary" onClick={end} disabled={loading || status !== STATUS.GAMING}>认输</Button>
      </div>
      <div className="setting">
        <div className="setting-row">
          <div className="setting-item">
            电脑先手: <Switch defaultChecked={aiFirst} onChange={onFirstChange} disabled={loading} />
          </div>
          <div className="setting-item">
            难度:
            <Select
              defaultValue={String(depth)}
              style={{ width: 160 }}
              onChange={onDepthChange}
              disabled={loading}
              options={[
                { value: '2', label: '初级(普通2步，杀棋5步)超快' },
                { value: '4', label: '中级(普通4步，杀棋12步)快' },
                { value: '6', label: '高级(普通6步，杀棋14步)慢' },
                { value: '8', label: '竞赛级(普通8步，杀棋16步)超慢' },
              ]}
            />
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-item">
            序号: <Switch defaultChecked={index} onChange={onIndexChange} />
          </div>
          <div className="setting-item">
            调试: <Switch defaultChecked={debug} onChange={onDebugChange} disabled={loading} />
          </div>
        </div>
      </div>
      {
        debug && <div className="status">
          <div className="status-item">评分：{score}</div>
          <div className="status-item">深度: {path?.length || 0}</div>
          <div className="status-item">思考: {JSON.stringify(path)}</div>
          <div className="status-item">历史: {JSON.stringify(history.map(h => [h.i, h.j]))}</div>
        </div>
      }

      {/* 积分确认对话框 */}
      <Modal
        title="开始游戏"
        open={pointsModalVisible}
        onOk={handleConfirmStart}
        onCancel={handleCancelStart}
        okText="确认开始"
        cancelText="取消"
        confirmLoading={pointsDeducting}
      >
        <p>开始一局五子棋游戏需要扣除 <strong>5积分</strong>。</p>
        <p>确认开始游戏吗？</p>
      </Modal>
    </div>
  );
}

export default Control;
