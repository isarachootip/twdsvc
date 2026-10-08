'use client'

import { useState } from 'react'
import { BookOpen, FileText, CheckCircle2, PlayCircle, AlertTriangle, Clock } from 'lucide-react'
import { CS_TRAINING_KIT } from './cs-training-data'
import QuizTab from './QuizTab'

export default function TrainingKitViewer() {
  const [activeSection, setActiveSection] = useState<'guide' | 'exercises' | 'quiz' | 'demo'>('guide')
  const kit = CS_TRAINING_KIT

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 mb-1.5">
            หลักสูตรรับรองสำหรับพนักงานใหม่
          </div>
          <h2 className="text-xl font-bold text-gray-800">{kit.roleName}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            บัญชีฝึกอบรม: <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded font-mono font-bold">{kit.account}</code> · เวลาเรียน: {kit.duration}
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-xl self-start md:self-auto overflow-x-auto">
          {[
            { id: 'guide', label: '1. คู่มือปฏิบัติงาน', icon: BookOpen },
            { id: 'exercises', label: `2. แบบฝึกหัด (${kit.exercises.length})`, icon: FileText },
            { id: 'quiz', label: `3. แบบทดสอบ (${kit.quiz.length})`, icon: CheckCircle2 },
            { id: 'demo', label: '4. สคริปต์สาธิต', icon: PlayCircle },
          ].map(tab => {
            const Icon = tab.icon
            const active = activeSection === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  active ? 'bg-white text-red-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 1. Guide Tab */}
      {activeSection === 'guide' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 text-base mb-3">วัตถุประสงค์การเรียนรู้</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700">
              {kit.guideSummary.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <CheckCircle2 size={15} className="text-green-600 shrink-0 mt-0.5" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kit.guideSummary.tasks.map((task, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b pb-2.5 border-gray-100">
                  <h4 className="font-bold text-gray-800 text-sm">{task.title}</h4>
                  <code className="text-[11px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-mono">{task.route}</code>
                </div>
                <ul className="space-y-1.5 text-xs text-gray-600">
                  {task.points.map((p, j) => (
                    <li key={j} className="flex items-start gap-1.5">
                      <span className="text-red-500 font-bold">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                {task.warning && (
                  <div className="flex items-start gap-2 bg-amber-50 text-amber-800 p-2.5 rounded-lg text-xs border border-amber-200">
                    <AlertTriangle size={14} className="shrink-0 text-amber-600 mt-0.5" />
                    <span>{task.warning}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Exercises Tab */}
      {activeSection === 'exercises' && (
        <div className="space-y-4">
          {kit.exercises.map(ex => (
            <div key={ex.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold">{ex.id}</span>
                <h4 className="font-bold text-gray-800 text-sm">{ex.title}</h4>
              </div>
              <div className="text-xs bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-700">
                <strong>สถานการณ์:</strong> {ex.scenario}
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-gray-700">ขั้นตอนการปฏิบัติ:</div>
                <ol className="list-decimal list-inside space-y-1 text-gray-600 pl-1">
                  {ex.steps.map((s, idx) => <li key={idx}>{s}</li>)}
                </ol>
              </div>
              <div className="text-xs text-green-800 bg-green-50 p-2.5 rounded-lg border border-green-200 font-medium">
                <strong>ผลลัพธ์ที่ถูกต้อง:</strong> {ex.expectedResult}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Quiz Tab */}
      {activeSection === 'quiz' && <QuizTab quiz={kit.quiz} />}

      {/* 4. Demo Script Tab */}
      {activeSection === 'demo' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Clock size={16} className="text-red-600" />
              <h4 className="font-bold text-gray-800 text-sm">ตารางเวลาสาธิตการสอนสด 20 นาที (Trainer Timeline)</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100/60 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-4 w-32">เวลา</th>
                    <th className="py-2.5 px-4">เนื้อหาที่สอน</th>
                    <th className="py-2.5 px-4">การคลิกบนหน้าจอ</th>
                    <th className="py-2.5 px-4">จุดที่ต้องเน้น</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {kit.demoScript.timeline.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-red-600">{row.time}</td>
                      <td className="py-3 px-4 font-medium text-gray-800">{row.dialogue}</td>
                      <td className="py-3 px-4 text-gray-600">{row.action}</td>
                      <td className="py-3 px-4 text-amber-700">{row.highlight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 space-y-3">
            <h4 className="font-bold text-amber-900 text-sm">ชุดคำถามชวนคิดสำหรับวิทยากร (Q&A Prompts)</h4>
            <div className="space-y-2 text-xs">
              {kit.demoScript.qaPrompts.map((qa, i) => (
                <div key={i} className="bg-white/80 p-3 rounded-lg border border-amber-100 space-y-1">
                  <div className="font-bold text-amber-900">คำถาม {i + 1}: "{qa.q}"</div>
                  <div className="text-green-800 font-medium">✓ คำตอบ: {qa.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
