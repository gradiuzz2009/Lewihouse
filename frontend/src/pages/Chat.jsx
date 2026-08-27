import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fmtDateTime } from "../lib/api";
import { 
  MessageCircle, Send, ArrowLeft, User, Search, X, MessageSquarePlus, 
  DoorOpen, Phone, Check, CheckCheck, Clock, Paperclip, Smile, FileText,
  Lock, Sparkles, Filter, ChevronDown, CheckCircle2, AlertCircle, RefreshCw,
  Volume2, VolumeX, Eye, AlertTriangle, ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, AddButton } from "../components/PageHeader";
import { Sheet, Button, Input } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useChatMessages } from "../hooks/useChatMessages";
import { useTenants } from "../hooks/useTenants";
import { chatSound } from "../lib/chatSound";
import { ChatMessageBubble, formatChatDateHeader } from "../components/ChatMessageBubble";
import ImageLightbox from "../components/ImageLightbox";

const CANNED_RESPONSES = [
  { id: "tech_ontheway", label: "🔧 Teknisi Sedang Menuju Kamar", text: "Halo! Petugas teknisi kami sedang menuju ke kamar Anda untuk melakukan pengecekan. Mohon ditunggu ya." },
  { id: "pay_verified", label: "✅ Pembayaran Terverifikasi", text: "Terima kasih! Pembayaran Anda telah kami verifikasi. Bukti transaksi dan kuitansi digital dapat diakses pada menu Tagihan." },
  { id: "need_photo", label: "📸 Mohon Kirim Foto Kendala", text: "Mohon bantuannya untuk mengirimkan foto atau video singkat terkait kendala tersebut agar dapat kami tindak lanjuti dengan cepat." },
  { id: "office_hours", label: "⏰ Informasi Jam Operasional", text: "Pesan Anda telah kami terima. Kantor operasional Lewi House buka setiap hari pukul 08:00 – 20:00 WIB." },
  { id: "clean_schedule", label: "🧹 Konfirmasi Jadwal Bersih", text: "Baik, permintaan pembersihan kamar/area kosan telah kami jadwalkan dengan tim kebersihan." },
  { id: "resolved_ack", label: "🎉 Konfirmasi Penyelesaian Masalah", text: "Apakah kendala Anda sudah tertangani dengan baik? Jika sudah tidak ada masalah lain, percakapan ini akan kami tandai selesai." },
];

const QUICK_EMOJIS = ["👍", "🙏", "✅", "👋", "🔧", "🏢", "😊", "⏳"];

