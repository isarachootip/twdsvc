export interface ExerciseItem {
  id: number
  title: string
  scenario: string
  steps: string[]
  expectedResult: string
}

export interface QuizQuestion {
  id: number
  question: string
  options: string[]
  answer: string
  reason: string
}

export interface DemoStep {
  time: string
  dialogue: string
  action: string
  highlight: string
}

export interface RoleTrainingKit {
  role: string
  roleName: string
  account: string
  duration: string
  guideSummary: {
    objectives: string[]
    tasks: { title: string; route: string; points: string[]; warning?: string }[]
    statusTable: { code: string; name: string; meaning: string; next: string }[]
  }
  exercises: ExerciseItem[]
  quiz: QuizQuestion[]
  demoScript: {
    timeline: DemoStep[]
    qaPrompts: { q: string; a: string }[]
  }
}
