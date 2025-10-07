"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Trash2, AlertCircle, Calendar, Edit2, Check, Plus } from "lucide-react"
import Link from "next/link"
import { format, addDays, startOfWeek, parseISO } from "date-fns"
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
  parent_id?: string | null
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
  const [subtaskInputs, setSubtaskInputs] = useState<{ [parentId: string]: string }>({})
  const [subtasks, setSubtasks] = useState<string[]>([""])
  const [isTimeEnabled, setIsTimeEnabled] = useState(false)
  const [newDueTime, setNewDueTime] = useState("")

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
        .order("created_at", { ascending: false })
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
      // Combine date and time if both enabled
      let dueDateValue = null
      if (isDateEnabled && newDueDate) {
        if (isTimeEnabled && newDueTime) {
          dueDateValue = `${newDueDate}T${newDueTime}`
        } else {
          dueDateValue = newDueDate
        }
      }
      // Insert main todo
      const { data: mainData, error: insertError } = await supabase
        .from("todos")
        .insert([
          {
            user_id: userId,
            task: newTodo.trim(),
            due_date: dueDateValue,
            completed: false,
            parent_id: null,
          },
        ])
        .select()
      if (insertError) {
        setError(insertError.message || "Failed to add todo. Please try again.")
        setLoading(false)
        return
      }
      let newMainTodo = mainData && mainData[0]
      let newTodos = newMainTodo ? [newMainTodo] : []
      // Insert subtasks if any
      if (newMainTodo && subtasks.some((s) => s.trim() !== "")) {
        const subtaskInserts = subtasks
          .filter((s) => s.trim() !== "")
          .map((s) => ({
            user_id: userId,
            task: s.trim(),
            due_date: null,
            completed: false,
            parent_id: newMainTodo.id,
          }))
        if (subtaskInserts.length > 0) {
          const { data: subData, error: subError } = await supabase
            .from("todos")
            .insert(subtaskInserts)
            .select()
          if (subError) {
            setError(subError.message || "Failed to add subtasks. Please try again.")
          } else if (subData && subData.length > 0) {
            newTodos = [...newTodos, ...subData]
          }
        }
      }
      setTodos((prev) => [...newTodos, ...prev])
      setNewTodo("")
      setNewDueDate(format(new Date(), "yyyy-MM-dd"))
      setIsDateEnabled(false)
      setIsTimeEnabled(false)
      setNewDueTime("")
      setSubtasks([""])
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

  // Add subtask
  const addSubtask = async (parentId: string) => {
    setError(null)
    if (!userId) {
      setError("You must be logged in to add subtasks.")
      return
    }
    const subtaskText = subtaskInputs[parentId]?.trim()
    if (subtaskText) {
      setLoading(true)
      const { data, error: insertError } = await supabase
        .from("todos")
        .insert([
          {
            user_id: userId,
            task: subtaskText,
            due_date: null,
            completed: false,
            parent_id: parentId,
          },
        ])
        .select()
      if (insertError) {
        setError(insertError.message || "Failed to add subtask. Please try again.")
      } else if (data && data.length > 0) {
        setTodos((prev) => [data[0], ...prev])
        setSubtaskInputs((prev) => ({ ...prev, [parentId]: "" }))
      }
      setLoading(false)
    }
  }

  // Group todos by parent_id and sort by created_at (newest first)
  const mainTodos = todos
    .filter((todo) => !todo.parent_id)
    .sort((a, b) => {
      const aDate = new Date(a.created_at || 0)
      const bDate = new Date(b.created_at || 0)
      return bDate.getTime() - aDate.getTime()
    })
  const subtasksByParent: { [parentId: string]: Todo[] } = useMemo(() => {
    const map: { [parentId: string]: Todo[] } = {}
    todos.forEach((todo) => {
      if (todo.parent_id) {
        if (!map[todo.parent_id]) map[todo.parent_id] = []
        map[todo.parent_id].push(todo)
      }
    })
    return map
  }, [todos])

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
                placeholder="Task Here"
                className="bg-[#1A1A1B] border-gray-700 text-white placeholder-gray-400"
              />
            </div>
            {/* Dynamic subtasks */}
            {newTodo.trim() && subtasks.map((sub, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  type="text"
                  value={sub}
                  onChange={e => {
                    const newSubs = [...subtasks]
                    newSubs[idx] = e.target.value
                    // If last input and not empty, add another
                    if (idx === subtasks.length - 1 && e.target.value.trim() !== "") {
                      newSubs.push("")
                    }
                    setSubtasks(newSubs)
                  }}
                  placeholder={`Subtask ${idx + 1}`}
                  className="bg-[#1A1A1B] border-gray-700 text-white placeholder-gray-400 w-full"
                />
              </div>
            ))}
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
              <div className="flex space-x-2 items-center">
                <Input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="bg-[#1A1A1B] border-gray-700 text-white flex-grow"
                />
                <Checkbox
                  id="enableTime"
                  checked={isTimeEnabled}
                  onCheckedChange={(checked) => setIsTimeEnabled(checked as boolean)}
                />
                <Label htmlFor="enableTime" className="text-white">
                  Enable Time
                </Label>
              </div>
            )}
            {isDateEnabled && isTimeEnabled && (
              <div className="flex space-x-2">
                <Select
                  value={newDueTime}
                  onValueChange={setNewDueTime}
                >
                  <SelectTrigger id="due-time" className="bg-[#1A1A1B] border-gray-700 text-white w-full rounded px-3 py-2">
                    <SelectValue placeholder="Select a time (optional)" className="!text-white !placeholder:text-gray-400" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#18181b] dark:text-white bg-[#18181b] text-white">
                    {Array.from({ length: 24 * 2 }, (_, i) => {
                      const hour24 = Math.floor(i / 2);
                      const min = i % 2 === 0 ? '00' : '30';
                      const hour12 = ((hour24 + 11) % 12) + 1;
                      const ampm = hour24 < 12 ? 'AM' : 'PM';
                      const display = `${hour12.toString().padStart(2, '0')}:${min} ${ampm}`;
                      const value = `${hour24.toString().padStart(2, '0')}:${min}`;
                      return (
                        <SelectItem key={value} value={value} className="dark:bg-[#18181b] dark:text-white bg-[#18181b] text-white">
                          {display}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
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
                    parent_id: null,
                  }
                  setTodos((prevTodos) => [newTodoItem, ...prevTodos])
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
            <div className="space-y-4">
              {mainTodos.map((todo) => (
                <Card key={todo.id} className="bg-[#18181A] border border-gray-700">
                  <CardContent className={`p-4${todo.completed ? ' opacity-25' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={todo.completed} onCheckedChange={() => toggleTodo(todo.id, todo.completed)} />
                        <span className={
                          (todo.completed ? "line-through text-gray-400" : "text-white") +
                          " text-2xl font-bold"
                        }>
                          {todo.task}
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
                            {todo.due_date ? (
                              (() => {
                                const d = parseISO(todo.due_date)
                                const dateStr = format(d, "MMMM d")
                                const yearStr = format(d, "yyyy")
                                // Only show time if due_time is present (if you have it)
                                return <>
                                  {dateStr}
                                  <span className="text-gray-500">, {yearStr}</span>
                                </>
                              })()
                            ) : ""}
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
                    </div>
                    {/* Subtasks */}
                    {subtasksByParent[todo.id] && subtasksByParent[todo.id].length > 0 && (
                      <div className="ml-8 mt-2 space-y-2">
                        {subtasksByParent[todo.id].map((subtask) => (
                          <div key={subtask.id} className="flex items-center gap-2 bg-[#1A1A1B] border border-gray-700 rounded px-2 py-1 text-base">
                            <Checkbox checked={subtask.completed} onCheckedChange={() => toggleTodo(subtask.id, subtask.completed)} />
                            <span className={subtask.completed ? "line-through text-gray-400" : "text-white"}>{subtask.task}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteTodo(subtask.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Add Subtask */}
                    <div className="ml-8 mt-2 flex items-center gap-2">
                      <Input
                        type="text"
                        value={subtaskInputs[todo.id] || ""}
                        onChange={(e) => setSubtaskInputs((prev) => ({ ...prev, [todo.id]: e.target.value }))}
                        placeholder="Add subtask"
                        className="w-48 bg-[#1A1A1B] border-gray-700 text-white"
                      />
                      <Button size="sm" onClick={() => addSubtask(todo.id)} disabled={loading || !(subtaskInputs[todo.id] && subtaskInputs[todo.id].trim())}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

