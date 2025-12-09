import type { Log } from '@prisma/client';

type StudentInfo = {
    studentId: string;
    studentName?: string;
};

export type AttendanceStatusCode = 'present' | 'late' | 'early-leave' | 'absent';

export type AttendanceSnapshot = {
    at: Date;
    courseId?: string;
    teacherId?: string;
    classroomId?: string;
    period?: number;
    students: StudentInfo[];
};

export type AttendanceRecord = StudentInfo & {
    status: string;
    statusCode: AttendanceStatusCode;
    firstSeen?: string;
    lastSeen?: string;
    seenSnapshotCount: number;
    arrivalDelayMinutes?: number;
    departureGapMinutes?: number;
    presenceMinutes?: number;
};

export type AttendanceReport = {
    records: AttendanceRecord[];
    stats: {
        total: number;
        present: number;
        late: number;
        earlyLeave: number;
        absent: number;
    };
    unknownStudents: StudentInfo[];
};

const CAMPUS_TZ_OFFSET = '+09:00';
const SNAPSHOT_INTERVAL_MIN = 10;
const LATE_GRACE_MIN = 20;
const ON_TIME_GRACE_MIN = SNAPSHOT_INTERVAL_MIN - 1; // allow one polling slice
const END_TOLERANCE_MIN = SNAPSHOT_INTERVAL_MIN; // allow one interval near the end

export const CLASS_PERIODS: Record<number, { start: string; end: string }> = {
    1: { start: '08:50', end: '10:20' },
    2: { start: '10:40', end: '12:10' },
    3: { start: '13:20', end: '14:50' },
    4: { start: '15:10', end: '16:40' },
    5: { start: '17:00', end: '18:30' },
};

const STATUS_LABEL: Record<AttendanceStatusCode, string> = {
    present: '出席',
    late: '遅刻',
    'early-leave': '途中退出',
    absent: '欠席',
};

const STUDENT_ID_KEYS = ['studentId', 'student_id', 'id', 'sid', 'userId', 'user_id', 'code', 'number', 'deviceId'];
const STUDENT_NAME_KEYS = ['studentName', 'student_name', 'name', 'displayName', 'fullName'];

const COURSE_KEYS = ['courseId', 'course_id', 'course', 'classId', 'class_id', 'lectureId'];
const TEACHER_KEYS = ['teacherId', 'teacher_id', 'instructorId', 'instructor_id'];
const ROOM_KEYS = ['roomId', 'room_id', 'classroomId', 'classroom_id', 'room'];
const PERIOD_KEYS = ['period', 'periodNo', 'period_no'];

type AnyObject = Record<string, any>;

export function getPeriodBounds(date: string, period: number, tzOffset = CAMPUS_TZ_OFFSET) {
    const def = CLASS_PERIODS[period];
    if (!def) {
        throw new Error(`unknown period: ${period}`);
    }
    const start = new Date(`${date}T${def.start}:00${tzOffset}`);
    const end = new Date(`${date}T${def.end}:00${tzOffset}`);
    return { start, end };
}

export function buildSnapshotsFromLogs(rows: Log[]): AttendanceSnapshot[] {
    return rows
        .map((row) => {
            const meta = safeJson(row.meta) ?? {};
            const tags = safeJson(row.tags) ?? [];
            const students = extractStudents(meta);
            if (!students.length) {
                return null;
            }

            const courseId = pickString(meta, COURSE_KEYS) ?? pickFromTags(tags, ['course:', 'courseId:']);
            const teacherId = pickString(meta, TEACHER_KEYS) ?? pickFromTags(tags, ['teacher:', 'teacherId:']);
            const classroomId = pickString(meta, ROOM_KEYS) ?? pickFromTags(tags, ['room:', 'classroom:']);
            const period = pickNumber(meta, PERIOD_KEYS) ?? pickPeriodFromTags(tags);

            return {
                at: row.ts,
                courseId,
                teacherId,
                classroomId,
                period: period ?? undefined,
                students,
            } satisfies AttendanceSnapshot;
        })
        .filter((snap): snap is AttendanceSnapshot => Boolean(snap));
}

export function buildRosterFallback(snapshots: AttendanceSnapshot[]): StudentInfo[] {
    const map = new Map<string, StudentInfo>();
    for (const snap of snapshots) {
        for (const student of snap.students) {
            const normalized = normalizeStudent(student);
            if (!normalized) continue;
            if (!map.has(normalized.studentId) || (!map.get(normalized.studentId)?.studentName && normalized.studentName)) {
                map.set(normalized.studentId, normalized);
            }
        }
    }
    return Array.from(map.values()).sort((a, b) => a.studentId.localeCompare(b.studentId));
}

