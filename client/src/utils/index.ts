/**
 * Conditionally joins class names together.
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format uptime seconds into human-readable string (e.g. 2h 15m 30s)
 */
export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);

  return parts.join(' ');
}

/**
 * Format date string into localized display (e.g., Oct 24, 2026, 4:30 PM)
 */
export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format date string into date-only display (e.g., Oct 24, 2026)
 */
export function formatDateOnly(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Calculates human-readable relative date information for due dates
 */
export function getRelativeDateInfo(dateString?: string | null): {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  urgencyLevel: 'none' | 'normal' | 'warning' | 'critical';
} {
  if (!dateString) {
    return {
      label: 'No due date',
      isOverdue: false,
      isToday: false,
      isTomorrow: false,
      urgencyLevel: 'none',
    };
  }

  const dueDate = new Date(dateString);
  if (isNaN(dueDate.getTime())) {
    return {
      label: dateString,
      isOverdue: false,
      isToday: false,
      isTomorrow: false,
      urgencyLevel: 'none',
    };
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const diffTime = startOfDueDate.getTime() - startOfToday.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      label: daysAgo === 1 ? 'Overdue by 1 day' : `Overdue by ${daysAgo} days`,
      isOverdue: true,
      isToday: false,
      isTomorrow: false,
      urgencyLevel: 'critical',
    };
  } else if (diffDays === 0) {
    return {
      label: 'Due Today',
      isOverdue: false,
      isToday: true,
      isTomorrow: false,
      urgencyLevel: 'warning',
    };
  } else if (diffDays === 1) {
    return {
      label: 'Due Tomorrow',
      isOverdue: false,
      isToday: false,
      isTomorrow: true,
      urgencyLevel: 'warning',
    };
  } else if (diffDays <= 7) {
    return {
      label: `Due in ${diffDays} days`,
      isOverdue: false,
      isToday: false,
      isTomorrow: false,
      urgencyLevel: 'normal',
    };
  }

  return {
    label: formatDateOnly(dateString),
    isOverdue: false,
    isToday: false,
    isTomorrow: false,
    urgencyLevel: 'none',
  };
}
