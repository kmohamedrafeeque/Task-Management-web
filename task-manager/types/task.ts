export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE"

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface TaskInput {
  title?: string
  description?: string
  status?: TaskStatus
  dueDate?: string
}
