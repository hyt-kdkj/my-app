// モックデータ - 実際の実装ではデータベースから取得します
 
export interface Course {

  id: string

  code: string

  name: string

  day: string

  time: string

  studentCount: number

  teacherId: string

}
 
export interface AttendanceRecord {

  studentId: string

  studentName: string

  status: '出席' | '欠席' | '遅刻' | '途中退出'

  connectedAt?: string

  departedAt?: string

}
 
export interface DateAttendanceData {

  date: string

  displayDate: string

  records: AttendanceRecord[]

}
 
const courses: Course[] = [

  {

    id: 'cs101',

    code: 'CS101',

    name: 'コンピュータサイエンス入門',

    day: '月曜日',

    time: '1限 (9:00-10:30)',

    studentCount: 45,

    teacherId: 'T001'

  },

  {

    id: 'cs201',

    code: 'CS201',

    name: 'データ構造とアルゴリズム',

    day: '水曜日',

    time: '2限 (10:40-12:10)',

    studentCount: 38,

    teacherId: 'T001'

  },

  {

    id: 'cs301',

    code: 'CS301',

    name: 'Webプログラミング',

    day: '金曜日',

    time: '3限 (13:00-14:30)',

    studentCount: 42,

    teacherId: 'T001'

  },

  {

    id: 'math101',

    code: 'MATH101',

    name: '線形代数',

    day: '火曜日',

    time: '1限 (9:00-10:30)',

    studentCount: 50,

    teacherId: 'T002'

  },

  {

    id: 'math201',

    code: 'MATH201',

    name: '微分積分',

    day: '木曜日',

    time: '2限 (10:40-12:10)',

    studentCount: 48,

    teacherId: 'T002'

  }

]
 
