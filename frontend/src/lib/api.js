import axios from "axios";
import { executeLiveQuery } from "./liveStore";

const BASE = process.env.REACT_APP_BACKEND_URL || "";

export const axiosInstance = axios.create({
  baseURL: BASE ? `${BASE.replace(/\/$/, "")}/api` : "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

axiosInstance.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("lh_token");
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// Safe request dispatcher: routes to live backend if BASE configured; otherwise uses liveStore
async function dispatchRequest(method, url, data, config) {
  if (BASE) {
    try {
      if (method === "get") return await axiosInstance.get(url, config);
      if (method === "post") return await axiosInstance.post(url, data, config);
      if (method === "put") return await axiosInstance.put(url, data, config);
      if (method === "delete") return await axiosInstance.delete(url, config);
      if (method === "patch") return await axiosInstance.patch(url, data, config);
    } catch (err) {
      // If server returned 401 on login, bubble it up
      if (err.response?.status === 401 && String(url).includes("/auth/login")) {
        throw err;
      }
    }
  }

  // Live client-side persistent storage
  const result = executeLiveQuery(method, url, data);
  return { data: result, status: 200, statusText: "OK", headers: {}, config: {} };
}

export const api = {
  get: (url, config) => dispatchRequest("get", url, null, config),
  post: (url, data, config) => dispatchRequest("post", url, data, config),
  put: (url, data, config) => dispatchRequest("put", url, data, config),
  delete: (url, config) => dispatchRequest("delete", url, null, config),
  patch: (url, data, config) => dispatchRequest("patch", url, data, config),
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
