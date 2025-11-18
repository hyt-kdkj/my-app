'use client'

import { Button } from '@/components/ui/button'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { getCoursesByTeacherId } from '@/lib/mock-data'

interface CourseSelectorProps {

  teacherId: string

  onCourseSelect: (courseId: string) => void

  onBack: () => void

}

export function CourseSelector({ teacherId, onCourseSelect, onBack }: CourseSelectorProps) {

  const courses = getCoursesByTeacherId(teacherId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} size="sm">

          ← 戻る
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">

            担当授業一覧
          </h2>
          <p className="text-sm text-muted-foreground">教師ID: {teacherId}</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">この教師IDに担当授業が見つかりませんでした。</p>
          </CardContent>
        </Card>

      ) : (
        <div className="grid gap-4 md:grid-cols-2">

          {courses.map((course) => (
            <Card

              key={course.id}

              className="cursor-pointer hover:shadow-lg transition-shadow"

              onClick={() => onCourseSelect(course.id)}
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 text-xl">

                    📚
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg leading-tight mb-1">

                      {course.name}
                    </CardTitle>
                    <CardDescription className="text-xs">

                      {course.code}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>📅</span>
                    <span>{course.day}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>🕐</span>
                    <span>{course.time}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-xs font-medium">

                      履修者数: {course.studentCount}名
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

          ))}
        </div>

      )}
    </div>

  )

}

