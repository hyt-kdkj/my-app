// lib/attendance-normalizer.ts

// 10分間隔で送られてくるスナップショットの型
export type AttendanceSnapshot = {
  timestamp: string;           // スナップショット取得時刻（ISO8601）
  classroomId: string;         // 教室ID
  courseId?: string;           // 授業ID（オプション）
  teacherId?: string;          // 教員ID（オプション）
  students: StudentPresence[]; // 在室学生リスト
};

export type StudentPresence = {
  studentId: string;           // 学籍番号
  studentName?: string;        // 学生名（オプション）
  connectionType?: string;     // 接続種別（WiFi, VPN等）
  ipAddress?: string;          // IPアドレス
  deviceInfo?: string;         // デバイス情報
};

// 正規化後のデータベース格納形式
export type NormalizedAttendanceLog = {
  receivedAt: string;          // サーバ受信時刻
  snapshotAt: string;          // スナップショット時刻
  classroomId: string;
  courseId: string | null;
  teacherId: string | null;
  studentId: string;
  studentName: string | null;
  connectionType: string | null;
  ipAddress: string | null;
  deviceInfo: string | null;
  meta: Record<string, any>;   // その他の情報
};

// スナップショットを個別のログレコードに展開
export function normalizeAttendanceSnapshot(
  payload: unknown
): NormalizedAttendanceLog[] {
  const nowIso = new Date().toISOString();
  const results: NormalizedAttendanceLog[] = [];

  try {
    // 配列で送られてくる場合（複数教室のバッチ）
    if (Array.isArray(payload)) {
      for (const item of payload) {
        results.push(...processSnapshot(item, nowIso));
      }
      return results;
    }

    // 単一スナップショットの場合
    if (payload && typeof payload === 'object') {
      return processSnapshot(payload as any, nowIso);
    }
  } catch (error) {
    console.error('Failed to normalize attendance snapshot:', error);
  }

  return results;
}

function processSnapshot(raw: any, nowIso: string): NormalizedAttendanceLog[] {
  const snapshotAt = parseTimestamp(raw.timestamp || raw.time || raw.ts) || nowIso;
  const classroomId = String(raw.classroomId || raw.classroom || raw.room || raw.classroomId || '');
  const courseId = raw.courseId || raw.course || null;
  const teacherId = raw.teacherId || raw.teacher || null;

  // 学生リストを取得（複数のフィールド名に対応）
  const students = Array.isArray(raw.students)
    ? raw.students
    : Array.isArray(raw.attendees)
    ? raw.attendees
    : Array.isArray(raw.presentStudents)
    ? raw.presentStudents
    : [];

  if (!classroomId || students.length === 0) {
    return [];
  }

  // 各学生を個別レコードに展開
  return students
    .map((student: any) => {
      const studentId = String(
        student.studentId || student.id || student.userId || student.student_id || ''
      ).trim();

      if (!studentId) {
        return null;
      }

      return {
        receivedAt: nowIso,
        snapshotAt,
        classroomId,
        courseId,
        teacherId,
        studentId,
        studentName: student.name || student.studentName || student.student_name || null,
        connectionType: student.connectionType || student.connection || null,
        ipAddress: student.ip || student.ipAddress || student.ip_address || null,
        deviceInfo: student.device || student.deviceInfo || student.device_info || null,
        meta: extractMeta(student),
      };
    })
    .filter((log): log is NormalizedAttendanceLog => log !== null);
}

function parseTimestamp(value: unknown): string | null {
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

function extractMeta(student: any): Record<string, any> {
  const usedKeys = new Set([
    'studentId',
    'id',
    'userId',
    'student_id',
    'name',
    'studentName',
    'student_name',
    'connectionType',
    'connection',
    'ip',
    'ipAddress',
    'ip_address',
    'device',
    'deviceInfo',
    'device_info',
  ]);

  const meta: Record<string, any> = {};
  if (student && typeof student === 'object') {
    for (const [key, value] of Object.entries(student)) {
      if (!usedKeys.has(key)) {
        meta[key] = value;
      }
    }
  }
  return meta;
}
