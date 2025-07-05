"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

type BusinessProject = {
  id: string
  user_id: string
  name: string
  created_at?: string
}
type BusinessTask = {
  id: string
  project_id: string
  user_id: string
  task: string
  completed: boolean
  created_at?: string
}

export default function BusinessPage() {
  const [projects, setProjects] = useState<BusinessProject[]>([])
  const [tasks, setTasks] = useState<BusinessTask[]>([])
  const [expanded, setExpanded] = useState<{ [projectId: string]: boolean }>({})
  const [newProject, setNewProject] = useState("")
  const [newTask, setNewTask] = useState<{ [projectId: string]: string }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view business projects.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      const { data: projectData, error: projectError } = await supabase
        .from("business_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
      const { data: taskData, error: taskError } = await supabase
        .from("business_tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
      if (projectError || taskError) {
        setError("Failed to fetch projects or tasks.")
      } else {
        setProjects(projectData || [])
        setTasks(taskData || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const addProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!userId) {
      setError("You must be logged in to add projects.")
      return
    }
    if (newProject.trim()) {
      setLoading(true)
      const { data, error: insertError } = await supabase
        .from("business_projects")
        .insert([
          { user_id: userId, name: newProject.trim() },
        ])
        .select()
      if (insertError) {
        setError(insertError.message || "Failed to add project.")
      } else if (data && data.length > 0) {
        setProjects((prev) => [...prev, data[0]])
        setExpanded((prev) => ({ ...prev, [data[0].id]: true }))
        setNewProject("")
      }
      setLoading(false)
    }
  }

  const addTask = async (projectId: string, e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!userId) {
      setError("You must be logged in to add tasks.")
      return
    }
    const taskText = newTask[projectId]?.trim()
    if (taskText) {
      setLoading(true)
      const { data, error: insertError } = await supabase
        .from("business_tasks")
        .insert([
          { user_id: userId, project_id: projectId, task: taskText, completed: false },
        ])
        .select()
      if (insertError) {
        setError(insertError.message || "Failed to add task.")
      } else if (data && data.length > 0) {
        setTasks((prev) => [...prev, data[0]])
        setNewTask(nt => ({ ...nt, [projectId]: "" }))
      }
      setLoading(false)
    }
  }

  const toggleTask = async (task: BusinessTask) => {
    setError(null)
    setLoading(true)
    const { data, error: updateError } = await supabase
      .from("business_tasks")
      .update({ completed: !task.completed })
      .eq("id", task.id)
      .select()
    if (updateError) {
      setError(updateError.message || "Failed to update task.")
    } else if (data && data.length > 0) {
      setTasks((prev) => prev.map((t) => t.id === task.id ? data[0] : t))
    }
    setLoading(false)
  }

  const deleteTask = async (taskId: string) => {
    setError(null)
    setLoading(true)
    const { error: deleteError } = await supabase
      .from("business_tasks")
      .delete()
      .eq("id", taskId)
    if (deleteError) {
      setError(deleteError.message || "Failed to delete task.")
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    }
    setLoading(false)
  }

  const toggleProjectExpand = (projectId: string) => {
    setExpanded((prev) => ({ ...prev, [projectId]: !prev[projectId] }))
  }

  return (
    <div className="container mx-auto p-4 bg-black min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-400 via-white to-green-600 text-transparent bg-clip-text">Business</h1>
      <Card className="bg-gray-800 border border-gray-700 mb-4 p-4">
        <CardHeader>
          <CardTitle>Business Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addProject} className="flex gap-2 mb-6">
            <Input
              type="text"
              value={newProject}
              onChange={e => setNewProject(e.target.value)}
              placeholder="Add a new project"
              className="bg-gray-700 text-white"
            />
            <Button type="submit">Add Project</Button>
          </form>
          <div className="space-y-4">
            {projects.map(project => (
              <div key={project.id} className="bg-gray-700 rounded p-4">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleProjectExpand(project.id)}>
                  <span className="font-semibold text-lg flex items-center">
                    {expanded[project.id] ? <ChevronDown className="h-5 w-5 mr-1" /> : <ChevronRight className="h-5 w-5 mr-1" />}
                    {project.name}
                  </span>
                  <span className="text-sm text-gray-400">{tasks.filter(t => t.project_id === project.id).length} tasks</span>
                </div>
                {expanded[project.id] && (
                  <div className="mt-3">
                    <form onSubmit={e => addTask(project.id, e)} className="flex gap-2 mb-3">
                      <Input
                        type="text"
                        value={newTask[project.id] || ""}
                        onChange={e => setNewTask(nt => ({ ...nt, [project.id]: e.target.value }))}
                        placeholder="Add a new task"
                        className="bg-gray-800 text-white"
                      />
                      <Button type="submit">Add Task</Button>
                    </form>
                    <ul className="space-y-2">
                      {tasks.filter(t => t.project_id === project.id).map(task => (
                        <li key={task.id} className="flex items-center gap-2 bg-gray-800 rounded p-2">
                          <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task)} />
                          <span className={task.completed ? "line-through text-gray-400" : ""}>{task.task}</span>
                          <Button size="icon" variant="ghost" onClick={() => deleteTask(task.id)}>
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 