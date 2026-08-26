/**
 * Enterprise Form Validation & Sanitization Module for Lewi House
 * Provides boundary enforcement, regex checks, and format sanitization (CWE-20 mitigation).
 */

export const ValidationRules = {
  email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  phone: /^(\+62|62|0)8[1-9][0-9]{7,11}$/,
  roomNumber: /^[0-9]{1,4}[A-Za-z]?$/,
  idCard: /^[0-9]{16}$/,
};

export function validateEmail(email) {
  if (!email || typeof email !== "string") return "Email is required";
  const trimmed = email.trim();
  if (trimmed.length > 100) return "Email exceeds maximum length of 100 characters";
  if (!ValidationRules.email.test(trimmed)) return "Invalid email address format";
  return null;
}

export function validatePassword(password, minLength = 6) {
  if (!password || typeof password !== "string") return "Password is required";
  if (password.length < minLength) return `Password must be at least ${minLength} characters`;
  if (password.length > 128) return "Password exceeds maximum length of 128 characters";
  return null;
}

export function validateRoomNumber(roomNumber) {
  if (!roomNumber) return "Room number is required";
  const str = String(roomNumber).trim();
  if (!ValidationRules.roomNumber.test(str)) return "Invalid room number (e.g. 101, 204)";
  return null;
}

export function validateAmount(amount, min = 0, max = 100000000) {
  const num = Number(amount);
  if (isNaN(num)) return "Amount must be a valid number";
  if (num <= min) return `Amount must be greater than ${min}`;
  if (num > max) return `Amount cannot exceed Rp ${max.toLocaleString("id-ID")}`;
  return null;
}

export function validateMaintenanceTicket({ title, description, roomNumber }) {
  const errors = {};
  if (!title || title.trim().length < 3) errors.title = "Title must be at least 3 characters";
  if (title && title.trim().length > 100) errors.title = "Title cannot exceed 100 characters";

  if (!description || description.trim().length < 5) errors.description = "Description must be at least 5 characters";
  if (description && description.trim().length > 500) errors.description = "Description cannot exceed 500 characters";

  const roomErr = validateRoomNumber(roomNumber);
  if (roomErr) errors.roomNumber = roomErr;

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function sanitizeInput(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[<>]/g, "").trim();
}
