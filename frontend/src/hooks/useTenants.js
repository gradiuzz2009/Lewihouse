import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";

export function useTenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/tenants");
      setTenants(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to load tenants";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const saveTenant = async (tenantData) => {
    try {
      if (tenantData.id) {
        const res = await api.put(`/tenants/${tenantData.id}`, tenantData);
        setTenants((prev) => prev.map((t) => (t.id === tenantData.id ? res.data : t)));
        toast.success("Tenant profile updated");
      } else {
        const res = await api.post("/tenants", tenantData);
        setTenants((prev) => [...prev, res.data]);
        toast.success("Tenant registered successfully");
      }
      return true;
    } catch (err) {
      toast.error("Failed to save tenant profile");
      return false;
    }
  };

  const deleteTenant = async (tenantId) => {
    try {
      await api.delete(`/tenants/${tenantId}`);
      setTenants((prev) => prev.filter((t) => t.id !== tenantId));
      toast.success("Tenant record archived");
      return true;
    } catch (err) {
      toast.error("Failed to delete tenant");
      return false;
    }
  };

  return {
    tenants,
    loading,
    error,
    refresh: fetchTenants,
    saveTenant,
    deleteTenant,
  };
}
