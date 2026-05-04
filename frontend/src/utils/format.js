/** Shared date/status utilities */

export const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

export const isOverdue = (d, status) =>
  !!d && new Date(d) < new Date() && status !== 'DONE';
