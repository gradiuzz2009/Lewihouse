import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";

export function useBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/bills");
      setBills(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to load invoices";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const recordPayment = async (billId, paymentData) => {
    try {
      await api.post(`/bills/${billId}/payments`, paymentData);
      toast.success("Payment recorded successfully");
      await fetchBills();
      return true;
    } catch (err) {
      toast.error("Failed to record payment");
      return false;
    }
  };

  const generateMonthlyInvoices = async () => {
    try {
      const res = await api.post("/bills/generate");
      toast.success(`Generated ${res.data?.count || "monthly"} invoices`);
      await fetchBills();
      return true;
    } catch (err) {
      toast.error("Failed to generate invoices");
      return false;
    }
  };

  return {
    bills,
    loading,
    error,
    refresh: fetchBills,
    recordPayment,
    generateMonthlyInvoices,
  };
}
