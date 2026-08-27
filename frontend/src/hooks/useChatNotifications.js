import { useState, useEffect, useRef, useCallback } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db, PROPERTY_PATH } from "../lib/firebase";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";

export function useChatNotifications(currentUser) {
  const [totalUnread, setTotalUnread] = useState(0);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission === "granted" : false
  );
  const navigate = useNavigate();
  const location = useLocation();
  const isInitialMount = useRef(true);
  const prevMessageIds = useRef(new Set());

  const isTenant = currentUser?.role === "tenant";
  const userId = currentUser?.id || currentUser?.uid;

  // Request HTML5 Web Notification Permission
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        setHasNotificationPermission(permission === "granted");
        return permission === "granted";
      } catch (err) {
        console.debug("Notification permission request failed", err);
        return false;
      }
    }
    return false;
  }, []);

  // 1. Thread-level listener for global unread counter calculation
  useEffect(() => {
    if (!currentUser) return;

    const threadsRef = collection(db, `${PROPERTY_PATH}/chat_threads`);
    const q = query(threadsRef, orderBy("updatedAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let count = 0;
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (isTenant) {
            if ((data.tenantId || docSnap.id) === userId) {
              count += data.unreadTenantCount || (data.lastSenderRole === "ADMIN" && data.unreadCount > 0 ? data.unreadCount : 0);
            }
          } else {
            count += data.unreadAdminCount || (data.lastSenderRole === "TENANT" && data.unreadCount > 0 ? data.unreadCount : 0);
          }
        });
        setTotalUnread(count);
      },
      (err) => {
        console.debug("[Chat Notifications Counter Error]:", err);
      }
    );

    return () => unsubscribe();
  }, [currentUser, isTenant, userId]);

  // 2. Real-time In-App Toasts & Background Push Listener
  useEffect(() => {
    if (!currentUser) return;

    const threadsRef = collection(db, `${PROPERTY_PATH}/chat_threads`);
    const unsubscribe = onSnapshot(threadsRef, (snapshot) => {
      // Skip alerting on the very first mount
      if (isInitialMount.current) {
        snapshot.docs.forEach((d) => {
          const data = d.data();
          if (data.lastTimestamp) prevMessageIds.current.add(d.id + "_" + (data.lastMessage || ""));
        });
        isInitialMount.current = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified" || change.type === "added") {
          const data = change.doc.data();
          const threadId = change.doc.id;
          const key = threadId + "_" + (data.lastMessage || "");

          if (!prevMessageIds.current.has(key)) {
            prevMessageIds.current.add(key);

            const isIncoming = isTenant
              ? data.lastSenderRole === "ADMIN" && (data.tenantId || threadId) === userId
              : data.lastSenderRole === "TENANT";

            // If we are already on the active chat page looking at this thread, skip popup toast
            const isCurrentlyOnChatPage = location.pathname.startsWith("/chat");
            const isCurrentlyOnPortal = location.pathname.startsWith("/portal");

            if (isIncoming && data.lastMessage) {
              const sender = isTenant ? "Tim Admin Lewi House" : data.tenantName || "Penghuni Kamar " + (data.roomNumber || "-");
              
              // In-App Toast (Sonner)
              toast(sender, {
                description: data.lastMessage.length > 60 ? data.lastMessage.substring(0, 57) + "..." : data.lastMessage,
                action: {
                  label: "Lihat Pesan",
                  onClick: () => {
                    if (isTenant) {
                      navigate("/portal?tab=chat");
                    } else {
                      navigate(`/chat?thread=${threadId}`);
                    }
                  },
                },
              });

              // Background / Inactive Tab Desktop Notification
              if (document.hidden && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                try {
                  const notification = new Notification(`Pesan Baru: ${sender}`, {
                    body: data.lastMessage,
                    icon: "/favicon.ico",
                  });
                  notification.onclick = () => {
                    window.focus();
                    if (isTenant) {
                      navigate("/portal?tab=chat");
                    } else {
                      navigate(`/chat?thread=${threadId}`);
                    }
                  };
                } catch (e) {}
              }
            }
          }
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser, isTenant, userId, location.pathname, navigate]);

  return {
    totalUnread,
    hasNotificationPermission,
    requestNotificationPermission,
    isPushSupported: typeof window !== "undefined" && "Notification" in window,
  };
}

export default useChatNotifications;
