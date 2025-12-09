// テストスクリプト: 出席管理システムの動作確認
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1限の授業: 08:50 - 10:20
// テストデータ: 2025-12-02の1限授業
const TEST_DATE = '2025-12-02';
const COURSE_ID = 'cs101';
const TEACHER_ID = 'T001';
const CLASSROOM_ID = 'R301';
const PERIOD = 1;

// 学生リスト
const STUDENTS = {
  present: ['S2024001', 'S2024002'], // 出席: 開始時からずっといる
  late: ['S2024003'], // 遅刻: 9:10に到着して最後までいる
  earlyLeave: ['S2024004'], // 途中退出: 開始時にいたが9:40に退出
  absent: ['S2024005'], // 欠席: 一度も検出されない
  absentTooLate: ['S2024006'], // 欠席(遅すぎる): 9:20に来たが授業終了前に退出
};

async function clearOldTestData() {
  console.log('古いテストデータを削除中...');
  await prisma.log.deleteMany({
    where: {
      ts: {
        gte: new Date(`${TEST_DATE}T08:00:00+09:00`),
        lte: new Date(`${TEST_DATE}T11:00:00+09:00`),
      },
    },
  });
  console.log('✓ 削除完了\n');
}

async function insertTestLogs() {
  console.log('テストログデータを挿入中...\n');

  // 10分ごとのスナップショット時刻
  const snapshots = [
    { time: '08:50', students: ['S2024001', 'S2024002', 'S2024004'] }, // 開始時
    { time: '09:00', students: ['S2024001', 'S2024002', 'S2024004'] },
    { time: '09:10', students: ['S2024001', 'S2024002', 'S2024003', 'S2024004'] }, // S2024003が遅刻で到着
    { time: '09:20', students: ['S2024001', 'S2024002', 'S2024003', 'S2024004', 'S2024006'] }, // S2024006が遅すぎて到着
    { time: '09:30', students: ['S2024001', 'S2024002', 'S2024003', 'S2024004'] }, // S2024006が退出
    { time: '09:40', students: ['S2024001', 'S2024002', 'S2024003'] }, // S2024004が途中退出
    { time: '09:50', students: ['S2024001', 'S2024002', 'S2024003'] },
    { time: '10:00', students: ['S2024001', 'S2024002', 'S2024003'] },
    { time: '10:10', students: ['S2024001', 'S2024002', 'S2024003'] },
    { time: '10:20', students: ['S2024001', 'S2024002', 'S2024003'] }, // 終了時
  ];

  const logs = [];
  for (const snap of snapshots) {
    const ts = new Date(`${TEST_DATE}T${snap.time}:00+09:00`);
    logs.push({
      receivedAt: ts,
      ts: ts,
      host: 'wifi-ap-301',
      app: 'attendance-collector',
      pid: 1234,
      level: 'info',
      facility: 'local0',
      message: `Classroom snapshot at ${snap.time}`,
      tags: JSON.stringify([
        `courseId:${COURSE_ID}`,
        `teacherId:${TEACHER_ID}`,
        `classroom:${CLASSROOM_ID}`,
        `period:${PERIOD}`,
      ]),
      meta: JSON.stringify({
        courseId: COURSE_ID,
        teacherId: TEACHER_ID,
        classroomId: CLASSROOM_ID,
        period: PERIOD,
        snapshot: {
          students: snap.students.map((id) => ({ studentId: id })),
        },
      }),
    });
  }

  await prisma.log.createMany({ data: logs });
  console.log(`✓ ${logs.length}件のスナップショットを挿入しました`);
  
  // 挿入したデータの概要を表示
  console.log('\n【挿入したスナップショット】');
  for (const snap of snapshots) {
    console.log(`  ${snap.time}: ${snap.students.join(', ')}`);
  }
}

