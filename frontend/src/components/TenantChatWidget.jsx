import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, Send, X, Paperclip, Smile, Image as ImageIcon,
  FileText, Clock, ShieldCheck, Sparkles, AlertCircle, Volume2, VolumeX,
  ChevronDown, DoorOpen
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useChatMessages } from "../hooks/useChatMessages";
import { chatSound } from "../lib/chatSound";
import { ChatMessageBubble, formatChatDateHeader } from "./ChatMessageBubble";
import ImageLightbox from "./ImageLightbox";
import { toast } from "sonner";

const QUICK_EMOJIS = ["👋", "👍", "🙏", "✅", "💡", "❓", "😊", "🏢"];

const STARTER_PILLS = [
  { id: "ac", label: "❄️ Lapor AC", text: "Halo admin, AC kamar saya kurang dingin/bocor. Mohon bantuannya untuk dicek." },
  { id: "pay", label: "💳 Konfirmasi Bayar", text: "Halo admin, saya sudah melakukan pembayaran tagihan sewa/listrik bulan ini. Mohon verifikasinya." },
  { id: "clean", label: "🧹 Jadwal Bersih", text: "Halo admin, bolehkah dijadwalkan pembersihan area kosan/kamar?" },
  { id: "wifi", label: "📶 Info Wi-Fi", text: "Halo admin, koneksi internet Wi-Fi di kamar saya sedang lambat/terputus. Mohon dicek routernya." },
];

