// Work place setup saved on this device (Location page).
export interface SiteSettings { name: string; emergencyNumber: string; }

export const DEFAULT_SITE_NAME = 'Sector 4 - Solar Farm Array';
const KEY = 'fieldguard_site';

export function loadSite(): SiteSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    return { name: saved?.name || '', emergencyNumber: saved?.emergencyNumber || '' };
  } catch { return { name: '', emergencyNumber: '' }; }
}

export function saveSite(site: SiteSettings) {
  localStorage.setItem(KEY, JSON.stringify(site));
}

/** Accepts international formats such as +971 50 123 4567 or (050) 123-4567. */
export function isValidPhone(number: string): boolean {
  const digits = number.replace(/\D/g, '');
  return /^\+?[\d\s\-().]+$/.test(number.trim()) && digits.length >= 3 && digits.length <= 15;
}

export function telHref(number: string): string {
  return `tel:${number.trim().replace(/[^\d+]/g, '')}`;
}

/** Opens the phone dialer (uses the SIM, so it works without Wi-Fi or data). */
export function dial(number: string) {
  const link = document.createElement('a');
  link.href = telHref(number);
  link.click();
}
