-- CreateTable
CREATE TABLE "AttendanceLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshotAt" DATETIME NOT NULL,
    "classroomId" TEXT NOT NULL,
    "courseId" TEXT,
    "teacherId" TEXT,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT,
    "connectionType" TEXT,
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "meta" TEXT
);

-- CreateIndex
CREATE INDEX "AttendanceLog_snapshotAt_classroomId_idx" ON "AttendanceLog"("snapshotAt", "classroomId");

-- CreateIndex
CREATE INDEX "AttendanceLog_studentId_snapshotAt_idx" ON "AttendanceLog"("studentId", "snapshotAt");

-- CreateIndex
CREATE INDEX "AttendanceLog_courseId_snapshotAt_idx" ON "AttendanceLog"("courseId", "snapshotAt");