export default function TenantChatWidget({ tenant, room, isFloating = true, defaultOpen = false }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(chatSound.isSoundEnabled());

  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const tenantId = user?.id || user?.uid || tenant?.id || "anonymous_tenant";
  const { 
    messages, 
    loadingMessages, 
    loadingOlder,
    hasMoreOlder,
    loadOlderMessages,
    sendMessage, 
    retryMessage,
    deleteFailedMessage,
    typingUsers, 
    setTyping, 
    markAsRead, 
    threads 
  } = useChatMessages(tenantId, user);

  const currentThread = threads.find((t) => (t.tenantId || t.id) === tenantId);
  const unreadCount = currentThread?.unreadTenantCount || 0;

  // Operating Hours Check (08:00 - 20:00 WIB)
  const isOperatingHours = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= 8 && currentHour < 20;
  }, []);

  const assignedRoom = room?.name || tenant?.room_name || tenant?.roomNumber || user?.room || "-";

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 60);
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      markAsRead(tenantId);
    }
  }, [isOpen, messages.length, scrollToBottom, markAsRead, tenantId]);

  const handleInputChange = (e) => {
    setText(e.target.value);
    if (e.target.value.trim()) {
      setTyping(true);
    } else {
      setTyping(false);
    }
  };

  const toggleSound = () => {
    const updated = chatSound.toggleSound();
    setSoundEnabled(updated);
    toast.info(updated ? "Suara notifikasi aktif 🔔" : "Suara notifikasi dimatikan 🔕");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal adalah 10MB");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Format file harus berupa JPG, PNG, WEBP, atau PDF");
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploadProgress(0);
  };

  const handleSend = async (overrideText = null) => {
    const cleanText = (overrideText !== null ? overrideText : text).trim();
    if (!cleanText && !selectedFile) return;

    setIsUploading(true);
    setUploadProgress(25);
    let attachmentPayload = null;

    if (selectedFile) {
      try {
        setUploadProgress(60);
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
        setUploadProgress(90);

        attachmentPayload = {
          fileUrl: base64Data,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
        };
      } catch (err) {
        toast.error("Gagal memproses file lampiran");
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }
    }

    const success = await sendMessage(cleanText, {
      recipientDetails: {
        name: tenant?.name || tenant?.fullName || user?.name || "Penghuni",
        roomNumber: assignedRoom,
      },
      attachment: attachmentPayload,
    });

    if (success) {
      setText("");
      removeSelectedFile();
      setShowEmojiPicker(false);
      inputRef.current?.focus();
    }
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adminTyping = typingUsers.find((u) => u.role === "ADMIN");

  return (
    <>
      {/* Lightbox for full screen image viewing */}
      {lightboxImg && (
        <ImageLightbox
          src={lightboxImg.url}
          alt={lightboxImg.alt}
          onClose={() => setLightboxImg(null)}
        />
      )}

      {/* Floating Launcher Trigger */}
      {isFloating && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50">
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsOpen((prev) => !prev)}
            className="relative w-14 h-14 rounded-full bg-primary text-white shadow-lifted flex items-center justify-center hover:bg-[#122820] transition-colors border-2 border-surface"
            data-testid="tenant-chat-widget-trigger"
            aria-label="Buka Chat Bantuan"
          >
            {isOpen ? <X size={24} /> : <MessageCircle size={26} />}
            {!isOpen && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full bg-danger text-white text-[11px] font-bold grid place-items-center shadow-soft border-2 border-surface animate-bounce">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </motion.button>
        </div>
      )}

      {/* Main Support Panel */}
      <AnimatePresence>
        {(isOpen || !isFloating) && (
          <motion.div
            initial={isFloating ? { opacity: 0, y: 20, scale: 0.96 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`${
              isFloating
                ? "fixed bottom-24 right-4 sm:right-6 w-[92vw] max-w-[390px] h-[560px] max-h-[82vh] z-50 rounded-3xl shadow-lifted border border-line"
                : "w-full h-full min-h-[480px] rounded-3xl border border-line"
            } bg-surface flex flex-col overflow-hidden`}
            data-testid="tenant-chat-panel"
          >
            {/* Header: Context Kosan & Room Label */}
            <div className="px-4 py-3 bg-primary text-white flex items-center justify-between shadow-soft shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 grid place-items-center border border-white/20">
                    <ShieldCheck size={20} className="text-emerald-300" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif font-bold text-sm leading-tight truncate">
                    Tim Support Lewi House
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/80 mt-0.5 truncate">
                    <span className="px-1.5 py-0.2 rounded bg-white/20 font-bold text-[10px] truncate">
                      Kamar {assignedRoom}
                    </span>
                    <span>·</span>
                    <span className="truncate">Respon Cepat</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={toggleSound}
                  title={soundEnabled ? "Matikan Suara" : "Nyalakan Suara"}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 transition-colors"
                >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                {isFloating && (
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Non-Operating Hours Banner */}
            {!isOperatingHours ? (
              <div className="px-3.5 py-2 bg-amber-500/10 border-b border-amber-500/20 text-[11px] text-amber-900 flex items-center gap-2">
                <Clock size={14} className="text-amber-600 shrink-0" />
                <span>
                  Tim support aktif <strong>08:00 – 20:00 WIB</strong>. Pesan Anda akan dibalas saat jam operasional.
                </span>
              </div>
            ) : (
              <div className="px-3.5 py-1.5 bg-emerald-500/5 border-b border-emerald-500/15 text-[11px] text-emerald-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Jam Operasional Aktif
                </span>
                <span className="text-[10px] text-subtle">Darurat 24/7</span>
              </div>
            )}

            {/* Timeline Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-muted/20">
              {/* Pagination scroll button */}
              {hasMoreOlder && (
                <div className="text-center py-2">
                  <button
                    onClick={loadOlderMessages}
                    disabled={loadingOlder}
                    className="px-3 py-1 rounded-full bg-surface border border-line text-[11px] text-primary font-bold shadow-xs hover:bg-muted active:scale-95 disabled:opacity-50"
                  >
                    {loadingOlder ? "Memuat riwayat lama..." : "↑ Muat Pesan Sebelumnya"}
                  </button>
                </div>
              )}

              {loadingMessages && messages.length === 0 ? (
                <div className="py-20 text-center text-xs text-subtle animate-pulse">
                  Menghubungkan ke tim support...
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-subtle px-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-3 grid place-items-center">
                    <Sparkles size={22} />
                  </div>
                  <p className="font-bold text-ink text-sm">Ada kendala atau pertanyaan?</p>
                  <p className="mt-1 text-subtle leading-relaxed">
                    Kirim pesan atau gunakan pilihan cepat di bawah untuk langsung terhubung dengan pengelola.
                  </p>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isMe = m.senderRole === "TENANT";
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const dateHeader = formatChatDateHeader(m.created_at || m.timestamp);
                  const prevDateHeader = prevMsg ? formatChatDateHeader(prevMsg.created_at || prevMsg.timestamp) : null;
                  const showDateDivider = !prevMsg || dateHeader !== prevDateHeader;

                  // 2-Minute Consecutive Message Grouping
                  let isGrouped = false;
                  if (prevMsg && !showDateDivider && prevMsg.senderRole === m.senderRole && !m.isInternalNote && !prevMsg.isInternalNote) {
                    const currentTs = new Date(m.created_at || m.timestamp).getTime();
                    const prevTs = new Date(prevMsg.created_at || prevMsg.timestamp).getTime();
                    if (currentTs - prevTs < 2 * 60 * 1000) {
                      isGrouped = true;
                    }
                  }

                  return (
                    <React.Fragment key={m.id}>
                      {showDateDivider && (
                        <div className="text-center my-3 select-none">
                          <span className="inline-block px-3 py-0.5 rounded-full bg-surface text-[10px] font-bold text-subtle border border-line shadow-2xs">
                            {dateHeader}
                          </span>
                        </div>
                      )}

                      <ChatMessageBubble
                        message={m}
                        isMe={isMe}
                        isGrouped={isGrouped}
                        onImageClick={(url, name) => setLightboxImg({ url, alt: name })}
                        onRetry={(failedMsg) => retryMessage(failedMsg)}
                        onDelete={(failedMsgId) => deleteFailedMessage(failedMsgId)}
                      />
                    </React.Fragment>
                  );
                })
              )}

              {/* Admin Typing Indicator */}
              {adminTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-subtle text-[11px] px-2 py-1 mt-2"
                >
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                  </div>
                  <span>Admin sedang mengetik...</span>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Sticky Starter Action Chips */}
            <div className="px-3 py-1.5 bg-surface border-t border-line flex items-center gap-1.5 overflow-x-auto select-none">
              {STARTER_PILLS.map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => handleSend(pill.text)}
                  className="px-2.5 py-1 rounded-full bg-muted/80 hover:bg-muted border border-line text-[11px] font-semibold text-ink whitespace-nowrap active:scale-95 transition-all shadow-2xs hover:border-primary/40"
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Dismissible Attachment Upload Progress Tray */}
            {selectedFile && (
              <div className="px-4 py-2 bg-muted border-t border-line flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-line shrink-0 bg-surface grid place-items-center">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <FileText size={20} className="text-primary" />
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 grid place-items-center text-[10px] text-white font-bold">
                        {uploadProgress}%
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink truncate text-xs">{selectedFile.name}</p>
                    <p className="text-[10px] text-subtle">
                      {(selectedFile.size / 1024).toFixed(1)} KB · {isUploading ? "Mengunggah..." : "Siap dikirim"}
                    </p>
                  </div>
                </div>
                {!isUploading && (
                  <button
                    onClick={removeSelectedFile}
                    className="p-1 rounded-full hover:bg-surface text-subtle hover:text-danger transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Quick Emoji Strip */}
            {showEmojiPicker && (
              <div className="px-3 py-1.5 bg-surface border-t border-line flex items-center gap-1.5 overflow-x-auto">
                {QUICK_EMOJIS.map((em) => (
                  <button
                    key={em}
                    onClick={() => setText((prev) => prev + em)}
                    className="p-1 text-base hover:scale-125 transition-transform"
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 bg-surface border-t border-line shrink-0">
              <div className="flex items-end gap-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Lampirkan File (Gambar/PDF < 10MB)"
                  className="p-2 rounded-xl text-subtle hover:text-primary hover:bg-muted active:scale-95 transition-all"
                >
                  <Paperclip size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  title="Pilih Emoji"
                  className="p-2 rounded-xl text-subtle hover:text-primary hover:bg-muted active:scale-95 transition-all"
                >
                  <Smile size={18} />
                </button>

                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Tulis pesan untuk admin..."
                  rows={1}
                  maxLength={2000}
                  className="flex-1 resize-none rounded-2xl bg-muted px-3.5 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all max-h-24 min-h-[38px]"
                />

                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleSend()}
                  disabled={(!text.trim() && !selectedFile) || isUploading}
                  className="w-10 h-10 rounded-2xl bg-primary text-white grid place-items-center disabled:opacity-40 flex-shrink-0 shadow-soft hover:bg-[#122820] transition-colors"
                >
                  <Send size={15} />
                </motion.button>
              </div>

              {text.length > 1500 && (
                <p className="text-[10px] text-right text-subtle mt-1">{text.length}/2000</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
