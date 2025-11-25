// lib/normalize.ts
import { toIsoString } from './time';
import { normalizeLevel } from './levels';
 
export type NormalizedLog = {
  receivedAt: string;
  ts: string;
  host: string | null;
  app: string | null;
  pid: number | null;
  level: 'debug'|'info'|'warn'|'error'|'fatal'|null;
  facility: string | null;
  message: string;
  tags: string[];
  meta: Record<string, any>;
};
 
function pickString(obj: any, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj?.[k];
    if (v == null) continue;
    const s = String(v);
    if (s.length) return s;
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
    if (Array.isArray(v)) return v.map(x => String(x));
    if (typeof v === 'string') {
      // "a,b,c" → ["a","b","c"]
      return v.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}
 
function pickFacility(obj: any): string | null {
  // pri: "auth.info" の先頭をfacilityとみなす
  const pri = obj?.pri ?? obj?.priority;
  if (pri && typeof pri === 'string' && pri.includes('.')) {
    return pri.split('.')[0];
  }
  // facilityキーがあればそれを使う
  return pickString(obj, ['facility']);
}
 
function pickTimestamp(obj: any): string | null {
  // よくあるキーを総当り
  const candidates = [
    obj?.timestamp, obj?.time, obj?.ts, obj?.@timestamp, obj?.date, obj?.datetime,
  ];
  for (const c of candidates) {
    const iso = toIsoString(c);
    if (iso) return iso;
  }
  return null;
}
 
function stripKnownKeys(obj: any, used: string[]): Record<string, any> {
  const meta: Record<string, any> = {};
  for (const k of Object.keys(obj ?? {})) {
    if (!used.includes(k)) {
      meta[k] = obj[k];
    }
  }
  return meta;
}
 
export function normalizeOne(input: any, nowIso: string): NormalizedLog {
  const ts = pickTimestamp(input) ?? nowIso;
 
  const host = pickString(input, ['host','hostname','source','computer','machine']);
  const app  = pickString(input, ['app','programname','proc','process','appname']);
  const pid  = pickNumber(input, ['pid','process_id']);
 
  const facility = pickFacility(input);
  const level = normalizeLevel(input?.level ?? input?.severity ?? input?.pri);
 
  const message = pickString(input, ['message','msg','log','content','text']) ?? '';
 
  const tags = pickTags(input, ['tags','tag']);
 
  const usedKeys = [
    'timestamp','time','ts','@timestamp','date','datetime',
    'host','hostname','source','computer','machine',
    'app','programname','proc','process','appname',
    'pid','process_id',
    'facility','pri','priority',
    'level','severity',
    'message','msg','log','content','text',
    'tags','tag',
  ];
 
  const meta = stripKnownKeys(input, usedKeys);
 
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
    meta
  };
}
 
export function normalizeAny(payload: unknown): NormalizedLog[] {
  const nowIso = new Date().toISOString();
  if (Array.isArray(payload)) {
    return payload.map(item => normalizeOne(item, nowIso));
  }
  if (payload && typeof payload === 'object') {
    return [normalizeOne(payload as any, nowIso)];
  }
  // 想定外は空配列
  return [];
}