// lib/log-normalizer.ts
 
// 正規化された1レコードの型
export type NormalizedLog = {
  receivedAt: string;   // サーバが受け取った時刻（ISO8601）
  ts: string;           // ログ自体のタイムスタンプ（なければ receivedAt）
  host: string | null;
  app: string | null;
  pid: number | null;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal' | null;
  facility: string | null;
  message: string;
  tags: string[];
  meta: Record<string, any>; // 使い切れなかったフィールド
};
 
// 日時をそれっぽく解釈してISO文字列にするユーティリティ
function toIsoString(value: unknown): string | null {
  try {
    if (typeof value === 'number') {
      // 10桁くらいなら秒、13桁ならミリ秒想定
      const ms = value < 1e12 ? Math.round(value * 1000) : value;
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d.toISOString();
    }
    if (typeof value === 'string') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d.toISOString();
    }
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value.toISOString();
    }
  } catch {
    // ignore
  }
  return null;
}
 
// syslogのレベル文字列を統一
function normalizeLevel(input: unknown): NormalizedLog['level'] {
  if (!input) return null;
  let s = String(input).trim().toLowerCase();
 
  // "auth.info" みたいな形式は末尾だけ使う
  if (s.includes('.')) {
    const parts = s.split('.');
    s = parts[parts.length - 1];
  }
 
  const map: Record<string, NormalizedLog['level']> = {
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
    fatal: 'fatal',
  };
 
  return map[s] ?? null;
}
 
function pickTimestamp(obj: any): string | null {
  const candidates = [
    obj?.timestamp,
    obj?.time,
    obj?.ts,
    obj?.['@timestamp'],
    obj?.date,
    obj?.datetime,
  ];
  for (const c of candidates) {
    const iso = toIsoString(c);
    if (iso) return iso;
  }
  return null;
}
 
function pickString(obj: any, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj?.[k];
    if (v == null) continue;
    const s = String(v);
    if (s.length > 0) return s;
  }
  return null;
}
 
function pickNumber(obj: any, keys: string[]): number | null {
  for (const k of keys) {
    const v = obj?.[k];
    if (v == null) continue;
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}
 
function pickTags(obj: any, keys: string[]): string[] {
  for (const k of keys) {
    const v = obj?.[k];
    if (!v) continue;
    if (Array.isArray(v)) return v.map((x) => String(x));
    if (typeof v === 'string') {
      return v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}
 
function pickFacility(obj: any): string | null {
  const pri = obj?.pri ?? obj?.priority;
  if (typeof pri === 'string' && pri.includes('.')) {
    // "auth.info" → "auth"
    return pri.split('.')[0];
  }
  return pickString(obj, ['facility']);
}
 
function normalizeOne(raw: any, nowIso: string): NormalizedLog {
  const ts = pickTimestamp(raw) ?? nowIso;
 
  const host = pickString(raw, ['host', 'hostname', 'source', 'computer', 'machine']);
  const app = pickString(raw, ['app', 'programname', 'proc', 'process', 'appname']);
  const pid = pickNumber(raw, ['pid', 'process_id']);
 
  const level = normalizeLevel(raw?.level ?? raw?.severity ?? raw?.pri);
  const facility = pickFacility(raw);
 
  const message =
    pickString(raw, ['message', 'msg', 'log', 'content', 'text']) ?? '';
 
  const tags = pickTags(raw, ['tags', 'tag']);
 
  const usedKeys = new Set([
    'timestamp',
    'time',
    'ts',
    '@timestamp',
    'date',
    'datetime',
    'host',
    'hostname',
    'source',
    'computer',
    'machine',
    'app',
    'programname',
    'proc',
    'process',
    'appname',
    'pid',
    'process_id',
    'facility',
    'pri',
    'priority',
    'level',
    'severity',
    'message',
    'msg',
    'log',
    'content',
    'text',
    'tags',
    'tag',
  ]);
 
  const meta: Record<string, any> = {};
  if (raw && typeof raw === 'object') {
    for (const k of Object.keys(raw)) {
      if (!usedKeys.has(k)) {
        meta[k] = raw[k];
      }
    }
  }
 
  return {
    receivedAt: nowIso,
    ts,
    host: host ?? null,
    app: app ?? null,
    pid: pid ?? null,
    level,
    facility: facility ?? null,
    message,
    tags,
    meta,
  };
}
 
// 外から使う関数：オブジェクト or 配列 どちらでも受け取れる
export function normalizeLogs(payload: unknown): NormalizedLog[] {
  const nowIso = new Date().toISOString();
 
  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeOne(item, nowIso));
  }
 
  if (payload && typeof payload === 'object') {
    return [normalizeOne(payload as any, nowIso)];
  }
 
  // 想定外（文字列だけとか）は空配列に
  return [];
}