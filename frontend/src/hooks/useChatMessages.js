import { useState, useEffect, useRef, useCallback } from "react";
import { 
  collection, 
  doc, 
  query, 
  orderBy, 
  limitToLast,
  startAt,
  endBefore,
  getDocs,
  onSnapshot, 
  writeBatch,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db, PROPERTY_PATH } from "../lib/firebase";
import { toast } from "sonner";
import { chatSound } from "../lib/chatSound";

const PAGE_SIZE = 30;

export function useChatMessages(activeThreadId, currentUser) {
  const [messages, setMessages] = useState([]);
  const [threads, setThreads] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [activeViewers, setActiveViewers] = useState([]);
  
  const firstDocRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const presenceIntervalRef = useRef(null);
  const isInitialMsgLoad = useRef(true);

  const isTenant = currentUser?.role === "tenant";
  const userId = currentUser?.id || currentUser?.uid || "anonymous_user";
  const userName = currentUser?.name || currentUser?.fullName || (isTenant ? "Penghuni" : "Admin Lewi House");

  // 1. Real-time listener for Chat Threads (Inbox Directory)
  useEffect(() => {
    const threadsRef = collection(db, `${PROPERTY_PATH}/chat_threads`);
    const q = query(threadsRef, orderBy("updatedAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const lastTs = data.lastTimestamp?.toDate ? data.lastTimestamp.toDate().getTime() : Date.now();
          const isUrgent = !isTenant && (data.unreadAdminCount > 0 || (data.lastSenderRole === "TENANT" && data.unreadCount > 0)) && (Date.now() - lastTs > 15 * 60 * 1000);

          return {
            tenant_id: docSnap.id,
            id: docSnap.id,
            isUrgent,
            ...data,
          };
        });

        if (isTenant) {
          const tenantThreads = list.filter(
            (t) => (t.tenantId || t.tenant_id || t.id) === userId
          );
          setThreads(tenantThreads);
        } else {
          setThreads(list);
        }
        setLoadingThreads(false);
      },
      (err) => {
        console.error("[Chat Threads Error]:", err);
        setLoadingThreads(false);
      }
    );

    return () => unsubscribe();
  }, [isTenant, userId]);

  // 2. Real-time listener for Active Conversation (Limited to last 30 for cost & performance)
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      firstDocRef.current = null;
      setHasMoreOlder(false);
      return;
    }

    setLoadingMessages(true);
    isInitialMsgLoad.current = true;
    const messagesRef = collection(db, `${PROPERTY_PATH}/chats/${activeThreadId}/messages`);
    const q = query(messagesRef, orderBy("timestamp", "asc"), limitToLast(PAGE_SIZE));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          firstDocRef.current = snapshot.docs[0];
          setHasMoreOlder(snapshot.docs.length >= PAGE_SIZE);
        } else {
          firstDocRef.current = null;
          setHasMoreOlder(false);
        }

        const msgs = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          // Hide internal notes from tenant
          if (isTenant && data.isInternalNote) return;

          msgs.push({
            id: docSnap.id,
            ...data,
            created_at: data.timestamp?.toDate
              ? data.timestamp.toDate().toISOString()
              : (data.timestamp || new Date().toISOString()),
          });
        });

        // Trigger gentle audio chime if new incoming message arrives
        if (!isInitialMsgLoad.current && msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          const isIncoming = (isTenant && lastMsg.senderRole === "ADMIN") || (!isTenant && lastMsg.senderRole === "TENANT");
          if (isIncoming && (!document.hasFocus() || document.hidden)) {
            chatSound.playIncomingChime();
          }
        }
        isInitialMsgLoad.current = false;

        setMessages((prev) => {
          // Preserve any local failed / pending messages not yet confirmed
          const localPending = prev.filter((p) => p.deliveryStatus === "failed" || p.deliveryStatus === "pending");
          const merged = [...msgs];
          localPending.forEach((lp) => {
            if (!merged.some((m) => m.id === lp.id)) {
              merged.push(lp);
            }
          });
          return merged;
        });
        setLoadingMessages(false);
      },
      (err) => {
        console.error("[Chat Messages Error]:", err);
        setLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [activeThreadId, isTenant]);

  // 3. Cursor-based Pagination: Load older message batches
  const loadOlderMessages = useCallback(async () => {
    if (!activeThreadId || loadingOlder || !hasMoreOlder || !firstDocRef.current) return;

    setLoadingOlder(true);
    try {
      const messagesRef = collection(db, `${PROPERTY_PATH}/chats/${activeThreadId}/messages`);
      const q = query(
        messagesRef,
        orderBy("timestamp", "asc"),
        endBefore(firstDocRef.current),
        limitToLast(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        firstDocRef.current = snapshot.docs[0];
        setHasMoreOlder(snapshot.docs.length >= PAGE_SIZE);

        const olderMsgs = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (isTenant && data.isInternalNote) return;

          olderMsgs.push({
            id: docSnap.id,
            ...data,
            created_at: data.timestamp?.toDate
              ? data.timestamp.toDate().toISOString()
              : (data.timestamp || new Date().toISOString()),
          });
        });

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueOlder = olderMsgs.filter((m) => !existingIds.has(m.id));
          return [...uniqueOlder, ...prev];
        });
      } else {
        setHasMoreOlder(false);
      }
    } catch (err) {
      console.error("[Load Older Messages Error]:", err);
    } finally {
      setLoadingOlder(false);
    }
  }, [activeThreadId, loadingOlder, hasMoreOlder, isTenant]);

  // 4. Real-time Typing Presence Listener with 4s TTL
  useEffect(() => {
    if (!activeThreadId) {
      setTypingUsers([]);
      return;
    }

    const typingRef = collection(db, `${PROPERTY_PATH}/chats/${activeThreadId}/typing`);
    const unsubscribe = onSnapshot(typingRef, (snapshot) => {
      const now = Date.now();
      const active = [];
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (docSnap.id !== userId && data.isTyping) {
          const lastUpdated = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.clientTimestamp || now);
          if (now - lastUpdated < 4000) {
            active.push({
              userId: docSnap.id,
              userName: data.userName || "Seseorang",
              role: data.role || "ADMIN",
            });
          }
        }
      });
      setTypingUsers(active);
    });

    return () => unsubscribe();
  }, [activeThreadId, userId]);

  // 5. Multi-Admin Presence Collision Tracking (Prevents duplicate replies)
  useEffect(() => {
    if (!activeThreadId || isTenant) {
      setActiveViewers([]);
      return;
    }

    const presenceDoc = doc(db, `${PROPERTY_PATH}/chats/${activeThreadId}/presence`, userId);
    
    // Heartbeat presence update
    const updatePresence = async () => {
      try {
        await setDoc(
          presenceDoc,
          {
            userId,
            adminName: userName,
            lastActive: serverTimestamp(),
            clientTimestamp: Date.now(),
          },
          { merge: true }
        );
      } catch (e) {}
    };

    updatePresence();
    presenceIntervalRef.current = setInterval(updatePresence, 10000);

    // Listen for other admins in this conversation
    const presenceCol = collection(db, `${PROPERTY_PATH}/chats/${activeThreadId}/presence`);
    const unsubscribe = onSnapshot(presenceCol, (snapshot) => {
      const now = Date.now();
      const viewers = [];
      snapshot.docs.forEach((d) => {
        if (d.id !== userId) {
          const data = d.data();
          const lastActive = data.lastActive?.toMillis ? data.lastActive.toMillis() : (data.clientTimestamp || 0);
          if (now - lastActive < 25000) {
            viewers.push({
              id: d.id,
              name: data.adminName || "Admin Lain",
            });
          }
        }
      });
      setActiveViewers(viewers);
    });

    // Cleanup on unmount / thread change / tab close
    const handleUnload = () => {
      deleteDoc(presenceDoc).catch(() => {});
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      if (presenceIntervalRef.current) clearInterval(presenceIntervalRef.current);
      deleteDoc(presenceDoc).catch(() => {});
      unsubscribe();
    };
  }, [activeThreadId, isTenant, userId, userName]);

  // 6. Typing status setter with debounce & TTL
  const setTyping = useCallback(
    async (isTyping) => {
      if (!activeThreadId || !userId) return;

      try {
        const userTypingDoc = doc(db, `${PROPERTY_PATH}/chats/${activeThreadId}/typing`, userId);
        if (isTyping) {
          await setDoc(
            userTypingDoc,
            {
              userName,
              role: isTenant ? "TENANT" : "ADMIN",
              isTyping: true,
              clientTimestamp: Date.now(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(async () => {
            try {
              await setDoc(userTypingDoc, { isTyping: false, updatedAt: serverTimestamp() }, { merge: true });
            } catch (e) {}
          }, 3000);
        } else {
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          await setDoc(userTypingDoc, { isTyping: false, updatedAt: serverTimestamp() }, { merge: true });
        }
      } catch (err) {}
    },
    [activeThreadId, userId, userName, isTenant]
  );

  // 7. Mark Messages as Read
  const markAsRead = useCallback(
    async (targetThreadId = activeThreadId) => {
      if (!targetThreadId || !userId) return;

      try {
        const threadDocRef = doc(db, `${PROPERTY_PATH}/chat_threads`, targetThreadId);
        if (isTenant) {
          await updateDoc(threadDocRef, { unreadTenantCount: 0 });
        } else {
          await updateDoc(threadDocRef, { unreadAdminCount: 0 });
        }

        const unreadMsgs = messages.filter(
          (m) =>
            !m.read &&
            ((isTenant && m.senderRole === "ADMIN") || (!isTenant && m.senderRole === "TENANT"))
        );

        if (unreadMsgs.length > 0) {
          const batch = writeBatch(db);
          unreadMsgs.forEach((msg) => {
            const msgRef = doc(db, `${PROPERTY_PATH}/chats/${targetThreadId}/messages`, msg.id);
            batch.update(msgRef, {
              read: true,
              deliveryStatus: "read",
              readAt: serverTimestamp(),
            });
          });
          await batch.commit();
        }
      } catch (err) {}
    },
    [activeThreadId, userId, isTenant, messages]
  );

  // 8. Atomic Message Dispatch with Offline & Failure Handling
  const sendMessage = async (text, options = {}) => {
    const {
      recipientDetails = {},
      attachment = null,
      isInternalNote = false,
      type = "text",
    } = options;

    const cleanText = (text || "").trim();
    if (!cleanText && !attachment) return false;
    if (!activeThreadId) return false;

    setTyping(false);

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const senderRole = isTenant ? "TENANT" : "ADMIN";

    // Optimistic pending state
    const optimisticMessage = {
      id: messageId,
      threadId: activeThreadId,
      senderId: userId,
      senderName: userName,
      senderRole: senderRole,
      isInternalNote: !!isInternalNote,
      type: attachment ? "attachment" : type,
      text: cleanText,
      attachment: attachment || null,
      deliveryStatus: "pending",
      read: false,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      rawOptions: { recipientDetails, attachment, isInternalNote, type, text: cleanText },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    chatSound.playSentSound();

    try {
      const batch = writeBatch(db);
      const messageDocRef = doc(db, `${PROPERTY_PATH}/chats/${activeThreadId}/messages`, messageId);
      const threadDocRef = doc(db, `${PROPERTY_PATH}/chat_threads`, activeThreadId);

      const messagePayload = {
        id: messageId,
        threadId: activeThreadId,
        senderId: userId,
        senderName: userName,
        senderRole: senderRole,
        isInternalNote: !!isInternalNote,
        type: attachment ? "attachment" : type,
        text: cleanText,
        attachment: attachment || null,
        deliveryStatus: "sent",
        read: false,
        timestamp: serverTimestamp(),
      };

      const threadName =
        recipientDetails.name ||
        recipientDetails.tenant_name ||
        recipientDetails.tenantName ||
        recipientDetails.fullName ||
        (isTenant ? userName : "Penghuni");

      const roomNumber =
        recipientDetails.room_name ||
        recipientDetails.roomNumber ||
        recipientDetails.room ||
        "-";

      const previewText = isInternalNote
        ? `[Catatan Internal] ${cleanText}`
        : attachment
        ? `📎 ${attachment.fileName || "Lampiran"}`
        : cleanText;

      const threadPayload = {
        tenantId: activeThreadId,
        tenantName: threadName,
        roomNumber: roomNumber,
        status: "open",
        lastMessage: previewText,
        lastTimestamp: serverTimestamp(),
        lastSenderRole: senderRole,
        updatedAt: serverTimestamp(),
      };

      if (!isInternalNote) {
        if (isTenant) {
          threadPayload.unreadAdminCount = (recipientDetails.unreadAdminCount || 0) + 1;
        } else {
          threadPayload.unreadTenantCount = (recipientDetails.unreadTenantCount || 0) + 1;
        }
      }

      batch.set(messageDocRef, messagePayload);
      batch.set(threadDocRef, threadPayload, { merge: true });

      await batch.commit();
      return true;
    } catch (err) {
      console.error("[Send Message Error]:", err);
      toast.error("Gagal mengirim pesan. Silakan coba kirim ulang.");
      // Mark as failed instead of disappearing
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, deliveryStatus: "failed" } : m))
      );
      return false;
    }
  };

  // 9. Retry Failed Message
  const retryMessage = async (failedMsg) => {
    if (!failedMsg || !failedMsg.rawOptions) return;
    setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
    await sendMessage(failedMsg.rawOptions.text, failedMsg.rawOptions);
  };

  const deleteFailedMessage = (msgId) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  // 10. Update Thread Status
  const updateThreadStatus = async (status) => {
    if (!activeThreadId) return false;
    try {
      const threadDocRef = doc(db, `${PROPERTY_PATH}/chat_threads`, activeThreadId);
      await updateDoc(threadDocRef, {
        status: status,
        updatedAt: serverTimestamp(),
      });

      const systemMessageId = `msg_sys_${Date.now()}`;
      const messageDocRef = doc(db, `${PROPERTY_PATH}/chats/${activeThreadId}/messages`, systemMessageId);
      await setDoc(messageDocRef, {
        id: systemMessageId,
        threadId: activeThreadId,
        senderId: "system",
        senderName: "Sistem",
        senderRole: "SYSTEM",
        isInternalNote: false,
        type: "system_event",
        text: status === "resolved" 
          ? `Percakapan ditandai selesai oleh ${userName}` 
          : `Percakapan dibuka kembali oleh ${userName}`,
        deliveryStatus: "sent",
        read: true,
        timestamp: serverTimestamp(),
      });

      toast.success(`Status tiket diubah menjadi ${status === "resolved" ? "Selesai" : "Buka"}`);
      return true;
    } catch (err) {
      toast.error("Gagal memperbarui status: " + err.message);
      return false;
    }
  };

  return {
    threads,
    messages,
    loadingThreads,
    loadingMessages,
    loadingOlder,
    hasMoreOlder,
    loadOlderMessages,
    typingUsers,
    activeViewers,
    setTyping,
    markAsRead,
    sendMessage,
    retryMessage,
    deleteFailedMessage,
    updateThreadStatus,
  };
}

export default useChatMessages;
