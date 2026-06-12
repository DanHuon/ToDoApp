export interface Task {
  id: string
  title: string
  description: string | null
  completed: boolean
  dueDate?: string | null
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}
