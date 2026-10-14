import type { AdminInput } from "../../services/platformService";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_ADMINS = 2;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const emptyAdmin = (): AdminInput => ({
  username: "",
  email: "",
  firstName: "",
  lastName: "",
  password: "",
});

/** Random password that always satisfies the API rule (>= 8 characters) and mixes the character classes. */
export const generatePassword = (): string => {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%&*?"];
  const all = sets.join("");
  const rand = (n: number) => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % n;
  };
  const chars = sets.map((s) => s[rand(s.length)]);
  while (chars.length < 14) chars.push(all[rand(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
};

/** Null when the admin row is fine, otherwise the message to show. */
export const validateAdmin = (a: AdminInput, label = "Admin"): string | null => {
  if (!a.firstName.trim()) return `${label}: first name is required.`;
  if (!a.lastName.trim()) return `${label}: last name is required.`;
  if (!a.username.trim()) return `${label}: username is required.`;
  if (!a.email.trim() || !EMAIL_RE.test(a.email.trim())) return `${label}: a valid email is required.`;
  if (a.password.length < 8) return `${label}: password must be at least 8 characters.`;
  return null;
};

/** Null when the file is an acceptable logo/banner, otherwise the message to show. */
export const validateImage = (file: File, label: string): string | null => {
  if (!IMAGE_TYPES.includes(file.type)) return `${label}: only JPG, PNG and WEBP images are allowed.`;
  if (file.size > MAX_IMAGE_BYTES) return `${label}: image must be less than 2 MB.`;
  return null;
};
