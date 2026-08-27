import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db, PROPERTY_PATH } from "../lib/firebase";
import { useFirestoreCollection } from "./useFirestoreCollection";
import { toast } from "sonner";

export function useRooms() {
  const { data: rooms, loading, error } = useFirestoreCollection(`${PROPERTY_PATH}/rooms`);

  const saveRoom = async (roomData) => {
    try {
      const roomId = roomData.id || `room_${Date.now()}`;
      const docRef = doc(db, `${PROPERTY_PATH}/rooms`, roomId);
      
      const payload = {
        ...roomData,
        roomNumber: String(roomData.roomNumber || roomData.name || ""),
        floor: String(roomData.floor || "1"),
        roomType: roomData.roomType || roomData.room_type || "standard",
        capacity: Number(roomData.capacity) || 1,
        monthlyPrice: Number(roomData.monthlyPrice || roomData.price) || 0,
        deposit: Number(roomData.deposit) || 0,
        status: (roomData.status || "AVAILABLE").toUpperCase(),
        facilities: Array.isArray(roomData.facilities) ? roomData.facilities : [],
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, payload, { merge: true });
      toast.success("Data kamar berhasil disimpan");
      return true;
    } catch (err) {
      toast.error("Gagal menyimpan kamar: " + err.message);
      return false;
    }
  };

  const updateRoomStatus = async (roomId, newStatus) => {
    try {
      const docRef = doc(db, `${PROPERTY_PATH}/rooms`, roomId);
      await updateDoc(docRef, {
        status: newStatus.toUpperCase(),
        updatedAt: serverTimestamp(),
      });
      toast.success(`Status kamar diubah ke ${newStatus}`);
      return true;
    } catch (err) {
      toast.error("Gagal memperbarui status: " + err.message);
      return false;
    }
  };

  const deleteRoom = async (roomId) => {
    try {
      await deleteDoc(doc(db, `${PROPERTY_PATH}/rooms`, roomId));
      toast.success("Kamar berhasil dihapus");
      return true;
    } catch (err) {
      toast.error("Gagal menghapus kamar: " + err.message);
      return false;
    }
  };

  return {
    rooms,
    loading,
    error,
    saveRoom,
    updateRoomStatus,
    deleteRoom,
  };
}

export default useRooms;
