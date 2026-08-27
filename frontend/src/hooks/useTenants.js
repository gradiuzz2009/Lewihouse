import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db, PROPERTY_PATH } from "../lib/firebase";
import { useFirestoreCollection } from "./useFirestoreCollection";
import { toast } from "sonner";

export function useTenants() {
  const { data: tenants, loading, error } = useFirestoreCollection(`${PROPERTY_PATH}/residents`);

  const saveTenant = async (tenantData) => {
    try {
      const tenantId = tenantData.id || `resident_${Date.now()}`;
      const docRef = doc(db, `${PROPERTY_PATH}/residents`, tenantId);
      
      const payload = {
        ...tenantData,
        fullName: tenantData.fullName || tenantData.name || "",
        email: tenantData.email || "",
        phone: tenantData.phone || "",
        roomNumber: tenantData.roomNumber || tenantData.room_name || "",
        status: (tenantData.status || "ACTIVE").toUpperCase(),
        monthlyRent: Number(tenantData.monthlyRent || tenantData.rent_amount) || 0,
        depositAmount: Number(tenantData.depositAmount || tenantData.deposit_amount) || 0,
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, payload, { merge: true });
      toast.success("Profil penghuni tersimpan");
      return true;
    } catch (err) {
      toast.error("Gagal menyimpan data penghuni: " + err.message);
      return false;
    }
  };

  const deleteTenant = async (tenantId) => {
    try {
      await deleteDoc(doc(db, `${PROPERTY_PATH}/residents`, tenantId));
      toast.success("Data penghuni diarsipkan");
      return true;
    } catch (err) {
      toast.error("Gagal menghapus penghuni: " + err.message);
      return false;
    }
  };

  return {
    tenants,
    loading,
    error,
    saveTenant,
    deleteTenant,
  };
}

export default useTenants;
