import { sanitize } from "@/lib/security";

export function validateEmail(email: string): string | null {
  const sanitized = sanitize(email);
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!sanitized) return "Email é obrigatório.";
  if (!re.test(sanitized)) return "Email inválido.";
  if (sanitized.length > 255) return "Email muito longo.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Senha é obrigatória.";
  if (password.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
  if (password.length > 128) return "Senha muito longa.";
  return null;
}

export function validateName(name: string, field = "Nome"): string | null {
  const sanitized = sanitize(name);
  if (!sanitized) return `${field} é obrigatório.`;
  if (sanitized.length < 2) return `${field} deve ter pelo menos 2 caracteres.`;
  if (sanitized.length > 200) return `${field} muito longo.`;
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone) return null;
  const sanitized = sanitize(phone);
  const re = /^\+?\d{7,15}$/;
  if (!re.test(sanitized.replace(/[\s-]/g, ""))) return "Telefone inválido. Use formato +244 XXX XXX XXX.";
  return null;
}

export function validateNif(nif: string): string | null {
  if (!nif) return null;
  const sanitized = sanitize(nif);
  if (!/^\d{10}$/.test(sanitized)) return "NIF deve ter 10 dígitos.";
  return null;
}

export function validateUrl(url: string): string | null {
  if (!url) return null;
  try {
    new URL(url);
    return null;
  } catch {
    return "URL inválida.";
  }
}

export function validateNumber(value: string, field = "Valor"): string | null {
  if (!value) return null;
  const num = parseFloat(value);
  if (isNaN(num)) return `${field} inválido.`;
  if (num < 0) return `${field} não pode ser negativo.`;
  if (num > 999999999) return `${field} muito alto.`;
  return null;
}
