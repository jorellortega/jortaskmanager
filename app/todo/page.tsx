"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Trash2, AlertCircle, Calendar, Edit2, Check, Plus } from "lucide-react"
import Link from "next/link"
import { format, addDays, isBefore, parseISO, startOfWeek } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabaseClient"

type Todo = {
  id: string
  user_id: string
  task: string
  due_date: string | null
  completed: boolean
  created_at?: string
}

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState("")
  const [newDueDate, setNewDueDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string>(format(new Date(), "EEEE"))
  const [isDateEnabled, setIsDateEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTaskText, setEditingTaskText] = useState<string>("")

  // Get current user and fetch todos
  useEffect(() => {
    const fetchTodos = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view todos.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      const { data, error: fetchError } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id)
        .order("due_date", { ascending: true })
      if (fetchError) {
        setError("Failed to fetch todos.")
      } else {
        setTodos(data || [])
      }
      setLoading(false)
    }
    fetchTodos()
  }, [])

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!userId) {
      setError("You must be logged in to add todos.")
      return
    }
    if (newTodo.trim()) {
      setLoading(true)
      const { data, error: insertError } = await supabase
        .from("todos")
        .insert([
          {
            user_id: userId,
            task: newTodo.trim(),
            due_date: isDateEnabled ? newDueDate : null,
        completed: false,
          },
        ])
        .select()
      if (insertError) {
        setError(insertError.message || "Failed to add todo. Please try again.")
      } else if (data && data.length > 0) {
        setTodos((prev) => [...prev, data[0]])
      setNewTodo("")
      setNewDueDate(format(new Date(), "yyyy-MM-dd"))
      setIsDateEnabled(false)
    }
      setLoading(false)
    }
  }

  const toggleTodo = async (id: string, completed: boolean) => {
    setError(null)
    setLoading(true)
    const { data, error: updateError } = await supabase
      .from("todos")
      .update({ completed: !completed })
      .eq("id", id)
      .select()
    if (updateError) {
      setError(updateError.message || "Failed to update todo.")
    } else if (data && data.length > 0) {
      setTodos((prev) => prev.map((todo) => (todo.id === id ? data[0] : todo)))
    }
    setLoading(false)
  }

  const updateDueDate = async (id: string, newDate: string) => {
    setError(null)
    setLoading(true)
    const { data, error: updateError } = await supabase
      .from("todos")
      .update({ due_date: newDate })
      .eq("id", id)
      .select()
    if (updateError) {
      setError(updateError.message || "Failed to update due date.")
    } else if (data && data.length > 0) {
      setTodos((prev) => prev.map((todo) => (todo.id === id ? data[0] : todo)))
    setEditingDate(null)
    }
    setLoading(false)
  }

  const deleteTodo = async (id: string) => {
    setError(null)
    setLoading(true)
    const { error: deleteError } = await supabase
      .from("todos")
      .delete()
      .eq("id", id)
    if (deleteError) {
      setError(deleteError.message || "Failed to delete todo.")
    } else {
      setTodos((prev) => prev.filter((todo) => todo.id !== id))
    }
    setLoading(false)
  }

  const getWeekDays = useCallback(() => {
    const today = new Date()
    const start = startOfWeek(today, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), "EEEE"))
  }, [])

  const weekDays = useMemo(() => getWeekDays(), [getWeekDays])

  const getTodosForDay = (day: string) => {
    const date = format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekDays.indexOf(day)), "yyyy-MM-dd")
    return todos.filter((todo) => todo.due_date === date)
  }

  const startEditingTask = (id: string, currentText: string) => {
    setEditingTaskId(id)
    setEditingTaskText(currentText)
  }

  const saveEditingTask = async (id: string) => {
    if (!editingTaskText.trim()) return
    setLoading(true)
    setError(null)
    const { data, error: updateError } = await supabase
      .from("todos")
      .update({ task: editingTaskText.trim() })
      .eq("id", id)
      .select()
    if (updateError) {
      setError(updateError.message || "Failed to update task text.")
    } else if (data && data.length > 0) {
      setTodos((prev) => prev.map((todo) => (todo.id === id ? data[0] : todo)))
      setEditingTaskId(null)
      setEditingTaskText("")
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4">Todo List</h1>
      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="text-white">Add New Todo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addTodo} className="space-y-4">
            <div>
              <Input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Enter a new todo"
                className="bg-[#1A1A1B] border-gray-700 text-white placeholder-gray-400"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableDate"
                checked={isDateEnabled}
                onCheckedChange={(checked) => setIsDateEnabled(checked as boolean)}
              />
              <Label htmlFor="enableDate" className="text-white">
                Enable Due Date
              </Label>
            </div>
            {isDateEnabled && (
              <div className="flex space-x-2">
                <Input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="bg-[#1A1A1B] border-gray-700 text-white flex-grow"
                />
              </div>
            )}
            <Button type="submit" className="w-full text-white">
              Add
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="text-white">Weekly Todo</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={setSelectedDay} defaultValue={selectedDay}>
            <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white mb-4">
              <SelectValue placeholder="Select a day" />
            </SelectTrigger>
            <SelectContent>
              {weekDays.map((day) => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="space-y-2">
            {getTodosForDay(selectedDay).map((todo) => (
              <div key={todo.id} className="flex items-center justify-between bg-[#1A1A1B] p-2 rounded">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => toggleTodo(todo.id, todo.completed)}
                    className="border-gray-400"
                  />
                  <span className={`${todo.completed ? "line-through text-gray-500" : "text-white"} flex items-center`}>
                    {editingTaskId === todo.id ? (
                      <input
                        type="text"
                        value={editingTaskText}
                        autoFocus
                        onChange={e => setEditingTaskText(e.target.value)}
                        onBlur={() => saveEditingTask(todo.id)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            saveEditingTask(todo.id)
                          }
                        }}
                        className="bg-[#1A1A1B] border-gray-700 text-white rounded px-2 py-1 w-full"
                      />
                    ) : (
                      <span
                        onClick={() => startEditingTask(todo.id, todo.task)}
                        className="cursor-pointer hover:underline"
                        title="Click to edit"
                      >
                        {todo.task}
                      </span>
                    )}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTodo(todo.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const input = e.currentTarget.elements.namedItem("newTodo") as HTMLInputElement
                if (input.value.trim()) {
                  const newTodoItem: Todo = {
                    id: Date.now().toString(),
                    user_id: userId || "",
                    task: input.value.trim(),
                    due_date: format(
                      addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekDays.indexOf(selectedDay)),
                      "yyyy-MM-dd",
                    ),
                    completed: false,
                  }
                  setTodos((prevTodos) => [...prevTodos, newTodoItem])
                  input.value = ""
                }
              }}
              className="flex space-x-2"
            >
              <Input
                name="newTodo"
                placeholder="Quick add todo for this day"
                className="bg-[#1A1A1B] border-gray-700 text-white flex-grow"
              />
              <Button type="submit" size="icon" className="text-white">
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-[#141415] border border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Todos</CardTitle>
        </CardHeader>
        <CardContent>
          {todos.length === 0 ? (
            <p className="text-white">No todos yet. Add some above!</p>
          ) : (
            <ul className="space-y-2">
              {todos.map((todo) => (
                <li key={todo.id} className="flex items-center justify-between bg-[#1A1A1B] p-2 rounded">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => toggleTodo(todo.id, todo.completed)}
                      className="border-gray-400"
                    />
                    <span
                      className={`${todo.completed ? "line-through text-gray-500" : "text-white"} flex items-center`}
                    >
                      {editingTaskId === todo.id ? (
                        <input
                          type="text"
                          value={editingTaskText}
                          autoFocus
                          onChange={e => setEditingTaskText(e.target.value)}
                          onBlur={() => saveEditingTask(todo.id)}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              saveEditingTask(todo.id)
                            }
                          }}
                          className="bg-[#1A1A1B] border-gray-700 text-white rounded px-2 py-1 w-full"
                        />
                      ) : (
                        <span
                          onClick={() => startEditingTask(todo.id, todo.task)}
                          className="cursor-pointer hover:underline"
                          title="Click to edit"
                        >
                          {todo.task}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingDate === todo.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          const form = e.target as HTMLFormElement
                          const input = form.elements.namedItem("date") as HTMLInputElement
                          updateDueDate(todo.id, input.value)
                        }}
                      >
                        <Input
                          type="date"
                          name="date"
                          defaultValue={todo.due_date || ""}
                          className="bg-[#1A1A1B] border-gray-700 text-white w-32"
                        />
                        <Button
                          type="submit"
                          size="icon"
                          variant="ghost"
                          className="text-green-400 hover:text-green-300"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </form>
                    ) : (
                      <span className="text-sm text-gray-400 flex items-center">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {todo.due_date}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingDate(todo.id)}
                          className="ml-1 text-blue-400 hover:text-blue-300"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTodo(todo.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

