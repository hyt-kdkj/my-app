'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { Input } from '@/components/ui/input'

import { Label } from '@/components/ui/label'

interface TeacherIdFormProps {

  onSubmit: (teacherId: string) => void

}

export function TeacherIdForm({ onSubmit }: TeacherIdFormProps) {

  const [teacherId, setTeacherId] = useState('')

  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault()

    if (teacherId.trim()) {

      onSubmit(teacherId.trim())

    }

  }

  return (
    <Card className="max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 text-3xl">

          👤
        </div>
        <CardTitle className="text-2xl">教師IDでログイン</CardTitle>
        <CardDescription>教師IDを入力してください</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teacherId">教師ID</Label>
            <Input

              id="teacherId"

              type="text"

              placeholder="例: T12345"

              value={teacherId}

              onChange={(e) => setTeacherId(e.target.value)}

              className="text-lg"

              required

            />
          </div>
          <Button type="submit" className="w-full" size="lg">

            次へ
          </Button>
        </form>
      </CardContent>
    </Card>

  )

}

