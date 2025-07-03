import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDataAmount(amount: number): string {
  // Database stores data amounts in GB, so we just need to format them
  // No conversion needed since data is already in GB
  
  if (amount >= 1) {
    // If it's a whole number, don't show decimal part. Otherwise, show one decimal.
    return `${Number.isInteger(amount) ? amount : amount.toFixed(1)} GB`;
  }
  
  // For amounts less than 1GB, show as MB
  const mb = amount * 1024;
  return `${Number.isInteger(mb) ? mb : mb.toFixed(0)} MB`;
}