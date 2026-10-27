/**
 * Formats a timestamp reactively based on the active language.
 * Supports ISO strings, timestamps, or legacy relative strings.
 */
export function formatRelativeTime(timestamp: string, lang: string = 'en'): string {
  if (!timestamp) return lang === 'es' ? 'Recién' : 'Just now';

  // Handle legacy seed strings translation
  const isEs = lang.startsWith('es');
  const lower = timestamp.toLowerCase();

  if (lower === 'recién' || lower === 'just now') {
    return isEs ? 'Recién' : 'Just now';
  }
  if (lower.startsWith('ayer') || lower.startsWith('yesterday')) {
    return isEs ? 'Ayer' : 'Yesterday';
  }
  if (lower.startsWith('hoy') || lower.startsWith('today')) {
    const timePart = timestamp.split(',')[1]?.trim() || '';
    const prefix = isEs ? 'Hoy' : 'Today';
    return timePart ? `${prefix}, ${timePart}` : prefix;
  }

  // Parse as real date
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    // If not a parseable date, return as-is
    return timestamp;
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  // Less than 1 minute
  if (diffSec < 60) {
    return isEs ? 'Recién' : 'Just now';
  }

  // Less than 1 hour
  if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    return isEs ? `Hace ${mins} min` : `${mins}m ago`;
  }

  // Check if today
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const timeFormatted = date.toLocaleTimeString(isEs ? 'es-ES' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isToday) {
    return isEs ? `Hoy, ${timeFormatted}` : `Today, ${timeFormatted}`;
  }

  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return isEs ? 'Ayer' : 'Yesterday';
  }

  // Older dates
  return date.toLocaleDateString(isEs ? 'es-ES' : 'en-US', {
    day: 'numeric',
    month: 'short',
  });
}
