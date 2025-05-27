import { type NextRequest, NextResponse } from "next/server"
import type { Task, TaskStatus, TaskInput } from "@/types/task"

// In-memory storage (simulating MongoDB)
const tasks: Task[] = [
  {
    id: "1",
    title: "Setup project repository",
    description: "Initialize the Git repository and setup the basic project structure",
    status: "DONE",
    dueDate: "2024-01-15",
    createdAt: "2024-01-10T10:00:00Z",
    updatedAt: "2024-01-12T14:30:00Z",
  },
  {
    id: "2",
    title: "Design database schema",
    description: "Create the database schema for the task management system",
    status: "IN_PROGRESS",
    dueDate: "2024-01-20",
    createdAt: "2024-01-12T09:00:00Z",
    updatedAt: "2024-01-12T09:00:00Z",
  },
  {
    id: "3",
    title: "Implement user authentication",
    description: "Add user registration, login, and session management",
    status: "TODO",
    dueDate: "2024-01-25",
    createdAt: "2024-01-12T11:00:00Z",
    updatedAt: "2024-01-12T11:00:00Z",
  },
  {
    id: "4",
    title: "Create task CRUD operations",
    description: "Implement create, read, update, and delete operations for tasks",
    status: "TODO",
    createdAt: "2024-01-12T12:00:00Z",
    updatedAt: "2024-01-12T12:00:00Z",
  },
]

let nextId = 5

// GraphQL resolvers
const resolvers = {
  Query: {
    tasks: () => tasks,
    task: (_: any, { id }: { id: string }) => tasks.find((task) => task.id === id),
    tasksByStatus: (_: any, { status }: { status: TaskStatus }) => tasks.filter((task) => task.status === status),
  },
  Mutation: {
    createTask: (_: any, { input }: { input: TaskInput }) => {
      const now = new Date().toISOString()
      const newTask: Task = {
        id: String(nextId++),
        title: input.title || "",
        description: input.description,
        status: input.status || "TODO",
        dueDate: input.dueDate,
        createdAt: now,
        updatedAt: now,
      }
      tasks.unshift(newTask)
      return newTask
    },
    updateTask: (_: any, { id, input }: { id: string; input: TaskInput }) => {
      const taskIndex = tasks.findIndex((task) => task.id === id)
      if (taskIndex === -1) return null

      const updatedTask = {
        ...tasks[taskIndex],
        ...input,
        updatedAt: new Date().toISOString(),
      }
      tasks[taskIndex] = updatedTask
      return updatedTask
    },
    deleteTask: (_: any, { id }: { id: string }) => {
      const taskIndex = tasks.findIndex((task) => task.id === id)
      if (taskIndex === -1) return false

      tasks.splice(taskIndex, 1)
      return true
    },
  },
}

// Simple GraphQL query parser and executor
function executeGraphQL(query: string, variables: any = {}) {
  try {
    // Parse query type
    const isQuery = query.includes("query")
    const isMutation = query.includes("mutation")

    if (query.includes("tasks") && !query.includes("tasksByStatus") && !query.includes("task(")) {
      return { data: { tasks: resolvers.Query.tasks() } }
    }

    if (query.includes("task(")) {
      const id = variables.id
      return { data: { task: resolvers.Query.task(null, { id }) } }
    }

    if (query.includes("tasksByStatus")) {
      const status = variables.status
      return { data: { tasksByStatus: resolvers.Query.tasksByStatus(null, { status }) } }
    }

    if (query.includes("createTask")) {
      const input = variables.input
      return { data: { createTask: resolvers.Mutation.createTask(null, { input }) } }
    }

    if (query.includes("updateTask")) {
      const { id, input } = variables
      return { data: { updateTask: resolvers.Mutation.updateTask(null, { id, input }) } }
    }

    if (query.includes("deleteTask")) {
      const id = variables.id
      return { data: { deleteTask: resolvers.Mutation.deleteTask(null, { id }) } }
    }

    return { errors: [{ message: "Unknown query" }] }
  } catch (error) {
    return { errors: [{ message: "Query execution failed" }] }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, variables } = await request.json()
    const result = executeGraphQL(query, variables)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ errors: [{ message: "Invalid request" }] }, { status: 400 })
  }
}
