// lib/levels.ts
const MAP: Record<string, 'debug'|'info'|'warn'|'error'|'fatal'> = {
  trace: 'debug',
  debug: 'debug',
  information: 'info',
  info: 'info',
  notice: 'info',
  warning: 'warn',
  warn: 'warn',
  error: 'error',
  err: 'error',
  critical: 'fatal',
  crit: 'fatal',
  alert: 'fatal',
  emergency: 'fatal',
  emerg: 'fatal',
  fatal: 'fatal'
};
 
export function normalizeLevel(input: unknown): 'debug'|'info'|'warn'|'error'|'fatal'|null {
  if (!input) return null;
  let s = String(input).trim().toLowerCase();
 
  // pri/facility.severity 形式 "auth.info" の末尾を拾う
  if (s.includes('.')) {
    const parts = s.split('.');
    s = parts[parts.length - 1];
  }
  return MAP[s] ?? null;
}