// app/api/logs/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await prisma.rawLog.findMany({
      orderBy: { id: 'desc' },
      take: 50,
    });

    const logs = rows.map((r) => ({
      id: r.id,
      receivedAt: r.receivedAt,
      ts: r.ts,
      host: r.host,
      app: r.app,
      level: r.level,
      facility: r.facility,
      message: r.message,
      srcIp: r.srcIp,
      srcMac: r.srcMac,
      raw: (() => {
        try {
          return JSON.parse(r.raw);
        } catch {
          return r.raw;
        }
      })(),
    }));

    return NextResponse.json({ ok: true, logs });
  } catch (e: any) {
    console.error('[LOGS ERROR]', e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'internal error' },
      { status: 500 },
    );
  }
}