import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
    buildRosterFallback,
    buildSnapshotsFromLogs,
    computeAttendance,
    getPeriodBounds,
    CLASS_PERIODS,
} from '@/lib/attendance';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PERIOD_MAX = Math.max(...Object.keys(CLASS_PERIODS).map((k) => Number(k)));
const PRE_WINDOW_MIN = 30;
const POST_WINDOW_MIN = 15;

const RequestSchema = z.object({
    date: z
        .string()
        .regex(/^(\d{4})-(\d{2})-(\d{2})$/, 'date must be formatted as YYYY-MM-DD'),
    period: z.number().int().min(1).max(PERIOD_MAX),
    courseId: z.string().optional(),
    teacherId: z.string().optional(),
    classroomId: z.string().optional(),
    roster: z
        .array(
            z.object({
                studentId: z.string().min(1),
                studentName: z.string().optional(),
            }),
        )
        .optional()
        .default([]),
});

export async function POST(req: NextRequest) {
    const body = await readJson(req);
    if (body == null) {
        return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ ok: false, error: 'invalid_payload', issues: parsed.error.issues }, { status: 400 });
    }

    const { date, period, courseId, teacherId, classroomId } = parsed.data;
    const { start, end } = getPeriodBounds(date, period);

    const rows = await prisma.log.findMany({
        where: {
            ts: {
                gte: new Date(start.getTime() - minutesToMs(PRE_WINDOW_MIN)),
                lte: new Date(end.getTime() + minutesToMs(POST_WINDOW_MIN)),
            },
        },
        orderBy: { ts: 'asc' },
    });

    const snapshots = buildSnapshotsFromLogs(rows).filter((snap) => {
        if (courseId && snap.courseId && snap.courseId !== courseId) return false;
        if (teacherId && snap.teacherId && snap.teacherId !== teacherId) return false;
        if (classroomId && snap.classroomId && snap.classroomId !== classroomId) return false;
        if (snap.period && snap.period !== period) return false;
        return true;
    });

    const rosterSource = parsed.data.roster.length ? 'request' : 'snapshots';
    const roster = parsed.data.roster.length ? parsed.data.roster : buildRosterFallback(snapshots);

    const report = computeAttendance({ roster, snapshots, start, end });

    const firstSnapshot = snapshots[0]?.at?.toISOString();
    const lastSnapshot = snapshots.length ? snapshots[snapshots.length - 1]?.at?.toISOString() : null;

    return NextResponse.json({
        ok: true,
        date,
        period,
        window: {
            start: start.toISOString(),
            end: end.toISOString(),
        },
        filters: {
            courseId: courseId ?? null,
            teacherId: teacherId ?? null,
            classroomId: classroomId ?? null,
        },
        roster: {
            source: rosterSource,
            size: roster.length,
        },
        snapshotSummary: {
            total: snapshots.length,
            first: firstSnapshot ?? null,
            last: lastSnapshot,
            preWindowMinutes: PRE_WINDOW_MIN,
            postWindowMinutes: POST_WINDOW_MIN,
        },
        stats: report.stats,
        records: report.records,
        unknownStudents: report.unknownStudents,
    });
}

async function readJson(req: NextRequest) {
    try {
        return await req.json();
    } catch {
        return null;
    }
}

function minutesToMs(minutes: number) {
    return minutes * 60 * 1000;
}