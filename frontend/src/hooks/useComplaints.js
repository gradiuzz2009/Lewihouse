import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";

export function useComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/complaints");
      setComplaints(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to load complaints";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const updateTicketStatus = async (ticketId, status) => {
    try {
      await api.post(`/complaints/${ticketId}/status`, { status });
      setComplaints((prev) =>
        prev.map((c) => (c.id === ticketId ? { ...c, status } : c))
      );
      toast.success(`Ticket status set to ${status}`);
      return true;
    } catch (err) {
      toast.error("Failed to update ticket status");
      return false;
    }
  };

  const createTicket = async (ticketData) => {
    try {
      const res = await api.post("/complaints", ticketData);
      setComplaints((prev) => [res.data, ...prev]);
      toast.success("Maintenance ticket submitted");
      return true;
    } catch (err) {
      toast.error("Failed to submit ticket");
      return false;
    }
  };

  return {
    complaints,
    loading,
    error,
    refresh: fetchComplaints,
    updateTicketStatus,
    createTicket,
  };
}
