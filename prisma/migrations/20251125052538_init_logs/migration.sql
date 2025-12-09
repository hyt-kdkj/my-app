-- CreateTable
CREATE TABLE "Log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receivedAt" DATETIME NOT NULL,
    "ts" DATETIME NOT NULL,
    "host" TEXT,
    "app" TEXT,
    "pid" INTEGER,
    "level" TEXT,
    "facility" TEXT,
    "message" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "meta" TEXT NOT NULL
);