const attendanceRecords: { [courseId: string]: DateAttendanceData[] } = {

  cs101: [

    {

      date: '2025-01-20',

      displayDate: '2025年1月20日',

      records: [

        { studentId: 'S2024001', studentName: '山田太郎', status: '出席', connectedAt: '8:58', departedAt: '10:18' },

        { studentId: 'S2024002', studentName: '佐藤花子', status: '出席', connectedAt: '8:55', departedAt: '10:22' },

        { studentId: 'S2024003', studentName: '鈴木一郎', status: '遅刻', connectedAt: '9:15', departedAt: '10:20' },

        { studentId: 'S2024004', studentName: '高橋美咲', status: '途中退出', connectedAt: '8:52', departedAt: '9:45' },

        { studentId: 'S2024005', studentName: '田中健太', status: '欠席' },

        { studentId: 'S2024006', studentName: '伊藤真理', status: '出席', connectedAt: '9:01', departedAt: '10:19' },

        { studentId: 'S2024007', studentName: '渡辺隆', status: '途中退出', connectedAt: '8:57', departedAt: '9:50' },

        { studentId: 'S2024008', studentName: '中村さくら', status: '出席', connectedAt: '8:59', departedAt: '10:21' },

        { studentId: 'S2024009', studentName: '小林大輔', status: '欠席' },

        { studentId: 'S2024010', studentName: '加藤結衣', status: '出席', connectedAt: '9:00', departedAt: '10:20' }

      ]

    },

    {

      date: '2025-01-13',

      displayDate: '2025年1月13日',

      records: [

        { studentId: 'S2024001', studentName: '山田太郎', status: '出席', connectedAt: '8:57', departedAt: '10:19' },

        { studentId: 'S2024002', studentName: '佐藤花子', status: '遅刻', connectedAt: '9:10', departedAt: '10:20' },

        { studentId: 'S2024003', studentName: '鈴木一郎', status: '出席', connectedAt: '8:55', departedAt: '10:21' },

        { studentId: 'S2024004', studentName: '高橋美咲', status: '出席', connectedAt: '8:59', departedAt: '10:18' },

        { studentId: 'S2024005', studentName: '田中健太', status: '途中退出', connectedAt: '9:00', departedAt: '9:55' },

        { studentId: 'S2024006', studentName: '伊藤真理', status: '出席', connectedAt: '8:58', departedAt: '10:22' },

        { studentId: 'S2024007', studentName: '渡辺隆', status: '出席', connectedAt: '8:56', departedAt: '10:20' },

        { studentId: 'S2024008', studentName: '中村さくら', status: '欠席' },

        { studentId: 'S2024009', studentName: '小林大輔', status: '出席', connectedAt: '9:01', departedAt: '10:19' },

        { studentId: 'S2024010', studentName: '加藤結衣', status: '出席', connectedAt: '8:54', departedAt: '10:23' }

      ]

    }

  ],

  cs201: [

    {

      date: '2025-01-15',

      displayDate: '2025年1月15日',

      records: [

        { studentId: 'S2023015', studentName: '吉田拓也', status: '出席', connectedAt: '10:38', departedAt: '12:08' },

        { studentId: 'S2023016', studentName: '山口愛美', status: '出席', connectedAt: '10:35', departedAt: '12:10' },

        { studentId: 'S2023017', studentName: '松本和也', status: '出席', connectedAt: '10:40', departedAt: '12:09' },

        { studentId: 'S2023018', studentName: '井上莉奈', status: '遅刻', connectedAt: '10:55', departedAt: '12:10' },

        { studentId: 'S2023019', studentName: '木村翔太', status: '出席', connectedAt: '10:37', departedAt: '12:11' },

        { studentId: 'S2023020', studentName: '林美優', status: '途中退出', connectedAt: '10:39', departedAt: '11:30' }

      ]

    },

    {

      date: '2025-01-08',

      displayDate: '2025年1月8日',

      records: [

        { studentId: 'S2023015', studentName: '吉田拓也', status: '出席', connectedAt: '10:36', departedAt: '12:09' },

        { studentId: 'S2023016', studentName: '山口愛美', status: '出席', connectedAt: '10:37', departedAt: '12:10' },

        { studentId: 'S2023017', studentName: '松本和也', status: '欠席' },

        { studentId: 'S2023018', studentName: '井上莉奈', status: '出席', connectedAt: '10:40', departedAt: '12:08' },

        { studentId: 'S2023019', studentName: '木村翔太', status: '出席', connectedAt: '10:38', departedAt: '12:11' },

        { studentId: 'S2023020', studentName: '林美優', status: '出席', connectedAt: '10:35', departedAt: '12:10' }

      ]

    }

  ],

  cs301: [

    {

      date: '2025-01-17',

      displayDate: '2025年1月17日',

      records: [

        { studentId: 'S2023025', studentName: '清水健', status: '出席', connectedAt: '12:58', departedAt: '14:48' },

        { studentId: 'S2023026', studentName: '山崎優子', status: '出席', connectedAt: '12:55', departedAt: '14:50' },

        { studentId: 'S2023027', studentName: '森田誠', status: '出席', connectedAt: '13:00', departedAt: '14:49' },

        { studentId: 'S2023028', studentName: '橋本彩', status: '欠席' },

        { studentId: 'S2023029', studentName: '石川直樹', status: '出席', connectedAt: '12:59', departedAt: '14:51' }

      ]

    }

  ],

  math101: [

    {

      date: '2025-01-14',

      displayDate: '2025年1月14日',

      records: [

        { studentId: 'S2024011', studentName: '前田ひかる', status: '出席', connectedAt: '8:56', departedAt: '10:18' },

        { studentId: 'S2024012', studentName: '藤田光', status: '出席', connectedAt: '8:58', departedAt: '10:20' },

        { studentId: 'S2024013', studentName: '岡田麻衣', status: '遅刻', connectedAt: '9:20', departedAt: '10:19' },

        { studentId: 'S2024014', studentName: '長谷川航', status: '出席', connectedAt: '8:54', departedAt: '10:21' }

      ]

    }

  ],

  math201: [

    {

      date: '2025-01-16',

      displayDate: '2025年1月16日',

      records: [

        { studentId: 'S2023030', studentName: '村上春樹', status: '出席', connectedAt: '10:36', departedAt: '12:09' },

        { studentId: 'S2023031', studentName: '近藤美穂', status: '出席', connectedAt: '10:38', departedAt: '12:10' },

        { studentId: 'S2023032', studentName: '坂本龍馬', status: '欠席' }

      ]

    }

  ]

}
 
export function getCoursesByTeacherId(teacherId: string): Course[] {

  return courses.filter(course => course.teacherId === teacherId)

}
 
export function getCourseById(courseId: string): Course | undefined {

  return courses.find(course => course.id === courseId)

}
 
export function getAvailableDates(courseId: string): DateAttendanceData[] {

  return attendanceRecords[courseId] || []

}
 
export function getAttendanceData(courseId: string, date?: string): AttendanceRecord[] {

  if (!date) {

    return attendanceRecords[courseId]?.flatMap(data => data.records) || []

  }
 
  const courseData = attendanceRecords[courseId]

  if (!courseData) return []
 
  const dateData = courseData.find(d => d.date === date)

  return dateData ? dateData.records : []

}

 