import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function removeAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function accentInsensitiveSearch(text: string, query: string): boolean {
  const normalizedText = removeAccents(text.toLowerCase());
  const normalizedQuery = removeAccents(query.toLowerCase());
  return normalizedText.includes(normalizedQuery);
}
