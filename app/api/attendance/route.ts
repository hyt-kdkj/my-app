// app/api/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/attendance?courseCode=NW101&date=2025-11-25
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseCode = searchParams.get('courseCode');
    const dateStr = searchParams.get('date'); // "YYYY-MM-DD"

    if (!courseCode || !dateStr) {
      return NextResponse.json(
        { ok: false, error: 'courseCode と date は必須です' },
        { status: 400 },
      );
    }

    const dayStart = new Date(`${dateStr}T00:00:00`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999`);

    const course = await prisma.course.findUnique({
      where: { code: courseCode },
    });

    if (!course) {
      return NextResponse.json(
        { ok: false, error: '指定された courseCode の授業が見つかりません' },
        { status: 404 },
      );
    }

    // この日はどの session か（1コマ想定）
    const session = await prisma.session.findFirst({
      where: {
        courseId: course.id,
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          ok: true,
          course: { code: course.code, name: course.name },
          date: dateStr,
          attendance: [],
          note: 'この日付の Session が登録されていません',
        },
        { status: 200 },
      );
    }

    const records = await prisma.attendance.findMany({
      where: {
        sessionId: session.id,
      },
      include: {
        student: true,
      },
      orderBy: {
        student: {
          studentNumber: 'asc',
        },
      },
    });

    const attendance = records.map((r) => ({
      studentNumber: r.student.studentNumber,
      name: r.student.name,
      status: r.status,
      firstSeen: r.firstSeen,
      lastSeen: r.lastSeen,
    }));

    return NextResponse.json({
      ok: true,
      course: { code: course.code, name: course.name },
      session: {
        id: session.id,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
      },
      date: dateStr,
      attendance,
    });
  } catch (e: any) {
    console.error('[ATTENDANCE ERROR]', e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'internal error' },
      { status: 500 },
    );
  }
}
