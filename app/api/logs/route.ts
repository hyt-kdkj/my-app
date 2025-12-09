// app/api/logs/route.ts

import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

export async function GET() {

    const rows = await prisma.log.findMany({

        orderBy: { id: 'desc' },

        take: 10,

    });

    const logs = rows.map((r) => ({

        id: r.id,

        receivedAt: r.receivedAt,

        ts: r.ts,

        host: r.host,

        app: r.app,

        pid: r.pid,

        level: r.level,

        facility: r.facility,

        message: r.message,

        tags: JSON.parse(r.tags || '[]'),

        meta: JSON.parse(r.meta || '{}'),

    }));

    return NextResponse.json({ ok: true, logs });

}

