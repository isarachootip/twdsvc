'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { QuizQuestion } from './types'

interface QuizTabProps {
  quiz: QuizQuestion[]
}

export default function QuizTab({ quiz }: QuizTabProps) {
  const [showAnswerId, setShowAnswerId] = useState<number | null>(null)
  const [showAllAnswers, setShowAllAnswers] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-xs text-blue-900">
        <span>ทำแบบทดสอบ 12 ข้อ เพื่อประเมินความพร้อมก่อนเริ่มงานจริง (เกณฑ์ผ่าน 10/12)</span>
        <button
          onClick={() => setShowAllAnswers(!showAllAnswers)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          {showAllAnswers ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{showAllAnswers ? 'ซ่อนเฉลยทั้งหมด' : 'แสดงเฉลยทั้งหมด'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quiz.map(q => {
          const isRevealed = showAllAnswers || showAnswerId === q.id
          return (
            <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="font-bold text-gray-800 text-xs flex items-start gap-2">
                  <span className="w-5 h-5 rounded bg-gray-100 text-gray-700 flex items-center justify-center shrink-0 font-mono">{q.id}</span>
                  <span>{q.question}</span>
                </div>
                <ul className="space-y-1 text-xs text-gray-600 pl-7">
                  {q.options.map((opt, idx) => <li key={idx}>• {opt}</li>)}
                </ul>
              </div>

              <div className="pt-2 border-t border-gray-100">
                {isRevealed ? (
                  <div className="bg-green-50 p-2.5 rounded-lg border border-green-200 text-xs text-green-900 space-y-1">
                    <div className="font-bold">✓ คำตอบ: {q.answer}</div>
                    <div className="text-[11px] text-green-700">{q.reason}</div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAnswerId(q.id)}
                    className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 font-semibold"
                  >
                    <Eye size={13} />
                    <span>คลิกเพื่อดูเฉลย</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
