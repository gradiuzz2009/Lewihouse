import axios from "axios";
import { handleMockApi } from "./mockData";

const BASE = process.env.REACT_APP_BACKEND_URL;

const axiosInstance = axios.create({
  baseURL: BASE ? `${BASE.replace(/\/$/, "")}/api` : "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

axiosInstance.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("lh_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

axiosInstance.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !String(err.config?.url).includes("/auth/")) {
      localStorage.removeItem("lh_token");
      if (window.location.pathname !== "/login") window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Wrapper that transparently proxies to live backend if available, or seamlessly uses mock storage
async function requestWithFallback(method, url, data, config) {
  if (BASE) {
    try {
      if (method === "get") return await axiosInstance.get(url, config);
      if (method === "post") return await axiosInstance.post(url, data, config);
      if (method === "put") return await axiosInstance.put(url, data, config);
      if (method === "delete") return await axiosInstance.delete(url, config);
    } catch (err) {
      // If live backend gives 401 on auth check, let it bubble
      if (err.response?.status === 401 && String(url).includes("/auth/login")) {
        throw err;
      }
    }
  }

  // Fallback to local persistent mock engine (for Firebase static hosting & offline mode)
  const result = handleMockApi(method, url, data);
  return { data: result, status: 200, statusText: "OK", headers: {}, config: {} };
}

export const api = {
  get: (url, config) => requestWithFallback("get", url, null, config),
  post: (url, data, config) => requestWithFallback("post", url, data, config),
  put: (url, data, config) => requestWithFallback("put", url, data, config),
  delete: (url, config) => requestWithFallback("delete", url, null, config),
  interceptors: axiosInstance.interceptors,
};

export const fmtIDR = (n = 0) => {
  const num = Number(n) || 0;
  return "Rp " + num.toLocaleString("id-ID");
};

export const fmtDate = (iso) => {
  if (!iso) return "-";
  try {
    const d = typeof iso === "string" && iso.length === 10 ? new Date(iso + "T00:00:00") : new Date(iso);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "-";
  }
};

export const formatTokenValidity = (startDate, endDate) => {
  if (!endDate && !startDate) return "Masa Berlaku: Selamanya (Permanen)";
  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  try {
    const end = endDate ? (typeof endDate === "string" && endDate.length === 10 ? new Date(endDate + "T00:00:00") : new Date(endDate)) : null;
    const start = startDate ? (typeof startDate === "string" && startDate.length === 10 ? new Date(startDate + "T00:00:00") : new Date(startDate)) : null;
    const isStartValid = start && !isNaN(start.getTime());
    const isEndValid = end && !isNaN(end.getTime());

    if (isStartValid && isEndValid) {
      return `Masa Berlaku: ${formatter.format(start)} – ${formatter.format(end)}`;
    }
    if (isEndValid) {
      return `Masa Berlaku s.d. ${formatter.format(end)}`;
    }
    if (isStartValid) {
      return `Masa Berlaku mulai ${formatter.format(start)}`;
    }
    return "Masa Berlaku: Selamanya";
  } catch {
    return "Masa Berlaku: Selamanya";
  }
};

export const fmtDateTime = (iso) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
};

export const monthLabel = (period) => {
  if (!period) return "-";
  const [y, m] = period.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${names[parseInt(m, 10) - 1]} ${y}`;
};

export const cn = (...cls) => cls.filter(Boolean).join(" ");
