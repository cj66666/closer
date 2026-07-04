/**
 * [INPUT]: 依赖 React、ReactDOM、App、ToastHost 与 styles.css
 * [OUTPUT]: 对外启动 Closer 工作台 React 应用（含全局 Toast 容器）
 * [POS]: frontend/src 的浏览器入口，只负责 DOM 挂载
 * [PROTOCOL]: 变更时同步更新相关测试与公开文档
 */

import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { ToastHost } from "./ui.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <ToastHost>
    <App />
  </ToastHost>,
);
