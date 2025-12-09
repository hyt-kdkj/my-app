// app/api/ingest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { normalizeLogs } from '@/lib/log-normalizer';
import { normalizeAttendanceSnapshot } from '@/lib/attendance-normalizer';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        
        // まず出欠スナップショット形式として処理を試みる
        const attendanceLogs = normalizeAttendanceSnapshot(payload);
        
        if (attendanceLogs.length > 0) {
            // 出欠スナップショットデータとして保存
            await prisma.attendanceLog.createMany({
                data: attendanceLogs.map((log) => ({
                    receivedAt: new Date(log.receivedAt),
                    snapshotAt: new Date(log.snapshotAt),
                    classroomId: log.classroomId,
                    courseId: log.courseId,
                    teacherId: log.teacherId,
                    studentId: log.studentId,
                    studentName: log.studentName,
                    connectionType: log.connectionType,
                    ipAddress: log.ipAddress,
                    deviceInfo: log.deviceInfo,
                    meta: Object.keys(log.meta).length > 0 ? JSON.stringify(log.meta) : null,
                })),
                skipDuplicates: true,
            });

            return NextResponse.json({
                ok: true,
                type: 'attendance',
                count: attendanceLogs.length,
                classrooms: [...new Set(attendanceLogs.map((l) => l.classroomId))],
                students: [...new Set(attendanceLogs.map((l) => l.studentId))],
            });
        }
        
        // 出欠スナップショット形式でない場合、従来のログ形式として処理
        const logs = normalizeLogs(payload);

        if (logs.length > 0) {
            const data = logs.map((log) => ({
                receivedAt: new Date(log.receivedAt),
                ts: new Date(log.ts),
                host: log.host,
                app: log.app,
                pid: log.pid,
                level: log.level ?? null,
                facility: log.facility ?? null,
                message: log.message,
                tags: JSON.stringify(log.tags),
                meta: JSON.stringify(log.meta),
            }));

            await prisma.log.createMany({ data });

            return NextResponse.json({
                ok: true,
                type: 'log',
                count: logs.length,
            });
        }

        return NextResponse.json(
            { ok: false, error: 'No valid data found in payload' },
            { status: 400 },
        );
    } catch (e: any) {
        console.error('Ingest error:', e);
        return NextResponse.json(
            { ok: false, error: e?.message ?? 'invalid json' },
            { status: 400 },
        );
    }
}

export async function GET() {
    // 動作確認用（簡易ヘルプ）
    return NextResponse.json({
        ok: true,
        message: 'POST syslog-style JSON here to normalize and store into DB.',
    });
}