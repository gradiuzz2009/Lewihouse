import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, MapPin, Phone, ShieldCheck, Sparkles, UtensilsCrossed, 
  Car, Activity, Clock, HeartHandshake, Compass, ExternalLink,
  ChevronRight, CheckCircle2, AlertTriangle, Moon, BedDouble, Info,
  Share2, Navigation, Star, UserCheck, MessageSquare, Award
} from "lucide-react";
import { Sheet, Button } from "./ui";
import { PROPERTY_INFO } from "../lib/propertyData";
import { toast } from "sonner";

export default function PropertyInfoModal({ open, onClose }) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "tiers" | "ratings" | "rules" | "surroundings" | "platforms"

  const copyAddress = () => {
    navigator.clipboard.writeText(PROPERTY_INFO.address);
    toast.success("Alamat Lewi House Medan disalin ke clipboard ✓");
  };

  const openWhatsApp = (phoneClean, name = "Pengelola") => {
    window.open(`https://wa.me/${phoneClean}?text=Halo%20${encodeURIComponent(name)}%20Lewi%20House%20Medan,%20saya%20ingin%20bertanya%20mengenai%20kamar/layanan`, "_blank");
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Informasi & Panduan Lewi House Medan"
    >
      <div className="space-y-4 pt-1 pb-6" data-testid="property-info-sheet">
        {/* Header Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-primary text-white p-5 shadow-lifted grain">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/20 text-secondary text-[11px] font-bold tracking-wider uppercase mb-2">
              <Sparkles size={12} />
              <span>{PROPERTY_INFO.concept}</span>
            </div>
            <h2 className="font-serif text-2xl font-bold tracking-tight">{PROPERTY_INFO.name}</h2>
            <p className="text-xs text-white/80 mt-1 font-medium">{PROPERTY_INFO.legalName}</p>

            {/* Quick stats badge */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/20 text-center">
              <div className="bg-white/10 rounded-2xl p-2 backdrop-blur-xs">
                <p className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">Gedung</p>
                <p className="text-sm font-bold mt-0.5">{PROPERTY_INFO.building.totalFloors} Lantai</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-2 backdrop-blur-xs">
                <p className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">Kapasitas</p>
                <p className="text-sm font-bold mt-0.5">{PROPERTY_INFO.building.totalRooms} Kamar</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-2 backdrop-blur-xs">
                <p className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">Rating Google</p>
                <p className="text-sm font-bold mt-0.5 flex items-center justify-center gap-1">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span>4.5 / 5</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[
            { key: "overview", label: "Ringkasan & Pengelola" },
            { key: "ratings", label: "Rating & Ulasan" },
            { key: "tiers", label: "Kategori Kamar" },
            { key: "rules", label: "Tata Tertib & Syariah" },
            { key: "surroundings", label: "Lokasi & Sekitar" },
            { key: "platforms", label: "Platform Booking" },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface border border-line text-subtle hover:text-ink"
                }`}
                data-testid={`prop-tab-${tab.key}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Ringkasan & Pengelola */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Key Personnel Cards (Owner & Admin) */}
            <div className="bg-surface rounded-2xl p-4 border border-line space-y-3 shadow-soft">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-primary" />
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Tim Pengelola & Kontak Utama</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Admin: Mbak Rosmah */}
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-line/60 flex flex-col justify-between gap-2.5">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        Admin Operasional
                      </span>
                      <span className="text-[10px] text-subtle font-mono">Front Desk 24 Jam</span>
                    </div>
                    <p className="font-serif text-base font-bold text-ink mt-1.5">{PROPERTY_INFO.personnel.admin.name}</p>
                    <p className="text-xs text-subtle font-mono mt-0.5">{PROPERTY_INFO.personnel.admin.phone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openWhatsApp(PROPERTY_INFO.personnel.admin.phoneClean, "Mbak Rosmah")}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <MessageSquare size={13} />
                    <span>Chat WhatsApp (Mbak Rosmah)</span>
                  </button>
                </div>

                {/* Owner: Ibu Amirta */}
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-line/60 flex flex-col justify-between gap-2.5">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary/15 px-2 py-0.5 rounded-md">
                        Pemilik (Owner)
                      </span>
                      <span className="text-[10px] text-subtle font-mono">Manajemen</span>
                    </div>
                    <p className="font-serif text-base font-bold text-ink mt-1.5">{PROPERTY_INFO.personnel.owner.name}</p>
                    <p className="text-xs text-subtle font-mono mt-0.5">{PROPERTY_INFO.personnel.owner.phone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openWhatsApp(PROPERTY_INFO.personnel.owner.phoneClean, "Ibu Amirta")}
                    className="w-full py-2 px-3 rounded-xl bg-secondary/20 hover:bg-secondary/30 active:scale-98 text-primary text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <MessageSquare size={13} />
                    <span>Hubungi Owner (Ibu Amirta)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Address & Quick Actions */}
            <div className="bg-surface rounded-2xl p-4 border border-line space-y-3 shadow-soft">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                  <MapPin size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ink">Alamat Properti</p>
                  <p className="text-xs text-subtle mt-0.5 leading-relaxed">{PROPERTY_INFO.address}</p>
                  <p className="text-[11px] text-secondary font-semibold mt-1">Kawasan: {PROPERTY_INFO.neighborhood}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-line/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAddress}
                  className="flex-1 text-xs gap-1.5"
                >
                  <Share2 size={13} />
                  <span>Salin Alamat</span>
                </Button>
                <a
                  href={PROPERTY_INFO.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 bg-secondary/15 hover:bg-secondary/25 text-primary text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Navigation size={13} />
                  <span>Buka di Maps</span>
                </a>
              </div>
            </div>

            {/* On-Site Facilities */}
            <div className="bg-surface rounded-2xl p-4 border border-line space-y-3 shadow-soft">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Fasilitas Properti & Layanan On-Site</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PROPERTY_INFO.onSiteServices.map((srv, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-muted/40 border border-line/60">
                    <p className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-primary" />
                      <span>{srv.name}</span>
                    </p>
                    <p className="text-[11px] text-subtle mt-1 leading-snug">{srv.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Rating & Ulasan Tamu */}
        {activeTab === "ratings" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Rating Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-surface rounded-2xl p-3.5 border border-line text-center shadow-soft">
                <p className="text-[10px] uppercase tracking-wider text-subtle font-semibold">Google Maps</p>
                <div className="flex items-center justify-center gap-1 mt-1 text-primary">
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                  <span className="font-serif text-xl font-bold">4.5</span>
                  <span className="text-xs text-subtle">/5</span>
                </div>
                <p className="text-[10px] text-subtle mt-0.5">170+ reviews</p>
              </div>

              <div className="bg-surface rounded-2xl p-3.5 border border-line text-center shadow-soft">
                <p className="text-[10px] uppercase tracking-wider text-subtle font-semibold">Agoda</p>
                <div className="flex items-center justify-center gap-1 mt-1 text-primary">
                  <Award size={16} className="text-emerald-600" />
                  <span className="font-serif text-xl font-bold">8.8</span>
                  <span className="text-xs text-subtle">/10</span>
                </div>
                <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Hebat</p>
              </div>

              <div className="bg-surface rounded-2xl p-3.5 border border-line text-center shadow-soft">
                <p className="text-[10px] uppercase tracking-wider text-subtle font-semibold">Traveloka</p>
                <div className="flex items-center justify-center gap-1 mt-1 text-primary">
                  <Award size={16} className="text-blue-600" />
                  <span className="font-serif text-xl font-bold">8.6</span>
                  <span className="text-xs text-subtle">/10</span>
                </div>
                <p className="text-[10px] text-blue-700 font-semibold mt-0.5">Mengesankan</p>
              </div>

              <div className="bg-surface rounded-2xl p-3.5 border border-line text-center shadow-soft">
                <p className="text-[10px] uppercase tracking-wider text-subtle font-semibold">Trip.com</p>
                <div className="flex items-center justify-center gap-1 mt-1 text-primary">
                  <Award size={16} className="text-indigo-600" />
                  <span className="font-serif text-xl font-bold">8.0</span>
                  <span className="text-xs text-subtle">/10</span>
                </div>
                <p className="text-[10px] text-indigo-700 font-semibold mt-0.5">Sangat Baik</p>
              </div>
            </div>

            {/* Guest Sentiment Highlights */}
            <div className="bg-surface rounded-2xl p-4 border border-line space-y-3 shadow-soft">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-secondary" />
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Poin Kepuasan Tamu & Penghuni</h3>
              </div>
              <div className="space-y-2">
                {PROPERTY_INFO.ratings.highlights.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-line/60">
                    <CheckCircle2 size={15} className="text-primary shrink-0 mt-0.5" />
                    <span className="text-xs text-ink leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: Kategori Kamar (Tiers) */}
        {activeTab === "tiers" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3.5"
          >
            {PROPERTY_INFO.roomTiers.map((tier) => (
              <div
                key={tier.tier}
                className="bg-surface rounded-2xl p-4 border border-line space-y-3 shadow-soft"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded-md bg-primary/10">
                      Ukuran {tier.size} • {tier.bed}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-ink mt-1.5">{tier.name}</h3>
                    <p className="text-xs text-subtle mt-0.5 leading-snug">{tier.description}</p>
                  </div>
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0 border border-line">
                    <img src={tier.photoUrl} alt={tier.name} className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="pt-2 border-t border-line/60 space-y-1.5">
                  <p className="text-[11px] font-bold text-ink uppercase tracking-wider">Fasilitas Kamar:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {tier.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-ink/80">
                        <CheckCircle2 size={13} className="text-primary shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Tab 4: Tata Tertib & Syariah Policy */}
        {activeTab === "rules" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3.5"
          >
            {/* Syariah Policy Callout */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <ShieldCheck size={18} className="text-amber-700 shrink-0" />
                <span>Kebijakan Syariah (Syariah-Compliant Policy)</span>
              </div>
              <p className="text-xs text-amber-950/80 leading-relaxed">
                {PROPERTY_INFO.dailyStayDetails.syariahPolicy}
              </p>
            </div>

            {/* Check-In & Check-Out Times */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface rounded-2xl p-3.5 border border-line shadow-soft">
                <div className="flex items-center gap-2 text-primary font-bold text-xs">
                  <Clock size={16} />
                  <span>Check-In</span>
                </div>
                <p className="text-sm font-bold text-ink mt-1">Mulai 14:00 WIB</p>
                <p className="text-[10px] text-subtle">Resepsionis 24 Jam</p>
              </div>
              <div className="bg-surface rounded-2xl p-3.5 border border-line shadow-soft">
                <div className="flex items-center gap-2 text-primary font-bold text-xs">
                  <Clock size={16} />
                  <span>Check-Out</span>
                </div>
                <p className="text-sm font-bold text-ink mt-1">Hingga 12:00 WIB</p>
                <p className="text-[10px] text-subtle">Tepat Waktu</p>
              </div>
            </div>

            {/* House Rules */}
            <div className="bg-surface rounded-2xl p-4 border border-line space-y-3 shadow-soft">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Peraturan & Ketertiban (House Rules)</h3>
              <div className="space-y-2">
                {PROPERTY_INFO.dailyStayDetails.rules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-muted/40 border border-line/60">
                    <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-ink leading-relaxed">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 5: Lokasi & Akses Sekitar */}
        {activeTab === "surroundings" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3.5"
          >
            {/* Transit & Akses Transportasi */}
            <div className="bg-surface rounded-2xl p-4 border border-line space-y-3 shadow-soft">
              <div className="flex items-center gap-2">
                <Compass size={16} className="text-primary" />
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Akses Transportasi & Bandara</h3>
              </div>
              <div className="space-y-2">
                {PROPERTY_INFO.surroundingArea.transit.map((t, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-muted/40 border border-line/60 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink">{t.name}</p>
                      <p className="text-[11px] text-subtle">{t.desc}</p>
                    </div>
                    <span className="text-xs font-bold text-primary shrink-0 bg-primary/10 px-2 py-1 rounded-lg">
                      {t.distance}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Landmark & Kampus */}
            <div className="bg-surface rounded-2xl p-4 border border-line space-y-3 shadow-soft">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-primary" />
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Landmark, Pusat Kota & Kampus</h3>
              </div>
              <div className="space-y-2">
                {PROPERTY_INFO.surroundingArea.landmarks.map((l, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-muted/40 border border-line/60 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink">{l.name}</p>
                      <p className="text-[11px] text-subtle">{l.desc}</p>
                    </div>
                    <span className="text-xs font-bold text-primary shrink-0 bg-primary/10 px-2 py-1 rounded-lg">
                      {l.distance}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fasilitas Medis */}
            <div className="bg-surface rounded-2xl p-4 border border-line space-y-3 shadow-soft">
              <div className="flex items-center gap-2">
                <HeartHandshake size={16} className="text-emerald-700" />
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Fasilitas Kesehatan Terdekat</h3>
              </div>
              <div className="space-y-2">
                {PROPERTY_INFO.surroundingArea.healthcare.map((h, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-muted/40 border border-line/60 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink">{h.name}</p>
                      <p className="text-[11px] text-subtle">{h.desc}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 shrink-0 bg-emerald-500/10 px-2 py-1 rounded-lg">
                      {h.distance}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kuliner Sekitar */}
            <div className="bg-surface rounded-2xl p-4 border border-line space-y-3 shadow-soft">
              <div className="flex items-center gap-2">
                <UtensilsCrossed size={16} className="text-secondary" />
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Kuliner & Kafe Terdekat</h3>
              </div>
              <div className="space-y-2">
                {PROPERTY_INFO.surroundingArea.dining.map((d, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-muted/40 border border-line/60">
                    <p className="text-xs font-bold text-ink">{d.name}</p>
                    <p className="text-[11px] text-subtle mt-0.5">{d.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 6: Platform Listing & Booking */}
        {activeTab === "platforms" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-xs text-subtle">
              Lewi House Medan terdaftar secara resmi di berbagai portal reservasi kost eksklusif dan hotel harian syariah:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PROPERTY_INFO.platforms.map((plat) => (
                <a
                  key={plat.name}
                  href={plat.url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-surface rounded-2xl p-3.5 border border-line hover:border-primary/40 flex items-center justify-between gap-3 shadow-soft group transition-all"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-secondary">
                        {plat.type}
                      </span>
                      {plat.rating && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          ★ {plat.rating}
                        </span>
                      )}
                    </div>
                    <p className="font-serif text-sm font-bold text-ink group-hover:text-primary transition-colors mt-0.5">
                      {plat.name}
                    </p>
                  </div>
                  <ExternalLink size={16} className="text-subtle group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </Sheet>
  );
}
