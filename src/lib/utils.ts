import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString?: string, customFormat: string = 'PP'): string {
  if (!dateString) return 'N/A';
  try {
    // Ensure the date string is parsed correctly, especially if it's already an ISO string
    const date = parseISO(dateString);
    return format(date, customFormat);
  } catch (error) {
    // Fallback for non-ISO strings or other parsing issues, though formatISO should prevent this.
    try {
        return format(new Date(dateString), customFormat);
    } catch (innerError) {
        console.error("Error formatting date:", dateString, innerError);
        return 'Invalid Date';
    }
  }
}

export function addMonths(date: Date, months: number): Date {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
}

export function getDeviceInfo(userAgent: string): {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  deviceType: string;
  screenResolution?: string;
  timezone: string;
  language: string;
} {
  // Basic device detection
  const isMobile = /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent);
  const isTablet = /Tablet|iPad|PlayBook|Silk/.test(userAgent);
  
  // Browser detection
  const browserMatch = userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  const browser = browserMatch[1]?.toLowerCase() || 'unknown';
  const browserVersion = browserMatch[2] || 'unknown';

  // OS detection
  const osMatch = userAgent.match(/(?:windows|mac|linux|android|ios|iphone|ipad|ipod)\s*(?:os)?\s*(\d+[._]\d+)?/i);
  const os = osMatch?.[0]?.split(' ')[0]?.toLowerCase() || 'unknown';
  const osVersion = osMatch?.[1]?.replace('_', '.') || 'unknown';

  // Device type
  let deviceType = 'desktop';
  if (isMobile) deviceType = 'mobile';
  if (isTablet) deviceType = 'tablet';

  return {
    browser,
    browserVersion,
    os,
    osVersion,
    device: `${os} ${deviceType}`,
    deviceType,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
  };
}
