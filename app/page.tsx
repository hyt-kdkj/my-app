'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { Input } from '@/components/ui/input'

import { Label } from '@/components/ui/label'

import { TeacherIdForm } from '@/components/teacher-id-form'

import { CourseSelector } from '@/components/course-selector'

import { AttendanceTable } from '@/components/attendance-table'

export default function AttendanceSystem() {

  const [step, setStep] = useState<'login' | 'selectCourse' | 'viewAttendance'>('login')

  const [teacherId, setTeacherId] = useState<string>('')

  const [selectedCourse, setSelectedCourse] = useState<string>('')

  const handleTeacherLogin = (id: string) => {

    setTeacherId(id)

    setStep('selectCourse')

  }

  const handleCourseSelect = (courseId: string) => {

    setSelectedCourse(courseId)

    setStep('viewAttendance')

  }

  const handleReset = () => {

    setStep('login')

    setTeacherId('')

    setSelectedCourse('')

  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">

            WiFi出欠確認システム
          </h1>
          <p className="text-muted-foreground">学校用出席管理システム</p>
        </div>

        {step === 'login' && <TeacherIdForm onSubmit={handleTeacherLogin} />}

        {step === 'selectCourse' && (
          <CourseSelector

            teacherId={teacherId}

            onCourseSelect={handleCourseSelect}

            onBack={handleReset}

          />

        )}

        {step === 'viewAttendance' && (
          <AttendanceTable

            teacherId={teacherId}

            courseId={selectedCourse}

            onBack={() => setStep('selectCourse')}

            onReset={handleReset}

          />

        )}
      </div>
    </main>

  )

}

