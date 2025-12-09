// テスト用スクリプト: 出欠スナップショットデータを送信

const testData = {
  timestamp: new Date().toISOString(),
  classroomId: 'E201',
  courseId: 'CS101',
  teacherId: 'T001',
  students: [
    {
      studentId: 'S2024001',
      name: '山田太郎',
      connectionType: 'WiFi',
      ipAddress: '10.0.1.100'
    },
    {
      studentId: 'S2024002',
      name: '佐藤花子',
      connectionType: 'VPN',
      ipAddress: '10.0.2.50'
    },
    {
      studentId: 'S2024003',
      name: '鈴木一郎',
      connectionType: 'WiFi',
      ipAddress: '10.0.1.101'
    }
  ]
};

async function testIngest() {
  try {
    const response = await fetch('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));
    
    if (result.ok) {
      console.log('\n✅ データの送信に成功しました！');
      console.log(`   種別: ${result.type}`);
      console.log(`   件数: ${result.count}件`);
      if (result.classrooms) {
        console.log(`   教室: ${result.classrooms.join(', ')}`);
      }
      if (result.students) {
        console.log(`   学生数: ${result.students.length}人`);
      }
    } else {
      console.log('\n❌ エラーが発生しました:', result.error);
    }
  } catch (error) {
    console.error('❌ リクエストエラー:', error.message);
  }
}

// 複数教室のバッチテスト
async function testBatchIngest() {
  const batchData = [
    {
      timestamp: new Date().toISOString(),
      classroomId: 'E201',
      courseId: 'CS101',
      teacherId: 'T001',
      students: [
        { studentId: 'S2024001', name: '山田太郎' },
        { studentId: 'S2024002', name: '佐藤花子' }
      ]
    },
    {
      timestamp: new Date().toISOString(),
      classroomId: 'E202',
      courseId: 'CS201',
      teacherId: 'T001',
      students: [
        { studentId: 'S2023015', name: '吉田拓也' },
        { studentId: 'S2023016', name: '山口愛美' }
      ]
    }
  ];

  try {
    const response = await fetch('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchData),
    });

    const result = await response.json();
    console.log('\n[バッチテスト]');
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ バッチリクエストエラー:', error.message);
  }
}

console.log('=== 出欠スナップショット送信テスト ===\n');
console.log('送信データ:');
console.log(JSON.stringify(testData, null, 2));
console.log('\n送信中...\n');

testIngest().then(() => {
  console.log('\n--- 5秒後にバッチテストを実行 ---');
  setTimeout(testBatchIngest, 5000);
});