function ThreadDirectory({ 
  threads, 
  selectedId, 
  onSelect, 
  search, 
  setSearch, 
  statusFilter, 
  setStatusFilter, 
  onOpenNewChat 
}) {
  const filtered = useMemo(() => {
    return threads.filter((t) => {
      const matchSearch =
        !search ||
        (t.tenantName || t.name || t.tenant_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.roomNumber || t.room_name || "").toLowerCase().includes(search.toLowerCase());

      const threadStatus = t.status || "open";
      const unread = t.unreadAdminCount || (t.lastSenderRole === "TENANT" && t.unreadCount > 0 ? t.unreadCount : 0);

      let matchFilter = true;
      if (statusFilter === "unread") {
        matchFilter = unread > 0;
      } else if (statusFilter === "open") {
        matchFilter = threadStatus !== "resolved";
      } else if (statusFilter === "resolved") {
        matchFilter = threadStatus === "resolved";
      }

      return matchSearch && matchFilter;
    });
  }, [threads, search, statusFilter]);

  return (
    <div className="flex flex-col h-full bg-surface border-r border-line">
      {/* Search & Actions Header */}
      <div className="p-3 border-b border-line space-y-2 bg-surface">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              placeholder="Cari penghuni / kamar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-2 bg-muted rounded-xl text-xs border-none outline-none focus:ring-2 focus:ring-primary/20"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X size={12} className="text-subtle" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onOpenNewChat}
            data-testid="new-chat-btn"
            title="Mulai Chat Baru"
            className="h-8 px-2.5 rounded-xl bg-primary text-white flex items-center gap-1 active:scale-95 transition-transform shrink-0 shadow-soft hover:bg-[#122820] text-xs font-bold"
          >
            <MessageSquarePlus size={14} />
            <span className="hidden sm:inline">Baru</span>
          </button>
        </div>

        {/* Quick Filter Tabs: Semua, Belum Dibaca, Kamar Aktif, Selesai */}
        <div className="grid grid-cols-4 gap-1 bg-muted p-1 rounded-xl text-[11px] font-semibold">
          <button
            onClick={() => setStatusFilter("all")}
            className={`py-1 rounded-lg transition-colors text-center truncate px-1 ${
              statusFilter === "all" ? "bg-surface text-primary shadow-xs" : "text-subtle hover:text-ink"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setStatusFilter("unread")}
            className={`py-1 rounded-lg transition-colors text-center truncate px-1 ${
              statusFilter === "unread" ? "bg-surface text-primary shadow-xs" : "text-subtle hover:text-ink"
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setStatusFilter("open")}
            className={`py-1 rounded-lg transition-colors text-center truncate px-1 ${
              statusFilter === "open" ? "bg-surface text-primary shadow-xs" : "text-subtle hover:text-ink"
            }`}
          >
            Aktif
          </button>
          <button
            onClick={() => setStatusFilter("resolved")}
            className={`py-1 rounded-lg transition-colors text-center truncate px-1 ${
              statusFilter === "resolved" ? "bg-surface text-primary shadow-xs" : "text-subtle hover:text-ink"
            }`}
          >
            Selesai
          </button>
        </div>
      </div>

      {/* Directory List */}
      <div className="flex-1 overflow-y-auto divide-y divide-line/40">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-subtle text-xs px-4">
            <MessageCircle size={32} className="mx-auto mb-2 text-line" />
            <p className="font-semibold text-primary">Tidak ada percakapan</p>
            <p className="mt-0.5 text-subtle">
              {statusFilter !== "all" ? "Coba ganti filter di atas" : "Klik tombol Baru untuk menyapa penghuni"}
            </p>
          </div>
        ) : (
          filtered.map((t) => {
            const threadName = t.tenantName || t.name || t.tenant_name || "Penghuni";
            const tid = t.tenantId || t.tenant_id || t.id;
            const roomDisplay = t.roomNumber || t.room_name;
            const isSelected = selectedId === tid;
            const isResolved = t.status === "resolved";
            const unread = t.unreadAdminCount || (t.lastSenderRole === "TENANT" && t.unreadCount > 0 ? t.unreadCount : 0);
            const isUrgent = t.isUrgent; // Unanswered > 15 mins

            return (
              <button
                key={tid}
                onClick={() => onSelect(t)}
                data-testid={`chat-thread-${tid}`}
                className={`w-full flex items-center gap-3 px-3.5 py-3.5 text-left transition-colors cursor-pointer group ${
                  isSelected ? "bg-primary/10 border-l-4 border-primary" : "bg-surface hover:bg-muted/50"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 grid place-items-center font-serif font-bold text-primary text-sm border border-primary/20">
                    {threadName.charAt(0).toUpperCase()}
                  </div>
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[9px] font-bold grid place-items-center shadow-xs">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                  {isUrgent && (
                    <span
                      title="Pesan belum dibalas > 15 menit!"
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-500 border-2 border-surface animate-ping"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className={`font-bold text-xs truncate ${isSelected ? "text-primary" : "text-ink group-hover:text-primary"}`}>
                        {threadName}
                      </p>
                      {roomDisplay && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-muted font-extrabold text-secondary border border-line shrink-0">
                          {roomDisplay}
                        </span>
                      )}
                    </div>
                    {t.updatedAt && (
                      <span className="text-[9px] text-subtle font-medium flex-shrink-0 ml-1">
                        {t.updatedAt?.toDate ? fmtDateTime(t.updatedAt.toDate().toISOString()) : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="text-[11px] text-subtle truncate flex-1 font-normal">
                      {t.lastMessage || "Belum ada pesan"}
                    </p>
                    {isResolved && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 shrink-0">
                        Selesai
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function ActiveConversationWorkspace({ thread, onBack }) {
  const { user } = useAuth();
  const activeThreadId = thread.tenantId || thread.tenant_id || thread.id;
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
    activeViewers,
    setTyping, 
    markAsRead, 
    updateThreadStatus 
  } = useChatMessages(activeThreadId, user);

  const [text, setText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(chatSound.isSoundEnabled());

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollDown = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  }, []);

  useEffect(() => {
    scrollDown();
    markAsRead(activeThreadId);
  }, [messages.length, scrollDown, markAsRead, activeThreadId]);

  const toggleSound = () => {
    const updated = chatSound.toggleSound();
    setSoundEnabled(updated);
    toast.info(updated ? "Suara notifikasi aktif 🔔" : "Suara notifikasi dimatikan 🔕");
  };

  const handleInputChange = (e) => {
    setText(e.target.value);
    if (e.target.value.trim() && !isInternalNote) {
      setTyping(true);
    } else {
      setTyping(false);
    }
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
      setPreviewUrl(URL.createObjectURL(file));
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

  const handleSend = async () => {
    const cleanText = text.trim();
    if (!cleanText && !selectedFile) return;

    setIsUploading(true);
    setUploadProgress(30);
    let attachmentPayload = null;

    if (selectedFile) {
      try {
        setUploadProgress(70);
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
        setUploadProgress(95);

        attachmentPayload = {
          fileUrl: base64Data,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
        };
      } catch (err) {
        toast.error("Gagal memproses file");
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }
    }

    const success = await sendMessage(cleanText, {
      recipientDetails: {
        name: thread?.tenantName || thread?.name || "Penghuni",
        roomNumber: thread?.roomNumber || thread?.room_name || "-",
      },
      attachment: attachmentPayload,
      isInternalNote: isInternalNote,
    });

    if (success) {
      setText("");
      removeSelectedFile();
      setShowEmojiPicker(false);
      setShowQuickReplies(false);
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

  const displayName = thread?.tenantName || thread?.name || thread?.tenant_name || "Penghuni";
  const roomDisplay = thread?.roomNumber || thread?.room_name || "-";
  const isResolved = thread?.status === "resolved";
  const tenantTyping = typingUsers.find((u) => u.role === "TENANT");

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Lightbox Modal */}
      {lightboxImg && (
        <ImageLightbox
          src={lightboxImg.url}
          alt={lightboxImg.alt}
          onClose={() => setLightboxImg(null)}
        />
      )}

      {/* Workspace Header */}
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-3 border-b border-line bg-surface/95 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-full hover:bg-muted text-primary active:scale-95 transition-all md:hidden shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="w-10 h-10 rounded-2xl bg-primary/10 grid place-items-center font-serif font-bold text-primary shrink-0 border border-primary/20">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-ink truncate">{displayName}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-extrabold border border-primary/20">
                Kamar {roomDisplay}
              </span>
            </div>
            <p className="text-[11px] text-subtle font-medium flex items-center gap-1.5 mt-0.5">
              <span>Channel Bantuan</span>
              <span>·</span>
              <span className={isResolved ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                {isResolved ? "Tiket Selesai" : "Tiket Aktif"}
              </span>
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleSound}
            title={soundEnabled ? "Matikan Suara" : "Nyalakan Suara"}
            className="p-2 rounded-xl text-subtle hover:text-primary hover:bg-muted transition-colors"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            onClick={() => updateThreadStatus(isResolved ? "open" : "resolved")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              isResolved
                ? "bg-muted hover:bg-muted/80 text-subtle"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            <CheckCircle2 size={14} />
            <span className="hidden sm:inline">{isResolved ? "Buka Kembali" : "Tandai Selesai"}</span>
          </button>
        </div>
      </div>

      {/* Multi-Admin Collision Warning Banner */}
      {activeViewers.length > 0 && (
        <div className="px-4 py-1.5 bg-amber-500/15 border-b border-amber-500/20 text-[11px] text-amber-900 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert size={14} className="text-amber-600 shrink-0" />
            <span>
              {activeViewers.map((v) => v.name).join(", ")} juga sedang membuka percakapan ini
            </span>
          </div>
          <span className="text-[10px] text-amber-700 font-bold">Cek respon ganda</span>
        </div>
      )}

      {/* Message Timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-muted/20">
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
          <div className="text-center text-subtle text-xs py-12 animate-pulse">Memuat pesan...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-subtle text-xs py-16">
            <MessageCircle size={36} className="mx-auto mb-2 text-line" />
            <p className="font-semibold text-primary">Mulai percakapan dengan {displayName}</p>
            <p className="mt-1">Pesan akan langsung diterima oleh penghuni.</p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.senderRole === "ADMIN";
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

        {/* Tenant Typing presence banner */}
        {tenantTyping && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-subtle text-[11px] px-2 py-1 mt-2"
          >
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce" />
            </div>
            <span>{displayName} sedang mengetik...</span>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Canned Responses Dropdown Modal */}
      {showQuickReplies && (
        <div className="p-3 bg-surface border-t border-line space-y-1.5 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between pb-1 text-[11px] font-bold text-subtle">
            <span>Pilih Template Balasan Cepat</span>
            <button onClick={() => setShowQuickReplies(false)} className="hover:text-ink">
              <X size={13} />
            </button>
          </div>
          {CANNED_RESPONSES.map((cr) => (
            <button
              key={cr.id}
              onClick={() => {
                setText(cr.text);
                setShowQuickReplies(false);
                inputRef.current?.focus();
              }}
              className="w-full text-left p-2 rounded-xl bg-muted/60 hover:bg-muted border border-line text-xs transition-colors group"
            >
              <p className="font-bold text-ink group-hover:text-primary">{cr.label}</p>
              <p className="text-[11px] text-subtle truncate mt-0.5">{cr.text}</p>
            </button>
          ))}
        </div>
      )}

      {/* Attachment Preview Chip */}
      {selectedFile && (
        <div className="px-4 py-2 bg-muted border-t border-line flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-8 h-8 rounded-lg object-cover border border-line" />
            ) : (
              <FileText size={18} className="text-primary" />
            )}
            <div className="truncate">
              <p className="font-semibold text-ink truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-subtle">
                {(selectedFile.size / 1024).toFixed(1)} KB · {isUploading ? `Mengunggah ${uploadProgress}%` : "Siap dikirim"}
              </p>
            </div>
          </div>
          {!isUploading && (
            <button onClick={removeSelectedFile} className="p-1 rounded-full hover:bg-surface text-subtle hover:text-danger">
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
              className="p-1 text-sm hover:scale-125 transition-transform"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {/* Input Action Console */}
      <div className={`p-3 border-t border-line bg-surface shrink-0 ${isInternalNote ? "bg-amber-50/40" : ""}`}>
        {/* Toggle Mode: Public Tenant Reply vs Staff-Only Note */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setIsInternalNote(false)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                !isInternalNote ? "bg-surface text-primary shadow-xs" : "text-subtle hover:text-ink"
              }`}
            >
              Kirim ke Penghuni
            </button>
            <button
              type="button"
              onClick={() => setIsInternalNote(true)}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors ${
                isInternalNote ? "bg-amber-500 text-white shadow-xs" : "text-subtle hover:text-amber-800"
              }`}
            >
              <Lock size={11} />
              Catatan Internal (Staff)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowQuickReplies((prev) => !prev)}
            className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline"
          >
            <Sparkles size={12} />
            Template Balasan
          </button>
        </div>

        {/* Text Input Row */}
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
            title="Lampirkan File / Gambar (< 10MB)"
            className="p-2 rounded-xl text-subtle hover:text-primary hover:bg-muted active:scale-95 transition-all"
          >
            <Paperclip size={17} />
          </button>

          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            title="Pilih Emoji"
            className="p-2 rounded-xl text-subtle hover:text-primary hover:bg-muted active:scale-95 transition-all"
          >
            <Smile size={17} />
          </button>

          <textarea
            ref={inputRef}
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isInternalNote ? "Tulis catatan internal untuk staff..." : `Tulis balasan untuk ${displayName}...`}
            rows={1}
            maxLength={2000}
            className={`flex-1 resize-none rounded-2xl px-3.5 py-2 text-xs sm:text-sm outline-none transition-all max-h-24 min-h-[38px] ${
              isInternalNote
                ? "bg-amber-100/60 border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:bg-white text-amber-950"
                : "bg-muted focus:ring-2 focus:ring-primary focus:bg-white text-ink"
            }`}
          />

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleSend}
            disabled={(!text.trim() && !selectedFile) || isUploading}
            className={`w-10 h-10 rounded-2xl grid place-items-center disabled:opacity-40 flex-shrink-0 shadow-soft transition-colors ${
              isInternalNote
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-primary hover:bg-[#122820] text-white"
            }`}
          >
            <Send size={15} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const { threads, loadingThreads } = useChatMessages(null, user);
  const { tenants: tenantList, loading: loadingTenants } = useTenants();
  
  const [selectedThread, setSelectedThread] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [tenantSearch, setTenantSearch] = useState("");
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    if (params.get("new") === "1") {
      setNewChatModalOpen(true);
      setParams({}, { replace: true });
    }
    const threadParam = params.get("thread");
    if (threadParam && threads.length > 0) {
      const match = threads.find((t) => (t.tenantId || t.tenant_id || t.id) === threadParam);
      if (match) setSelectedThread(match);
    }
  }, [params, setParams, threads]);

  const handleSelectTenantForChat = (tenant) => {
    const existing = threads.find((t) => (t.tenantId || t.tenant_id || t.id) === tenant.id);
    if (existing) {
      setSelectedThread(existing);
    } else {
      const newThread = {
        tenantId: tenant.id,
        tenant_id: tenant.id,
        id: tenant.id,
        tenantName: tenant.fullName || tenant.name,
        name: tenant.fullName || tenant.name,
        roomNumber: tenant.roomNumber || tenant.room_name || "-",
        room_name: tenant.roomNumber || tenant.room_name || "-",
        unreadCount: 0,
        lastMessage: "",
        status: "open",
      };
      setSelectedThread(newThread);
    }
    setNewChatModalOpen(false);
  };

  const filteredTenants = (tenantList || []).filter(
    (t) =>
      t.status !== "ARCHIVED" &&
      t.status !== "former" &&
      (!tenantSearch ||
        (t.fullName || t.name)?.toLowerCase().includes(tenantSearch.toLowerCase()) ||
        (t.roomNumber || t.room_name)?.toLowerCase().includes(tenantSearch.toLowerCase()) ||
        t.phone?.includes(tenantSearch))
  );

  return (
    <div className="min-h-screen bg-bg" data-testid="chat-page">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-4 pb-20 sm:pb-8">
        <PageHeader
          title="Inbox Chat Penghuni"
          subtitle={`${threads.length} percakapan terdaftar`}
          action={
            <AddButton 
              onClick={() => setNewChatModalOpen(true)} 
              testid="add-chat-btn" 
              label="Chat Baru" 
            />
          }
        />

        {/* 2-Pane Split Console Card */}
        <div className="bg-surface rounded-3xl border border-line shadow-soft overflow-hidden h-[calc(100vh-170px)] min-h-[580px] grid grid-cols-1 md:grid-cols-12">
          {/* Left Directory Pane */}
          <div
            className={`md:col-span-5 lg:col-span-4 h-full ${
              selectedThread ? "hidden md:block" : "block"
            }`}
          >
            {loadingThreads ? (
              <div className="py-24 text-center text-subtle text-xs animate-pulse">
                Memuat percakapan...
              </div>
            ) : (
              <ThreadDirectory
                threads={threads}
                selectedId={selectedThread ? selectedThread.tenantId || selectedThread.tenant_id || selectedThread.id : null}
                onSelect={(t) => setSelectedThread(t)}
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                onOpenNewChat={() => setNewChatModalOpen(true)}
              />
            )}
          </div>

          {/* Right Active Workspace Pane */}
          <div
            className={`md:col-span-7 lg:col-span-8 h-full bg-surface ${
              !selectedThread ? "hidden md:flex md:items-center md:justify-center" : "flex flex-col"
            }`}
          >
            {selectedThread ? (
              <ActiveConversationWorkspace
                thread={selectedThread}
                onBack={() => setSelectedThread(null)}
              />
            ) : (
              <div className="text-center p-8 text-subtle">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary mx-auto mb-3 grid place-items-center border border-primary/20">
                  <MessageCircle size={32} />
                </div>
                <h3 className="font-serif font-bold text-ink text-base">Pilih Percakapan</h3>
                <p className="text-xs text-subtle max-w-xs mx-auto mt-1">
                  Pilih penghuni dari daftar di samping kiri untuk membaca atau membalas pesan.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Chat Picker Sheet */}
      <Sheet
        open={newChatModalOpen}
        onClose={() => setNewChatModalOpen(false)}
        title="Mulai Chat Baru"
        subtitle="Pilih penghuni aktif untuk membuka percakapan"
        maxWidth="sm:max-w-md"
      >
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              placeholder="Cari nama penghuni, kamar, no. HP..."
              value={tenantSearch}
              onChange={(e) => setTenantSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {loadingTenants ? (
              <div className="py-8 text-center text-xs text-subtle animate-pulse">Memuat data penghuni...</div>
            ) : filteredTenants.length === 0 ? (
              <div className="py-8 text-center text-xs text-subtle">
                <User size={28} className="mx-auto mb-1 text-line" />
                <p className="font-semibold text-primary">Tidak ada penghuni ditemukan</p>
              </div>
            ) : (
              filteredTenants.map((t) => {
                const name = t.fullName || t.name || "Penghuni";
                const room = t.roomNumber || t.room_name || "-";
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTenantForChat(t)}
                    data-testid={`select-tenant-chat-${t.id}`}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-surface hover:bg-muted/60 border border-line hover:border-primary/40 active:scale-98 transition-all text-left group shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary grid place-items-center font-serif font-bold text-sm shrink-0 border border-primary/20">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-ink group-hover:text-primary transition-colors truncate">
                          {name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-subtle mt-0.5">
                          <span className="flex items-center gap-0.5">
                            <DoorOpen size={11} className="text-secondary" />
                            <span>Kamar {room}</span>
                          </span>
                          {t.phone && <span>· {t.phone}</span>}
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                      Kirim Pesan
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </Sheet>
    </div>
  );
}
