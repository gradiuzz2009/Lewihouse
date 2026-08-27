/**
 * Auto-Credential & Password Management System for Lewi House
 * Implements PRD & UI/UX specifications for:
 * - Username generation ([NomorUnit]_[NamaDepan]) with collision handling
 * - Temporary password generation ([NomorUnit][AkhiranKTP/123])
 * - Interactive validation & password strength evaluation
 * - WhatsApp onboarding message formatting
 */

/**
 * Generate sanitized tenant username:
 * Pattern: [NomorUnit]_[NamaDepan]
 * Rules: Pure lowercase, strip symbols/spaces/titles. If collision exists in unit, suffix with _2, _3...
 *
 * @param {string} roomName - e.g. "204", "A-12", "B/03"
 * @param {string} fullName - e.g. "Ali Pratama, S.Kom" -> "ali"
 * @param {Array<string>} existingUsernames - List of already registered usernames
 * @returns {string} Generated username e.g. "204_ali" or "204_ali_2"
 */
export function generateTenantUsername(roomName, fullName, existingUsernames = []) {
  // 1. Sanitize room/unit (alphanumeric only, lowercase)
  let unit = "000";
  if (roomName && typeof roomName === "string" && roomName.trim()) {
    const cleanRoom = roomName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (cleanRoom) unit = cleanRoom;
  }

  // 2. Extract and sanitize first name (strip honorifics, symbols, spaces, lowercase)
  let firstName = "penghuni";
  if (fullName && typeof fullName === "string" && fullName.trim()) {
    // Remove common honorifics/prefixes if present
    const rawFirst = fullName.trim().split(/\s+/)[0];
    const cleanFirst = rawFirst.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (cleanFirst) firstName = cleanFirst;
  }

  const baseUsername = `${unit}_${firstName}`;

  // 3. Collision handling
  let candidate = baseUsername;
  let counter = 2;
  const usernameSet = new Set((existingUsernames || []).map((u) => (u || "").toLowerCase()));

  while (usernameSet.has(candidate)) {
    candidate = `${baseUsername}_${counter}`;
    counter++;
  }

  return candidate;
}

/**
 * Generate temporary password using PRD Formula:
 * Pattern: [NomorKamarBersih][AkhiranKTP]
 * - NomorKamarBersih: Alphanumeric characters only, uppercase (e.g. 'A-102' -> 'A102', '204' -> '204', 'B/03' -> 'B03')
 * - AkhiranKTP: Last 3 digits of NIK if valid & length >= 3; otherwise fallback to '123'
 *
 * @param {string} roomName - e.g. "204", "A-102", "B/03"
 * @param {string} nik - e.g. "3171012345670789"
 * @returns {string} Temporary password, e.g. "204789", "A102123"
 */
export function generateTemporaryPassword(roomName, nik) {
  let cleanRoom = "000";
  if (roomName && typeof roomName === "string" && roomName.trim()) {
    const alphanumeric = roomName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (alphanumeric) {
      cleanRoom = alphanumeric;
    }
  }

  let suffix = "123";
  if (nik) {
    const nikDigits = String(nik).replace(/\D/g, "");
    if (nikDigits.length >= 3) {
      suffix = nikDigits.slice(-3);
    }
  }

  return `${cleanRoom}${suffix}`;
}

/**
 * Evaluate password strength for In-App Security Settings:
 * Returns score (0-3), label ('Lemah' | 'Sedang' | 'Kuat'), and color tone.
 *
 * @param {string} password
 * @returns {{ score: number, label: string, color: string, percent: number }}
 */
export function evaluatePasswordStrength(password) {
  if (!password) {
    return { score: 0, label: "Kosong", color: "bg-slate-200 text-slate-400", percent: 0 };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/\d/.test(password) && /[a-zA-Z]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password) || (password.length >= 10 && /[A-Z]/.test(password) && /[a-z]/.test(password))) {
    score += 1;
  }

  if (score <= 1) {
    return { score: 1, label: "Lemah", color: "bg-rose-500 text-rose-600", percent: 33 };
  }
  if (score === 2) {
    return { score: 2, label: "Sedang", color: "bg-amber-500 text-amber-600", percent: 66 };
  }
  return { score: 3, label: "Kuat", color: "bg-emerald-500 text-emerald-600", percent: 100 };
}

/**
 * Simple client-side hash helper for mock/local validation
 */
export function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "h_" + Math.abs(hash).toString(16) + "_" + str.length;
}

/**
 * Validate new password compliance according to PRD:
 * - Minimum 8 characters
 * - Contains at least 1 number / digit (0-9)
 * - Must not match the temporary password
 * - Must not match any of the last 3-5 previous passwords in password_history (anti-repetition)
 *
 * @param {string} newPassword
 * @param {string} temporaryPassword
 * @param {Array<{hash?: string, plain?: string, created_at?: string}>} [passwordHistory=[]]
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateNewPassword(newPassword, temporaryPassword, passwordHistory = []) {
  if (!newPassword || typeof newPassword !== "string") {
    return { valid: false, error: "Password baru wajib diisi" };
  }

  if (newPassword.length < 8) {
    return { valid: false, error: "Password baru minimal 8 karakter" };
  }

  if (!/\d/.test(newPassword)) {
    return { valid: false, error: "Password baru wajib mengandung minimal 1 angka (0-9)" };
  }

  if (temporaryPassword && newPassword.trim() === String(temporaryPassword).trim()) {
    return { valid: false, error: "Password baru tidak boleh sama dengan password sementara" };
  }

  // Check against password history (anti-repetition: check last 5 entries)
  if (Array.isArray(passwordHistory) && passwordHistory.length > 0) {
    const recentHistory = passwordHistory.slice(-5);
    const newHash = simpleHash(newPassword);

    for (const item of recentHistory) {
      if (item) {
        if (item.plain && item.plain === newPassword) {
          return { valid: false, error: "Kata sandi ini pernah Anda gunakan sebelumnya. Silakan gunakan kombinasi lain." };
        }
        if (item.hash && (item.hash === newHash || item.hash === newPassword)) {
          return { valid: false, error: "Kata sandi ini pernah Anda gunakan sebelumnya. Silakan gunakan kombinasi lain." };
        }
      }
    }
  }

  return { valid: true, error: null };
}

/**
 * Format WhatsApp Onboarding Message for new tenants
 */
export function formatOnboardingWhatsAppMessage({ tenantName, username, phone, roomName, temporaryPassword, originUrl }) {
  const origin = originUrl || (typeof window !== "undefined" ? window.location.origin : "https://lewihouseadminapp.web.app");
  const displayUser = username || phone || "Nomor Unit";

  return `*AKUN PORTAL PENGHUNI — LEWI HOUSE*

Halo Kak *${tenantName}*,
Selamat bergabung di Lewi House! Akun portal mandiri Anda telah aktif untuk kemudahan cek info sewa, bayar tagihan, dan lapor perbaikan fasilitas:

🏠 *Unit Kamar:* ${roomName || "Menunggu Penetapan"}
👤 *Username / Nomor Unit:* \`${displayUser}\`
📱 *No. WhatsApp:* \`${phone || "-"}\`
🔑 *Password Sementara:* \`${temporaryPassword}\`

🌐 *Tautan Login:* ${origin}/login

⚠️ *Penting:* Demi keamanan akun Anda, Anda akan diminta membuat kata sandi baru (minimal 8 karakter + 1 angka) saat pertama kali login.

Simpan pesan ini dengan baik. Terima kasih! 🙏`;
}
