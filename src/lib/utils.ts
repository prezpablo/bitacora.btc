import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUsd(n: number, digits = 0) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

export function formatPct(n: number, digits = 2) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

export function formatCompact(n: number) {
  return new Intl.NumberFormat("es-UY", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

const HTML_ESC: Record<string, string> = {
  "&": "\u0026amp;",
  "<": "\u0026lt;",
  ">": "\u0026gt;",
  '"': "\u0026quot;",
  "'": "\u0026#39;",
};

export function escapeHtml(raw: string) {
  return String(raw ?? "").replace(/[&<>"']/g, (ch) => HTML_ESC[ch] || ch);
}
