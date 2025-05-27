"use client"

import { useState, useEffect } from "react"
import { Plus, Filter, Search, Calendar, Clock, CheckCircle2, Circle, PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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

export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  useEffect(() => {
    filterTasks()
  }, [tasks, statusFilter, searchQuery])

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query {
              tasks {
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
        }),
      })
      const { data } = await response.json()
      setTasks(data.tasks)
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterTasks = () => {
    let filtered = tasks

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((task) => task.status === statusFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredTasks(filtered)
  }

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
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
              }
            }
          `,
          variables: {
            id: taskId,
            input: { status: newStatus },
          },
        }),
      })
      const { data } = await response.json()
      if (data.updateTask) {
        setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
      }
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return

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
          variables: { id: taskId },
        }),
      })
      const { data } = await response.json()
      if (data.deleteTask) {
        setTasks((prev) => prev.filter((task) => task.id !== taskId))
      }
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prev) => [newTask, ...prev])
    setIsCreateDialogOpen(false)
  }

  const getStatusCounts = () => {
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "TODO").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      done: tasks.filter((t) => t.status === "DONE").length,
    }
  }

  const statusCounts = getStatusCounts()

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Manager</h1>
          <p className="text-gray-600 mt-1">Organize and track your tasks efficiently</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <TaskForm onTaskCreated={handleTaskCreated} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{statusCounts.total}</p>
              </div>
              <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">To Do</p>
                <p className="text-2xl font-bold">{statusCounts.todo}</p>
              </div>
              <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Circle className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">In Progress</p>
                <p className="text-2xl font-bold">{statusCounts.inProgress}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <PlayCircle className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Done</p>
                <p className="text-2xl font-bold">{statusCounts.done}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Tasks</SelectItem>
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-4">
              {tasks.length === 0
                ? "Get started by creating your first task"
                : "Try adjusting your search or filter criteria"}
            </p>
            {tasks.length === 0 && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => {
            const StatusIcon = statusIcons[task.status]
            return (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">
                      <Link href={`/task/${task.id}`} className="hover:text-blue-600 transition-colors">
                        {task.title}
                      </Link>
                    </CardTitle>
                    <Select
                      value={task.status}
                      onValueChange={(value) => updateTaskStatus(task.id, value as TaskStatus)}
                    >
                      <SelectTrigger className="w-auto h-auto p-1 border-none shadow-none">
                        <StatusIcon className="h-5 w-5" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODO">
                          <div className="flex items-center gap-2">
                            <Circle className="h-4 w-4" />
                            To Do
                          </div>
                        </SelectItem>
                        <SelectItem value="IN_PROGRESS">
                          <div className="flex items-center gap-2">
                            <PlayCircle className="h-4 w-4" />
                            In Progress
                          </div>
                        </SelectItem>
                        <SelectItem value="DONE">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Done
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {task.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>}
                  <div className="flex items-center justify-between">
                    <Badge className={statusColors[task.status]}>{task.status.replace("_", " ")}</Badge>
                    {task.dueDate && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xs text-gray-400">
                      Created {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTask(task.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
