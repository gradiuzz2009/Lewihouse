import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, PROPERTY_PATH } from "../lib/firebase";
import { useFirestoreCollection } from "./useFirestoreCollection";
import { toast } from "sonner";

export function useBills() {
  const { data: bills, loading, error } = useFirestoreCollection(`${PROPERTY_PATH}/payments`);

  const recordPayment = async (paymentId, paymentData) => {
    try {
      const docRef = doc(db, `${PROPERTY_PATH}/payments`, paymentId);
      await updateDoc(docRef, {
        ...paymentData,
        status: "PAID",
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Pembayaran berhasil dikonfirmasi");
      return true;
    } catch (err) {
      toast.error("Gagal memperbarui pembayaran: " + err.message);
      return false;
    }
  };

  return { bills, loading, error, recordPayment };
}

export default useBills;
