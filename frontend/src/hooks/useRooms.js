import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";

export function useRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/rooms");
      setRooms(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to load rooms";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const updateRoomStatus = async (roomId, newStatus) => {
    try {
      await api.post(`/rooms/${roomId}/status`, { status: newStatus });
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r))
      );
      toast.success(`Room status updated to ${newStatus}`);
      return true;
    } catch (err) {
      toast.error("Failed to update room status");
      return false;
    }
  };

  const saveRoom = async (roomData) => {
    try {
      if (roomData.id) {
        const res = await api.put(`/rooms/${roomData.id}`, roomData);
        setRooms((prev) => prev.map((r) => (r.id === roomData.id ? res.data : r)));
        toast.success("Room updated successfully");
      } else {
        const res = await api.post("/rooms", roomData);
        setRooms((prev) => [...prev, res.data]);
        toast.success("Room added successfully");
      }
      return true;
    } catch (err) {
      toast.error("Failed to save room");
      return false;
    }
  };

  const deleteRoom = async (roomId) => {
    try {
      await api.delete(`/rooms/${roomId}`);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      toast.success("Room removed");
      return true;
    } catch (err) {
      toast.error("Failed to delete room");
      return false;
    }
  };

  return {
    rooms,
    loading,
    error,
    refresh: fetchRooms,
    updateRoomStatus,
    saveRoom,
    deleteRoom,
  };
}
