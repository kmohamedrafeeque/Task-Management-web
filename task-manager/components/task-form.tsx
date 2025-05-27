"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Task, TaskStatus } from "@/types/task"

interface TaskFormProps {
  task?: Task
  onTaskCreated: (task: Task) => void
}

export default function TaskForm({ task, onTaskCreated }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || ("TODO" as TaskStatus),
    dueDate: task?.dueDate ? task.dueDate.split("T")[0] : "",
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
      newErrors.dueDate = "Due date cannot be in the past"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const mutation = task ? "updateTask" : "createTask"
      const variables = task ? { id: task.id, input: formData } : { input: formData }

      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation ${task ? "UpdateTask($id: ID!, $input: TaskInput!)" : "CreateTask($input: TaskInput!)"} {
              ${mutation}(${task ? "id: $id, " : ""}input: $input) {
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
          variables,
        }),
      })

      const { data, errors } = await response.json()

      if (errors) {
        console.error("GraphQL errors:", errors)
        return
      }

      onTaskCreated(data[mutation])
    } catch (error) {
      console.error("Error saving task:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter task title"
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter task description"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          className={errors.dueDate ? "border-red-500" : ""}
        />
        {errors.dueDate && <p className="text-sm text-red-500 mt-1">{errors.dueDate}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : task ? "Update Task" : "Create Task"}
        </Button>
      </div>
    </form>
  )
}
