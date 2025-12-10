// app/api/ingest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeLogs } from '@/lib/log-normalizer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const logs = normalizeLogs(payload);

    if (logs.length === 0) {
      return NextResponse.json({ ok: false, error: 'no logs' }, { status: 400 });
    }

    const data = logs.map((log) => ({
      receivedAt: new Date(log.receivedAt),
      ts: new Date(log.ts),
      host: log.host,
      app: log.app,
      level: log.level,
      facility: log.facility,
      message: log.message,
      srcIp: log.srcIp,
      srcMac: log.srcMac,
      raw: JSON.stringify(log.raw),
    }));

    await prisma.rawLog.createMany({ data });

    return NextResponse.json({ ok: true, count: logs.length });
  } catch (e: any) {
    console.error('[INGEST ERROR]', e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'invalid json' },
      { status: 400 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'POST syslog-style JSON here to normalize and store into RawLog.',
  });
}
