datasource db {
  provider = "sqlite"
}

generator client {
  provider = "prisma-client-js"
}

// 教員
model Teacher {
  id       Int      @id @default(autoincrement())
  code     String   @unique         // 教員ID（ログインに使う）
  name     String
  password String                  // 最初は平文でもいいが、あとでハッシュに

  courses  Course[]
}

// 授業（科目）
model Course {
  id        Int        @id @default(autoincrement())
  code      String     @unique       // "NW101" など
  name      String
  teacherId Int

  teacher   Teacher    @relation(fields: [teacherId], references: [id])
  members   CourseMember[]
  sessions  Session[]
}

// 受講登録（どの学生がどの授業を取っているか）
model CourseMember {
  id        Int      @id @default(autoincrement())
  courseId  Int
  studentId Int

  course    Course   @relation(fields: [courseId], references: [id])
  student   Student  @relation(fields: [studentId], references: [id])

  @@unique([courseId, studentId])
}

// 学生
model Student {
  id            Int           @id @default(autoincrement())
  studentNumber String        @unique   // 学籍番号
  name          String

  members       CourseMember[]
  attendances   Attendance[]
  devices       Device[]      // 学生の端末識別（MACアドレス等）
}

// 学生デバイス (MACアドレスなど)
model Device {
  id        Int      @id @default(autoincrement())
  studentId Int
  mac       String   @unique

  student   Student  @relation(fields: [studentId], references: [id])
}

// 授業の1コマ（2025-11-25 3限とか）
model Session {
  id        Int      @id @default(autoincrement())
  courseId  Int
  date      DateTime          // 日付＋開始時刻でもOK
  startTime DateTime          // 実際の開始時刻
  endTime   DateTime          // 終了

  course    Course   @relation(fields: [courseId], references: [id])
  attendance Attendance[]
}

// 出席記録：学生 × セッション
model Attendance {
  id        Int      @id @default(autoincrement())
  sessionId Int
  studentId Int
  status    String   // "present" / "late" / "absent" など
  firstSeen DateTime?  // 最初にログで確認された時刻
  lastSeen  DateTime?  // 最後に確認された時刻

  session   Session  @relation(fields: [sessionId], references: [id])
  student   Student  @relation(fields: [studentId], references: [id])

  @@unique([sessionId, studentId])
}

// 生ログ（整形後のsyslog）
model RawLog {
  id         Int      @id @default(autoincrement())
  receivedAt DateTime
  ts         DateTime
  host       String?
  app        String?
  level      String?
  facility   String?
  message    String
  // ネットワーク系
  srcIp      String?
  srcMac     String?
  // その他・元JSONも保存しておきたいなら
  raw        String   // 元JSONをそのまま文字列で保存
}
