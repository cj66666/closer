/**
 * [INPUT]: 依赖 localStorage
 * [OUTPUT]: 对外提供 getSession、setSession、clearSession，统一管理登录态持久化
 * [POS]: frontend/src 的 session 边界，被 App.jsx 与 Login.jsx 消费
 */

const KEY = 'closer_session';

export const getSession = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
  catch { return null; }
};

export const setSession = (s) => localStorage.setItem(KEY, JSON.stringify(s));

export const clearSession = () => localStorage.removeItem(KEY);
