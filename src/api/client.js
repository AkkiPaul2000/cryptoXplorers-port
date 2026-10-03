import axios from "axios";
import { readCache, writeCache } from "../utils/cache";

const listeners = new Set();
let pending = 0;
let showTimer;
let visible = false;

function notify() {
  listeners.forEach((listener) => listener(visible, pending));
}

function setVisible(next) {
  if (visible === next) return;
  visible = next;
  notify();
}

function bump(delta) {
  pending = Math.max(0, pending + delta);
  if (pending > 0) {
    clearTimeout(showTimer);
    showTimer = setTimeout(() => setVisible(true), 220);
  } else {
    clearTimeout(showTimer);
    setTimeout(() => {
      if (pending === 0) setVisible(false);
    }, 180);
  }
}

// CoinPaprika's keyless plan answers 402 once its 60-requests-an-hour budget is spent.
export const isRateLimited = (error) => [402, 429].includes(error?.response?.status);

export function subscribeLoading(listener) {
  listeners.add(listener);
  listener(visible, pending);
  return () => listeners.delete(listener);
}

const api = axios.create({ timeout: 15000 });

api.interceptors.request.use((config) => {
  if (config.signal?.aborted) {
    return Promise.reject(new axios.CanceledError("aborted"));
  }

  if (config.method === "get" && config.cacheKey && !config.fresh) {
    const cached = readCache(config.cacheKey);
    if (cached) {
      config.adapter = () =>
        Promise.resolve({
          data: cached,
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        });
      return config;
    }
  }

  if (!config.silent) bump(1);
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (!response.config.silent) bump(-1);
    if (response.config.method === "get" && response.config.cacheKey) {
      writeCache(response.config.cacheKey, response.data, response.config.cacheTtl || 60000);
    }
    return response;
  },
  async (error) => {
    const config = error.config || {};

    if (axios.isCancel(error) || error.code === "ERR_CANCELED") {
      if (!config.silent) bump(-1);
      return Promise.reject(error);
    }

    if (error.response?.status === 429 && !config._retry) {
      config._retry = true;
      if (!config.silent) bump(-1);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (!config.silent) bump(1);
      return api(config);
    }

    if (!config.silent) bump(-1);
    return Promise.reject(error);
  }
);

export default api;
