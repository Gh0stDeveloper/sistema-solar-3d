const es = "es";

export function formatNumber(value: number, digits = 2): string {
  return value.toLocaleString(es, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

export function formatSci(coeff: number, exp: number, unit: string): string {
  const c = coeff.toLocaleString(es, { maximumFractionDigits: 3 });
  return `${c} × 10${toSuper(exp)} ${unit}`;
}

function toSuper(n: number): string {
  const map: Record<string, string> = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
    "-": "⁻",
  };
  return String(n)
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("");
}

export function formatDays(days: number): string {
  const abs = Math.abs(days);
  if (abs < 1) {
    const hours = abs * 24;
    if (hours < 1) return `${formatNumber(hours * 60, 0)} min`;
    return `${formatNumber(hours, 1)} h`;
  }
  if (abs < 365.0) return `${formatNumber(abs, abs >= 10 ? 1 : 2)} días`;
  const years = abs / 365.25;
  return `${formatNumber(years, years >= 10 ? 1 : 2)} años`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(es, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatSpeed(daysPerSec: number): string {
  if (daysPerSec < 1) return `${formatNumber(daysPerSec, 2)} d/s`;
  if (daysPerSec < 10) return `${formatNumber(daysPerSec, 1)} d/s`;
  return `${formatNumber(daysPerSec, 0)} d/s`;
}

export function yearDurationLabel(daysPerSec: number): string {
  const seconds = 365.256 / Math.max(daysPerSec, 1e-6);
  if (seconds < 1) return `1 año en ${formatNumber(seconds * 1000, 0)} ms`;
  if (seconds < 90) return `1 año en ${formatNumber(seconds, 1)} s`;
  return `1 año en ${formatNumber(seconds / 60, 1)} min`;
}
