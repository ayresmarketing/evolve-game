/**
 * Format hours (decimal) to "Xh e Ymin" format
 * e.g., 1.5 → "1h e 30min", 0.33 → "20min", 2 → "2h"
 */
export function formatHoursToHM(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h e ${m}min`;
}

/**
 * Format minutes to "Xh e Ymin" format
 * e.g., 90 → "1h e 30min", 20 → "20min", 120 → "2h"
 */
export function formatMinutesToHM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h e ${m}min`;
}