async function testAttendanceAPI() {
  console.log('\n\n=== APIエンドポイントのテスト ===\n');

  const roster = [
    { studentId: 'S2024001', studentName: '山田太郎' },
    { studentId: 'S2024002', studentName: '佐藤花子' },
    { studentId: 'S2024003', studentName: '鈴木一郎' },
    { studentId: 'S2024004', studentName: '高橋美咲' },
    { studentId: 'S2024005', studentName: '田中健太' },
    { studentId: 'S2024006', studentName: '伊藤真理' },
  ];

  const payload = {
    date: TEST_DATE,
    period: PERIOD,
    courseId: COURSE_ID,
    teacherId: TEACHER_ID,
    classroomId: CLASSROOM_ID,
    roster: roster,
  };

  try {
    const response = await fetch('http://localhost:3000/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ APIエラー:', response.status, error);
      return;
    }

    const result = await response.json();
    console.log('✓ API呼び出し成功\n');

    // 結果の表示
    console.log('【出席統計】');
    console.log(`  合計: ${result.stats.total}人`);
    console.log(`  出席: ${result.stats.present}人`);
    console.log(`  遅刻: ${result.stats.late}人`);
    console.log(`  途中退出: ${result.stats.earlyLeave}人`);
    console.log(`  欠席: ${result.stats.absent}人`);

    console.log('\n【スナップショット情報】');
    console.log(`  取得数: ${result.snapshotSummary.total}件`);
    console.log(`  最初: ${result.snapshotSummary.first}`);
    console.log(`  最後: ${result.snapshotSummary.last}`);

    console.log('\n【学生別出席状況】');
    for (const record of result.records) {
      const arrival = record.firstSeen
        ? new Date(record.firstSeen).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
        : '-';
      const departure = record.lastSeen
        ? new Date(record.lastSeen).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
        : '-';
      
      console.log(
        `  ${record.studentId} (${record.studentName || '名前なし'}): ${record.status}` +
        (record.firstSeen ? ` | 到着: ${arrival}, 退出: ${departure}, 検出回数: ${record.seenSnapshotCount}回` : '')
      );
    }

    if (result.unknownStudents && result.unknownStudents.length > 0) {
      console.log('\n【名簿外の学生】');
      for (const student of result.unknownStudents) {
        console.log(`  ${student.studentId}`);
      }
    }

    // 期待値との比較
    console.log('\n\n=== 分類結果の検証 ===\n');
    const statusMap = {};
    for (const record of result.records) {
      statusMap[record.studentId] = record.statusCode;
    }

    const checks = [
      { id: 'S2024001', expected: 'present', desc: '開始時から最後までいる' },
      { id: 'S2024002', expected: 'present', desc: '開始時から最後までいる' },
      { id: 'S2024003', expected: 'late', desc: '9:10到着(20分以内)で最後までいる' },
      { id: 'S2024004', expected: 'early-leave', desc: '開始時にいたが9:40に退出' },
      { id: 'S2024005', expected: 'absent', desc: '一度も検出されない' },
      { id: 'S2024006', expected: 'absent', desc: '9:20到着(遅刻枠超過)で早期退出' },
    ];

    let passed = 0;
    let failed = 0;

    for (const check of checks) {
      const actual = statusMap[check.id];
      const match = actual === check.expected;
      const mark = match ? '✓' : '✗';
      const status = match ? 'PASS' : 'FAIL';
      
      console.log(`${mark} ${check.id}: ${status}`);
      console.log(`   期待: ${check.expected}, 実際: ${actual} - ${check.desc}`);
      
      if (match) {
        passed++;
      } else {
        failed++;
      }
    }

    console.log(`\n結果: ${passed}/${checks.length} 件成功`);
    
    if (failed === 0) {
      console.log('\n🎉 すべてのテストに合格しました!');
    } else {
      console.log(`\n⚠️  ${failed}件のテストが失敗しました`);
    }

  } catch (error) {
    console.error('❌ テスト実行エラー:', error);
  }
}

async function main() {
  console.log('=== 出席管理システム動作確認 ===\n');

  try {
    await clearOldTestData();
    await insertTestLogs();
    
    console.log('\n開発サーバーが http://localhost:3000 で起動していることを確認してください');
    console.log('準備ができたら Enter キーを押してください...');
    
    // Enterキー待機
    await new Promise((resolve) => {
      process.stdin.once('data', resolve);
    });

    await testAttendanceAPI();

  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
