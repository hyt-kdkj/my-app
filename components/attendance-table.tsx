'use client'

import { Button } from '@/components/ui/button'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'

import { getAttendanceData, getCourseById } from '@/lib/mock-data'

interface AttendanceTableProps {

  teacherId: string

  courseId: string

  onBack: () => void

  onReset: () => void

}

export function AttendanceTable({ teacherId, courseId, onBack, onReset }: AttendanceTableProps) {

  const course = getCourseById(courseId)

  const attendanceData = getAttendanceData(courseId)

  const exportAttendance = () => {

    const csvContent = [

      ['学籍番号', '氏名', '出席状況', '接続時刻'].join(','),

      ...attendanceData.map(record =>

        [record.studentId, record.studentName, record.status, record.connectedAt || '-'].join(',')

      )

    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

    const link = document.createElement('a')

    link.href = URL.createObjectURL(blob)

    link.download = `出欠表_${course?.code}_${new Date().toLocaleDateString('ja-JP')}.csv`

    link.click()

  }

  const presentCount = attendanceData.filter(r => r.status === '出席').length

  const absentCount = attendanceData.filter(r => r.status === '欠席').length

  const lateCount = attendanceData.filter(r => r.status === '遅刻').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} size="sm">

            ← 授業一覧に戻る
          </Button>
          <Button variant="outline" onClick={onReset} size="sm">

            🏠 トップに戻る
          </Button>
        </div>
        <Button onClick={exportAttendance} size="sm">

          ⬇ CSVエクスポート
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{course?.name}</CardTitle>
          <CardDescription className="flex flex-wrap gap-4 mt-2">
            <span>{course?.code}</span>
            <span>•</span>
            <span>{course?.day} {course?.time}</span>
            <span>•</span>
            <span>教師ID: {teacherId}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 text-center">
              <div className="text-4xl mb-2">✓</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{presentCount}</div>
              <div className="text-sm text-green-600 dark:text-green-400">出席</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4 text-center">
              <div className="text-4xl mb-2">⏰</div>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{lateCount}</div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">遅刻</div>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 text-center">
              <div className="text-4xl mb-2">✕</div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">{absentCount}</div>
              <div className="text-sm text-red-600 dark:text-red-400">欠席</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">学籍番号</th>
                  <th className="text-left py-3 px-4 font-semibold">氏名</th>
                  <th className="text-left py-3 px-4 font-semibold">出席状況</th>
                  <th className="text-left py-3 px-4 font-semibold">接続時刻</th>
                </tr>
              </thead>
              <tbody>

                {attendanceData.map((record) => (
                  <tr key={record.studentId} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-mono text-sm">{record.studentId}</td>
                    <td className="py-3 px-4">{record.studentName}</td>
                    <td className="py-3 px-4">
                      <Badge

                        variant={

                          record.status === '出席' ? 'default' :

                            record.status === '遅刻' ? 'outline' :

                              'destructive'

                        }

                        className={

                          record.status === '出席' ? 'bg-green-600 hover:bg-green-700' :

                            record.status === '遅刻' ? 'border-yellow-600 text-yellow-700 dark:text-yellow-400' :

                              ''

                        }
                      >

                        {record.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">

                      {record.connectedAt || '-'}
                    </td>
                  </tr>

                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>

  )

}

