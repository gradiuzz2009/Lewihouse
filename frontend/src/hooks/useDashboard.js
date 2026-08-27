import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export function useDashboard() {
  const [summary, setSummary] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, repRes] = await Promise.allSettled([
        api.get("/dashboard/summary"),
        api.get("/reports/monthly?months=6"),
      ]);

      if (sumRes.status === "fulfilled" && sumRes.value?.data) {
        setSummary(sumRes.value.data);
      }
      if (repRes.status === "fulfilled" && Array.isArray(repRes.value?.data)) {
        setReports(repRes.value.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    summary,
    reports,
    loading,
    error,
    refresh: fetchDashboardData,
  };
}
