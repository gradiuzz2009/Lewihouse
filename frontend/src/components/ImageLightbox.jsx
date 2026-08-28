import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Download, RotateCw } from "lucide-react";

export default function ImageLightbox({ src, alt, onClose }) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!src) return null;
  if (typeof document === "undefined") return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = src;
    link.download = alt || "image-attachment";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 select-none">
        {/* Top Control Bar */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <button
            onClick={() => setScale((s) => Math.min(s + 0.3, 3))}
            title="Perbesar (Zoom In)"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(s - 0.3, 0.5))}
            title="Perkecil (Zoom Out)"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            title="Putar Gambar"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
          >
            <RotateCw size={18} />
          </button>
          <button
            onClick={handleDownload}
            title="Unduh Gambar"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
          >
            <Download size={18} />
          </button>
          <button
            onClick={onClose}
            title="Tutup (Esc)"
            className="p-2.5 rounded-full bg-white/20 hover:bg-rose-600 text-white backdrop-blur-md transition-colors ml-2"
          >
            <X size={20} />
          </button>
        </div>

        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Scaled Image */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-full max-h-full flex items-center justify-center z-0 overflow-hidden"
        >
          <img
            src={src}
            alt={alt || "Pratinjau Gambar"}
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transition: "transform 0.2s ease-out",
            }}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
