"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Clock, Edit, Trash2, CheckCircle2, Circle, PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import TaskForm from "@/components/task-form"
import type { Task, TaskStatus } from "@/types/task"
import Link from "next/link"

const statusIcons = {
  TODO: Circle,
  IN_PROGRESS: PlayCircle,
  DONE: CheckCircle2,
}

const statusColors = {
  TODO: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  DONE: "bg-green-100 text-green-800",
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchTask(params.id as string)
    }
  }, [params.id])

  const fetchTask = async (id: string) => {
    try {
      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query GetTask($id: ID!) {
              task(id: $id) {
                id
                title
                description
                status
                dueDate
                createdAt
                updatedAt
              }
            }
          `,
          variables: { id },
        }),
      })
      const { data } = await response.json()
      setTask(data.task)
    } catch (error) {
      console.error("Error fetching task:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (newStatus: TaskStatus) => {
    if (!task) return

    try {
      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation UpdateTask($id: ID!, $input: TaskInput!) {
              updateTask(id: $id, input: $input) {
                id
                status
                updatedAt
              }
            }
          `,
          variables: {
            id: task.id,
            input: { status: newStatus },
          },
        }),
      })
      const { data } = await response.json()
      if (data.updateTask) {
        setTask((prev) => (prev ? { ...prev, status: newStatus, updatedAt: data.updateTask.updatedAt } : null))
      }
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const deleteTask = async () => {
    if (!task || !confirm("Are you sure you want to delete this task?")) return

    try {
      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation DeleteTask($id: ID!) {
              deleteTask(id: $id)
            }
          `,
          variables: { id: task.id },
        }),
      })
      const { data } = await response.json()
      if (data.deleteTask) {
        router.push("/")
      }
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    setTask(updatedTask)
    setIsEditDialogOpen(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Task not found</h3>
            <p className="text-gray-600 mb-4">The task you're looking for doesn't exist.</p>
            <Link href="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tasks
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const StatusIcon = statusIcons[task.status]

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
        </Link>
      </div>

      {/* Task Details */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{task.title}</CardTitle>
              <div className="flex items-center gap-4">
                <Badge className={statusColors[task.status]}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {task.status.replace("_", " ")}
                </Badge>
                {task.dueDate && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                  </DialogHeader>
                  <TaskForm task={task} onTaskCreated={handleTaskUpdated} />
                </DialogContent>
              </Dialog>
              <Button variant="destructive" onClick={deleteTask}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {task.description && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Quick Status Actions */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              {task.status !== "TODO" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTaskStatus("TODO")}
                  className="flex items-center gap-2"
                >
                  <Circle className="h-4 w-4" />
                  Mark as To Do
                </Button>
              )}
              {task.status !== "IN_PROGRESS" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTaskStatus("IN_PROGRESS")}
                  className="flex items-center gap-2"
                >
                  <PlayCircle className="h-4 w-4" />
                  Mark as In Progress
                </Button>
              )}
              {task.status !== "DONE" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTaskStatus("DONE")}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Done
                </Button>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Created: {new Date(task.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Updated: {new Date(task.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
