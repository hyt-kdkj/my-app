// lib/log-normalizer.ts

// 正規化後の1件分ログ
export type NormalizedLog = {
  receivedAt: string; // サーバ受信時刻（ISO8601）
  ts: string;         // ログ自体のタイムスタンプ
  host: string | null;
  app: string | null;
  level: string | null;
  facility: string | null;
  message: string;
  srcIp: string | null;
  srcMac: string | null;
  raw: any;           // 元のオブジェクト
};

// 汎用：任意値→ISO文字列
function toIsoString(value: unknown): string | null {
  try {
    if (typeof value === 'number') {
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

function normalizeLevel(input: unknown): string | null {
  if (!input) return null;
  let s = String(input).trim().toLowerCase();

  if (s.includes('.')) {
    const parts = s.split('.');
    s = parts[parts.length - 1];
  }

  const map: Record<string, string> = {
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

  return map[s] ?? s;
}

function pickFacility(obj: any): string | null {
  const pri = obj?.pri ?? obj?.priority;
  if (typeof pri === 'string' && pri.includes('.')) {
    return pri.split('.')[0];
  }
  return pickString(obj, ['facility']);
}

function pickIp(obj: any): string | null {
  return (
    pickString(obj, ['src_ip', 'source_ip', 'client_ip', 'ip']) ?? null
  );
}

function pickMac(obj: any): string | null {
  return (
    pickString(obj, ['src_mac', 'client_mac', 'mac']) ?? null
  );
}

function normalizeOne(raw: any, nowIso: string): NormalizedLog {
  const ts = pickTimestamp(raw) ?? nowIso;
  const host = pickString(raw, ['host', 'hostname', 'source', 'computer']);
  const app = pickString(raw, ['app', 'programname', 'proc', 'process', 'appname']);
  const level = normalizeLevel(raw?.level ?? raw?.severity ?? raw?.pri);
  const facility = pickFacility(raw);
  const message =
    pickString(raw, ['message', 'msg', 'log', 'content', 'text']) ?? '';

  const srcIp = pickIp(raw);
  const srcMac = pickMac(raw);

  return {
    receivedAt: nowIso,
    ts,
    host: host ?? null,
    app: app ?? null,
    level,
    facility: facility ?? null,
    message,
    srcIp,
    srcMac,
    raw,
  };
}

export function normalizeLogs(payload: unknown): NormalizedLog[] {
  const nowIso = new Date().toISOString();

  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeOne(item, nowIso));
  }

  if (payload && typeof payload === 'object') {
    return [normalizeOne(payload as any, nowIso)];
  }

  return [];
}
