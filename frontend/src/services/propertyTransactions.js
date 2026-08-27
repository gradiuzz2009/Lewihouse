import { writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { db, PROPERTY_PATH } from "../lib/firebase";

/**
 * Atomically assigns a resident to a room and marks room OCCUPIED.
 */
export async function assignTenantMoveIn({ tenantData, roomId, roomNumber }) {
  const batch = writeBatch(db);
  const tenantId = tenantData.id || `resident_${Date.now()}`;
  
  const tenantDocRef = doc(db, `${PROPERTY_PATH}/residents`, tenantId);
  const roomDocRef = doc(db, `${PROPERTY_PATH}/rooms`, roomId);

  const residentPayload = {
    id: tenantId,
    fullName: tenantData.fullName || tenantData.name || "",
    email: tenantData.email || "",
    phone: tenantData.phone || "",
    roomNumber: roomNumber || tenantData.roomNumber || "",
    roomId: roomId,
    moveInDate: tenantData.lease_start || tenantData.moveInDate || new Date().toISOString(),
    leaseEndDate: tenantData.lease_end || tenantData.leaseEndDate || "",
    monthlyRent: Number(tenantData.monthlyRent || tenantData.rent_amount) || 0,
    depositAmount: Number(tenantData.depositAmount || tenantData.deposit_amount) || 0,
    status: "ACTIVE",
    updatedAt: serverTimestamp(),
  };

  const roomPayload = {
    status: "OCCUPIED",
    currentTenantId: tenantId,
    currentTenantName: residentPayload.fullName,
    updatedAt: serverTimestamp(),
  };

  batch.set(tenantDocRef, residentPayload, { merge: true });
  batch.update(roomDocRef, roomPayload);

  await batch.commit();
  return { tenantId, roomId };
}

/**
 * Atomically checks out a resident and releases room to AVAILABLE.
 */
export async function releaseTenantCheckout({ tenantId, roomId }) {
  const batch = writeBatch(db);

  const tenantDocRef = doc(db, `${PROPERTY_PATH}/residents`, tenantId);
  const roomDocRef = doc(db, `${PROPERTY_PATH}/rooms`, roomId);

  batch.update(tenantDocRef, {
    status: "ARCHIVED",
    moveOutDate: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });

  batch.update(roomDocRef, {
    status: "AVAILABLE",
    currentTenantId: null,
    currentTenantName: null,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}