export function computeAttendance(args: {
    roster: StudentInfo[];
    snapshots: AttendanceSnapshot[];
    start: Date;
    end: Date;
}): AttendanceReport {
    const rosterMap = buildRosterMap(args.roster);
    const snapshots = args.snapshots
        .slice()
        .sort((a, b) => a.at.getTime() - b.at.getTime());

    const timeline = new Map<string, Date[]>();
    const snapshotNames = new Map<string, string | undefined>();

    for (const snap of snapshots) {
        for (const student of snap.students) {
            const normalized = normalizeStudent(student);
            if (!normalized) continue;
            snapshotNames.set(normalized.studentId, normalized.studentName ?? snapshotNames.get(normalized.studentId));
            const existing = timeline.get(normalized.studentId) ?? [];
            if (!existing.length || existing[existing.length - 1].getTime() !== snap.at.getTime()) {
                existing.push(snap.at);
            }
            timeline.set(normalized.studentId, existing);
        }
    }

    const rosterEntries = Array.from(rosterMap.values()).sort((a, b) => a.studentId.localeCompare(b.studentId));
    const records: AttendanceRecord[] = rosterEntries.map((student) =>
        buildRecord(student, timeline.get(student.studentId) ?? [], args.start, args.end),
    );

    const stats = records.reduce(
        (acc, record) => {
            acc.total += 1;
            if (record.statusCode === 'present') acc.present += 1;
            else if (record.statusCode === 'late') acc.late += 1;
            else if (record.statusCode === 'early-leave') acc.earlyLeave += 1;
            else acc.absent += 1;
            return acc;
        },
        { total: 0, present: 0, late: 0, earlyLeave: 0, absent: 0 },
    );

    const unknownStudents: StudentInfo[] = [];
    for (const [studentId, timestamps] of timeline.entries()) {
        if (rosterMap.has(studentId)) continue;
        const name = snapshotNames.get(studentId);
        unknownStudents.push({ studentId, studentName: name });
    }
    unknownStudents.sort((a, b) => a.studentId.localeCompare(b.studentId));

    return { records, stats, unknownStudents };
}

function buildRecord(student: StudentInfo, timestamps: Date[], start: Date, end: Date): AttendanceRecord {
    const classRange = timestamps.filter((ts) => ts.getTime() >= start.getTime() && ts.getTime() <= end.getTime() + minutesToMs(END_TOLERANCE_MIN));
    if (!classRange.length) {
        return {
            ...student,
            status: STATUS_LABEL.absent,
            statusCode: 'absent',
            seenSnapshotCount: 0,
        };
    }

    const firstSeen = classRange[0];
    const lastSeen = classRange[classRange.length - 1];
    const arrivalDelay = minutesBetween(firstSeen, start);
    const departureGap = minutesBetween(end, lastSeen);
    const presenceMinutes = Math.max(0, minutesBetween(lastSeen, firstSeen));
    const statusCode = evaluateStatus(arrivalDelay, departureGap);

    return {
        ...student,
        status: STATUS_LABEL[statusCode],
        statusCode,
        firstSeen: firstSeen.toISOString(),
        lastSeen: lastSeen.toISOString(),
        seenSnapshotCount: classRange.length,
        arrivalDelayMinutes: arrivalDelay,
        departureGapMinutes: departureGap,
        presenceMinutes,
    };
}

function evaluateStatus(arrivalDelay: number, departureGap: number): AttendanceStatusCode {
    const arrivalInGrace = arrivalDelay <= LATE_GRACE_MIN;
    const stayedUntilEnd = departureGap <= END_TOLERANCE_MIN;

    if (arrivalDelay <= ON_TIME_GRACE_MIN && stayedUntilEnd) {
        return 'present';
    }
    if (arrivalDelay <= LATE_GRACE_MIN && stayedUntilEnd) {
        return 'late';
    }
    if (arrivalInGrace && departureGap > END_TOLERANCE_MIN) {
        return 'early-leave';
    }
    return 'absent';
}

function buildRosterMap(roster: StudentInfo[]) {
    const map = new Map<string, StudentInfo>();
    for (const entry of roster) {
        const normalized = normalizeStudent(entry);
        if (!normalized) continue;
        if (!map.has(normalized.studentId) || (!map.get(normalized.studentId)?.studentName && normalized.studentName)) {
            map.set(normalized.studentId, normalized);
        }
    }
    return map;
}

function normalizeStudent(student: StudentInfo | undefined | null): StudentInfo | null {
    if (!student) return null;
    const studentId = student.studentId?.toString().trim();
    if (!studentId) return null;
    const studentName = student.studentName?.toString().trim();
    return { studentId, studentName: studentName || undefined };
}

