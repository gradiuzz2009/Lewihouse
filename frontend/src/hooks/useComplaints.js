import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, PROPERTY_PATH } from "../lib/firebase";
import { useFirestoreCollection } from "./useFirestoreCollection";
import { toast } from "sonner";

export function useComplaints() {
  const { data: complaints, loading, error } = useFirestoreCollection(`${PROPERTY_PATH}/maintenance_tickets`);

  const updateTicketStatus = async (ticketId, status) => {
    try {
      const docRef = doc(db, `${PROPERTY_PATH}/maintenance_tickets`, ticketId);
      await updateDoc(docRef, {
        status: status.toUpperCase(),
        resolvedAt: status === "RESOLVED" ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Status keluhan diubah ke ${status}`);
      return true;
    } catch (err) {
      toast.error("Gagal mengupdate keluhan: " + err.message);
      return false;
    }
  };

  const createTicket = async (ticketData) => {
    try {
      const ticketId = `ticket_${Date.now()}`;
      const docRef = doc(db, `${PROPERTY_PATH}/maintenance_tickets`, ticketId);
      await setDoc(docRef, {
        ...ticketData,
        status: "SUBMITTED",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Laporan keluhan terkirim");
      return true;
    } catch (err) {
      toast.error("Gagal mengirim laporan keluhan: " + err.message);
      return false;
    }
  };

  return { complaints, loading, error, updateTicketStatus, createTicket };
}

export default useComplaints;
