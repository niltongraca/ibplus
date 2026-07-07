import { createHash } from "crypto";

export function sanitize(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = typeof value === "string" ? sanitize(value) : value;
  }
  return result as T;
}

export function encrypt(text: string): string {
  const key = process.env.ENCRYPTION_KEY || "ibplus-default-key-change-in-production-32chars";
  const algo = "aes-256-cbc";
  const crypto = require("crypto");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algo, crypto.createHash("sha256").update(key).digest(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(encryptedText: string): string {
  try {
    const key = process.env.ENCRYPTION_KEY || "ibplus-default-key-change-in-production-32chars";
    const algo = "aes-256-cbc";
    const crypto = require("crypto");
    const parts = encryptedText.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(algo, crypto.createHash("sha256").update(key).digest(), iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return encryptedText;
  }
}