function safeJson<T>(raw: string | null): T | undefined {
    if (!raw) return undefined;
    try {
        return JSON.parse(raw);
    } catch {
        return undefined;
    }
}

function extractStudents(meta: AnyObject): StudentInfo[] {
    const candidates = [
        meta?.snapshot?.students,
        meta?.attendance?.students,
        meta?.payload?.students,
        meta?.payload?.presentStudents,
        meta?.presentStudents,
        meta?.students,
        meta?.studentIds,
        meta?.present,
    ];
    for (const candidate of candidates) {
        const parsed = normalizeStudentCollection(candidate);
        if (parsed.length) {
            return parsed;
        }
    }
    return [];
}

function normalizeStudentCollection(value: unknown): StudentInfo[] {
    if (!value) return [];
    if (typeof value === 'string') {
        const tokens = value
            .split(/[\s,]+/)
            .map((token) => token.trim())
            .filter(Boolean)
            .map((token) => ({ studentId: token }));
        return dedupeStudents(tokens);
    }
    if (Array.isArray(value)) {
        return dedupeStudents(value.map(normalizeStudentFromUnknown));
    }
    if (typeof value === 'object') {
        const entries: StudentInfo[] = [];
        for (const [key, v] of Object.entries(value)) {
            if (v == null) continue;
            if (typeof v === 'string') {
                entries.push({ studentId: v.trim(), studentName: key !== v ? key : undefined });
                continue;
            }
            if (typeof v === 'object') {
                entries.push(
                    normalizeStudent({
                        studentId: (v as AnyObject)?.studentId ?? (v as AnyObject)?.id ?? key,
                        studentName: (v as AnyObject)?.studentName ?? (v as AnyObject)?.name,
                    }) ?? { studentId: key },
                );
                continue;
            }
        }
        return dedupeStudents(entries);
    }
    return [];
}

function normalizeStudentFromUnknown(value: unknown): StudentInfo | null {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed ? { studentId: trimmed } : null;
    }
    if (typeof value === 'object' && value) {
        for (const key of STUDENT_ID_KEYS) {
            const id = (value as AnyObject)[key];
            if (id != null) {
                const name = STUDENT_NAME_KEYS.map((k) => (value as AnyObject)[k]).find((n) => n != null);
                return normalizeStudent({ studentId: String(id), studentName: name != null ? String(name) : undefined });
            }
        }
    }
    return null;
}

function dedupeStudents(list: Array<StudentInfo | null | undefined>): StudentInfo[] {
    const map = new Map<string, StudentInfo>();
    for (const entry of list) {
        if (!entry) continue;
        const normalized = normalizeStudent(entry);
        if (!normalized) continue;
        if (!map.has(normalized.studentId) || (!map.get(normalized.studentId)?.studentName && normalized.studentName)) {
            map.set(normalized.studentId, normalized);
        }
    }
    return Array.from(map.values());
}

function pickString(obj: AnyObject, keys: string[]): string | undefined {
    for (const key of keys) {
        const value = getNested(obj, key);
        if (value == null) continue;
        const str = String(value).trim();
        if (str) return str;
    }
    return undefined;
}

function pickNumber(obj: AnyObject, keys: string[]): number | undefined {
    for (const key of keys) {
        const value = getNested(obj, key);
        if (value == null) continue;
        const num = Number(value);
        if (!Number.isNaN(num)) return num;
    }
    return undefined;
}

function getNested(obj: AnyObject, dottedKey: string) {
    return dottedKey.split('.').reduce((acc: any, part) => (acc == null ? undefined : acc[part]), obj);
}

function pickFromTags(tags: unknown, prefixes: string[]): string | undefined {
    if (!Array.isArray(tags)) return undefined;
    for (const raw of tags) {
        const tag = typeof raw === 'string' ? raw : '';
        for (const prefix of prefixes) {
            if (tag.startsWith(prefix)) {
                return tag.slice(prefix.length);
            }
        }
    }
    return undefined;
}

function pickPeriodFromTags(tags: unknown): number | undefined {
    if (!Array.isArray(tags)) return undefined;
    for (const raw of tags) {
        if (typeof raw !== 'string') continue;
        const match = raw.match(/period[:=](\d)/i);
        if (match) {
            const num = Number(match[1]);
            if (!Number.isNaN(num)) return num;
        }
    }
    return undefined;
}

function minutesBetween(a: Date, b: Date) {
    return Math.floor((a.getTime() - b.getTime()) / 60000);
}

function minutesToMs(min: number) {
    return min * 60 * 1000;
}