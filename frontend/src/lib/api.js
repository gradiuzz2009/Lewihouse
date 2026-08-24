import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;

export const api = axios.create({
  baseURL: `${BASE}/api`,
  headers: { "Content-Type": "application/json" },
});

export const fmtIDR = (n = 0) => {
  const num = Number(n) || 0;
  return "Rp " + num.toLocaleString("id-ID");
};

export const fmtDate = (iso) => {
  if (!iso) return "-";
  try {
    const d = typeof iso === "string" && iso.length === 10 ? new Date(iso + "T00:00:00") : new Date(iso);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
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
