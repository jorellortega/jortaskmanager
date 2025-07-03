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

type Todo = {
  id: number
  text: string
  completed: boolean
  dueDate: string | ""
  isOverdue: boolean
}

const mockTodos: Todo[] = [
  {
    id: 1,
    text: "Complete project proposal",
    completed: false,
    dueDate: format(addDays(new Date(), 2), "yyyy-MM-dd"),
    isOverdue: false,
  },
  {
    id: 2,
    text: "Review team presentations",
    completed: false,
    dueDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    isOverdue: false,
  },
  {
    id: 3,
    text: "Update client documentation",
    completed: false,
    dueDate: format(addDays(new Date(), 3), "yyyy-MM-dd"),
    isOverdue: false,
  },
  {
    id: 4,
    text: "Prepare for quarterly meeting",
    completed: false,
    dueDate: format(addDays(new Date(), 5), "yyyy-MM-dd"),
    isOverdue: false,
  },
  {
    id: 5,
    text: "Finalize budget report",
    completed: false,
    dueDate: format(addDays(new Date(), -1), "yyyy-MM-dd"),
    isOverdue: true,
  },
]

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>(mockTodos)
  const [newTodo, setNewTodo] = useState("")
  const [newDueDate, setNewDueDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [editingDate, setEditingDate] = useState<number | null>(null)
  const [selectedDay, setSelectedDay] = useState<string>(format(new Date(), "EEEE"))
  const [isDateEnabled, setIsDateEnabled] = useState(false)

  const updateOverdueStatus = useCallback((todos: Todo[]) => {
    const today = new Date()
    return todos.map((todo) => ({
      ...todo,
      isOverdue: todo.dueDate && isBefore(parseISO(todo.dueDate), today) && !todo.completed,
    }))
  }, [])

  useEffect(() => {
    const storedTodos = localStorage.getItem("todos")
    if (storedTodos) {
      setTodos(JSON.parse(storedTodos))
    }
  }, [])

  const updatedTodos = useMemo(() => updateOverdueStatus(todos), [todos, updateOverdueStatus])

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(updatedTodos))
  }, [updatedTodos])

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTodo.trim()) {
      const newTodoItem: Todo = {
        id: Date.now(),
        text: newTodo.trim(),
        completed: false,
        dueDate: isDateEnabled ? newDueDate : "",
        isOverdue: isDateEnabled ? isBefore(parseISO(newDueDate), new Date()) : false,
      }
      setTodos((prevTodos) => updateOverdueStatus([...prevTodos, newTodoItem]))
      setNewTodo("")
      setNewDueDate(format(new Date(), "yyyy-MM-dd"))
      setIsDateEnabled(false)
    }
  }

  const toggleTodo = (id: number) => {
    setTodos((prevTodos) =>
      updateOverdueStatus(prevTodos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))),
    )
  }

  const updateDueDate = (id: number, newDate: string) => {
    setTodos((prevTodos) =>
      updateOverdueStatus(prevTodos.map((todo) => (todo.id === id ? { ...todo, dueDate: newDate } : todo))),
    )
    setEditingDate(null)
  }

  const getWeekDays = useCallback(() => {
    const today = new Date()
    const start = startOfWeek(today, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), "EEEE"))
  }, [])

  const weekDays = useMemo(() => getWeekDays(), [getWeekDays])

  const getTodosForDay = (day: string) => {
    const date = format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekDays.indexOf(day)), "yyyy-MM-dd")
    return todos.filter((todo) => todo.dueDate === date)
  }

  const deleteTodo = (id: number) => {
    setTodos((prevTodos) => updateOverdueStatus(prevTodos.filter((todo) => todo.id !== id)))
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
                    onCheckedChange={() => toggleTodo(todo.id)}
                    className="border-gray-400"
                  />
                  <span className={`${todo.completed ? "line-through text-gray-500" : "text-white"} flex items-center`}>
                    {todo.isOverdue && <AlertCircle className="h-4 w-4 text-red-500 mr-2" />}
                    {todo.text}
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
                    id: Date.now(),
                    text: input.value.trim(),
                    completed: false,
                    dueDate: format(
                      addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekDays.indexOf(selectedDay)),
                      "yyyy-MM-dd",
                    ),
                    isOverdue: false,
                  }
                  setTodos((prevTodos) => updateOverdueStatus([...prevTodos, newTodoItem]))
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
                      onCheckedChange={() => toggleTodo(todo.id)}
                      className="border-gray-400"
                    />
                    <span
                      className={`${todo.completed ? "line-through text-gray-500" : "text-white"} flex items-center`}
                    >
                      {todo.isOverdue && <AlertCircle className="h-4 w-4 text-red-500 mr-2" />}
                      {todo.text}
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
                          defaultValue={todo.dueDate}
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
                        {todo.dueDate}
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

