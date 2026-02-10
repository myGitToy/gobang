module.exports = function override(config, env) {
  // Web Worker 配置 - 兼容 Webpack 5
  // 注意：在 Webpack 5 中，worker 文件需要使用新的 Worker 构建方式

  // 方案：暂时禁用 worker-loader 以完成构建
  // TODO: 后续需要升级到 webpack-plugin-worker 或使用新的 Worker 构建方式

  /*
  // 旧的 worker-loader 配置（不兼容 Webpack 5）
  config.module.rules.push({
    test: /\.worker\.js$/,
    use: { loader: "worker-loader" }
  });
  */

  return config;
};