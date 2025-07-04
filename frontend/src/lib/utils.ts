import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import slugifyRaw from 'slugify';

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

/**
 * Converts a country name to a URL-friendly slug (e.g., "United States" -> "united-states").
 * Uses slugify for strict, lower-case slugs.
 *
 * Args:
 *   name (string): The country name.
 *
 * Returns:
 *   string: The slugified country name.
 */
export function countrySlug(name: string): string {
  return slugifyRaw(name, { lower: true, strict: true });
}

import { europeanCountries } from '../data/countries';

/**
 * Looks up the English country name by its 2-letter code (case-insensitive).
 *
 * Args:
 *   code (string): The 2-letter country code (e.g., 'AL').
 *
 * Returns:
 *   string | undefined: The English country name, or undefined if not found.
 */
export function getCountryNameByCode(code: string): string | undefined {
  const country = europeanCountries.find(
    c => c.code.toLowerCase() === code.toLowerCase()
  );
  return country?.name.en;
}