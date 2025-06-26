import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDataAmount(amount: number): string {
  if (amount >= 1024) {
    const gb = amount / 1024;
    // If it's a whole number, don't show decimal part. Otherwise, show one decimal.
    return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
  }
  return `${amount} MB`;
}