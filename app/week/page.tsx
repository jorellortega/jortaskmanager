"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, Search, Calendar, Clock, Dumbbell, Sun, Utensils, DollarSign, Target, Users, Lightbulb, Plane, StickyNote, BookOpen, Heart, Monitor, Trophy } from "lucide-react"
import Link from "next/link"
import { format, parseISO, addDays, startOfWeek } from "date-fns"
import { supabase } from "@/lib/supabaseClient"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

type WeeklyTask = {
  id: string
  user_id: string
  title: string
  category: string
  day_of_week: string
  completed: boolean
  created_at?: string
}

type SearchResult = {
  id: string
  type: string
  title: string
  date?: string
  time?: string
  category?: string
  day_of_week?: string
  completed?: boolean
  icon: React.ReactNode
  color: string
}

const categories = [
  { value: "todo", label: "Todo", color: "text-blue-400", bgColor: "bg-blue-900/20", borderColor: "border-blue-500" },
  { value: "work", label: "Work", color: "text-green-400", bgColor: "bg-green-900/20", borderColor: "border-green-500" },
  { value: "fitness", label: "Fitness", color: "text-purple-400", bgColor: "bg-purple-900/20", borderColor: "border-purple-500" },
  { value: "leisure", label: "Leisure", color: "text-yellow-400", bgColor: "bg-yellow-900/20", borderColor: "border-yellow-500" },
  { value: "appointment", label: "Appointment", color: "text-red-400", bgColor: "bg-red-900/20", borderColor: "border-red-500" },
  { value: "self-development", label: "Self Development", color: "text-orange-400", bgColor: "bg-orange-900/20", borderColor: "border-orange-500" },
  { value: "meal-planning", label: "Meal Planning", color: "text-pink-400", bgColor: "bg-pink-900/20", borderColor: "border-pink-500" },
  { value: "expenses", label: "Expenses", color: "text-emerald-400", bgColor: "bg-emerald-900/20", borderColor: "border-emerald-500" },
]

const daysOfWeek = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
]

export default function WeekPlanningPage() {
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([])
  const [newTask, setNewTask] = useState({ title: "", category: "", day_of_week: "" })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [editDayOfWeek, setEditDayOfWeek] = useState("")
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  useEffect(() => {
    const getUserAndTasks = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view weekly tasks.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      const { data, error: fetchError } = await supabase
        .from("weekly_tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("day_of_week", { ascending: true })
      if (fetchError) {
        setError("Failed to fetch weekly tasks.")
      } else {
        setWeeklyTasks(data || [])
      }
      setLoading(false)
    }
    getUserAndTasks()
  }, [])

  const performSearch = async (query: string) => {
    if (!query.trim() || !userId) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    setShowSearchResults(true)

    try {
      const results: SearchResult[] = []
      const searchTerm = query.toLowerCase()

      // Search weekly tasks
      const { data: weeklyData } = await supabase
        .from("weekly_tasks")
        .select("*")
        .eq("user_id", userId)
        .ilike("title", `%${query}%`)

      if (weeklyData) {
        weeklyData.forEach(task => {
          results.push({
            id: task.id,
            type: "Weekly Task",
            title: task.title,
            category: task.category,
            day_of_week: task.day_of_week,
            completed: task.completed,
            icon: <Calendar className="w-4 h-4" />,
            color: "text-green-400"
          })
        })
      }

      // Search todos
      const { data: todosData } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", userId)
        .ilike("task", `%${query}%`)

      if (todosData) {
        todosData.forEach(todo => {
          results.push({
            id: todo.id,
            type: "Todo",
            title: todo.task,
            date: todo.due_date,
            completed: todo.completed,
            icon: <Check className="w-4 h-4" />,
            color: "text-blue-400"
          })
        })
      }

      // Search appointments
      const { data: appointmentsData } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", userId)
        .ilike("title", `%${query}%`)

      if (appointmentsData) {
        appointmentsData.forEach(appointment => {
          results.push({
            id: appointment.id,
            type: "Appointment",
            title: appointment.title,
            date: appointment.date,
            time: appointment.time,
            completed: appointment.completed,
            icon: <Clock className="w-4 h-4" />,
            color: "text-red-400"
          })
        })
      }

      // Search fitness activities
      const { data: fitnessData } = await supabase
        .from("fitness_activities")
        .select("*")
        .eq("user_id", userId)
        .ilike("activity", `%${query}%`)

      if (fitnessData) {
        fitnessData.forEach(activity => {
          results.push({
            id: activity.id,
            type: "Fitness",
            title: activity.activity,
            date: activity.activity_date,
            completed: activity.completed,
            icon: <Dumbbell className="w-4 h-4" />,
            color: "text-purple-400"
          })
        })
      }

      // Search leisure activities
      const { data: leisureData } = await supabase
        .from("leisure_activities")
        .select("*")
        .eq("user_id", userId)
        .ilike("activity", `%${query}%`)

      if (leisureData) {
        leisureData.forEach(activity => {
          results.push({
            id: activity.id,
            type: "Leisure",
            title: activity.activity,
            date: activity.activity_date,
            completed: activity.completed,
            icon: <Sun className="w-4 h-4" />,
            color: "text-yellow-400"
          })
        })
      }

      // Search notes
      const { data: notesData } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)

      if (notesData) {
        notesData.forEach(note => {
          results.push({
            id: note.id,
            type: "Note",
            title: note.title,
            icon: <StickyNote className="w-4 h-4" />,
            color: "text-yellow-400"
          })
        })
      }

      setSearchResults(results)
    } catch (error) {
      console.error("Search error:", error)
      setError("Failed to perform search.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    
    if (query.trim()) {
      performSearch(query)
    } else {
      setSearchResults([])
      setShowSearchResults(false)
    }
  }

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!userId) {
      setError("You must be logged in to add tasks.")
      return
    }
    if (newTask.title && newTask.category && newTask.day_of_week) {
      setLoading(true)
      const { data, error: insertError } = await supabase
        .from("weekly_tasks")
        .insert([
          {
            user_id: userId,
            title: newTask.title,
            category: newTask.category,
            day_of_week: newTask.day_of_week,
            completed: false,
          },
        ])
        .select()
      if (insertError) {
        setError(insertError.message || "Failed to add task. Please try again.")
      } else if (data && data.length > 0) {
        setWeeklyTasks((prev) => [...prev, data[0]])
        setNewTask({ title: "", category: "", day_of_week: "" })
      }
      setLoading(false)
    }
  }

  const startEdit = (task: WeeklyTask) => {
    setEditingId(task.id)
    setEditTitle(task.title)
    setEditCategory(task.category)
    setEditDayOfWeek(task.day_of_week)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle("")
    setEditCategory("")
    setEditDayOfWeek("")
  }

  const saveEdit = async (id: string) => {
    setError(null)
    setLoading(true)
    const { data, error: updateError } = await supabase
      .from("weekly_tasks")
      .update({ title: editTitle, category: editCategory, day_of_week: editDayOfWeek })
      .eq("id", id)
      .select()
    if (updateError) {
      setError(updateError.message || "Failed to update task.")
    } else if (data && data.length > 0) {
      setWeeklyTasks((prev) => prev.map((task) => (task.id === id ? data[0] : task)))
      cancelEdit()
    }
    setLoading(false)
  }

  const deleteTask = async (id: string) => {
    setError(null)
    setLoading(true)
    const { error: deleteError } = await supabase
      .from("weekly_tasks")
      .delete()
      .eq("id", id)
    if (deleteError) {
      setError(deleteError.message || "Failed to delete task.")
    } else {
      setWeeklyTasks((prev) => prev.filter((task) => task.id !== id))
      if (editingId === id) cancelEdit()
    }
    setLoading(false)
  }

  const toggleTask = async (id: string, completed: boolean) => {
    setError(null)
    setLoading(true)
    const { data, error: updateError } = await supabase
      .from("weekly_tasks")
      .update({ completed: !completed })
      .eq("id", id)
      .select()
    if (updateError) {
      setError(updateError.message || "Failed to update task.")
    } else if (data && data.length > 0) {
      setWeeklyTasks((prev) => prev.map((task) => (task.id === id ? data[0] : task)))
    }
    setLoading(false)
  }

  const getCategoryInfo = (categoryValue: string) => {
    return categories.find(cat => cat.value === categoryValue) || categories[0]
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }
  if (loading && weeklyTasks.length === 0) {
    return <div className="text-white p-4">Loading...</div>
  }

  return (
    <div className="container mx-auto p-4 bg-black min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-6">Weekly Planning</h1>
      
      {/* Search Bar */}
      <Card className="bg-[#141415] border border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Search className="mr-2 h-5 w-5" /> Search All Tasks & Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search todos, appointments, fitness, leisure, notes, weekly tasks..."
              className="bg-[#1A1A1B] border-gray-700 text-white placeholder:text-gray-400 pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          
          {/* Search Results */}
          {showSearchResults && (
            <div className="mt-4">
              {isSearching ? (
                <div className="text-gray-400 text-center py-4">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <div className="text-sm text-gray-400 mb-2">
                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </div>
                  {searchResults.map((result) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className="p-3 bg-[#1A1A1B] border border-gray-700 rounded-lg hover:bg-[#232325] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={result.color}>
                            {result.icon}
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium">{result.title}</div>
                            <div className="text-sm text-gray-400">
                              {result.type}
                              {result.date && ` • ${format(parseISO(result.date), "MMM d, yyyy")}`}
                              {result.time && ` • ${result.time}`}
                              {result.day_of_week && ` • ${result.day_of_week}`}
                              {result.category && ` • ${result.category}`}
                            </div>
                          </div>
                        </div>
                        {result.completed !== undefined && (
                          <div className={`text-xs px-2 py-1 rounded ${result.completed ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'}`}>
                            {result.completed ? 'Completed' : 'Pending'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim() && (
                <div className="text-gray-400 text-center py-4">No results found</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add New Task Form */}
      <Card className="bg-[#141415] border border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Plus className="mr-2 h-5 w-5" /> Add New Weekly Task
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addTask} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="title" className="text-white">Task Title</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="bg-[#1A1A1B] border-gray-700 text-white placeholder:text-gray-400"
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <Label htmlFor="category" className="text-white">Category</Label>
                <Select
                  value={newTask.category}
                  onValueChange={(value) => setNewTask({ ...newTask, category: value })}
                >
                  <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#18181b] text-white">
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value} className="text-white">
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="day" className="text-white">Day of Week</Label>
                <Select
                  value={newTask.day_of_week}
                  onValueChange={(value) => setNewTask({ ...newTask, day_of_week: value })}
                >
                  <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#18181b] text-white">
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day} value={day} className="text-white">
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? "Adding..." : "Add Task"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Weekly Tasks by Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {daysOfWeek.map((day) => {
          const dayTasks = weeklyTasks.filter(task => task.day_of_week === day)
          return (
            <Card key={day} className="bg-[#141415] border border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">{day}</CardTitle>
                <div className="text-sm text-gray-400">{dayTasks.length} tasks</div>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayTasks.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">No tasks planned</p>
                ) : (
                  dayTasks.map((task) => {
                    const categoryInfo = getCategoryInfo(task.category)
                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border ${categoryInfo.borderColor} ${categoryInfo.bgColor}`}
                      >
                        {editingId === task.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="bg-[#232325] text-white text-sm"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Select value={editCategory} onValueChange={setEditCategory}>
                                <SelectTrigger className="bg-[#232325] border-gray-700 text-white text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#18181b] text-white">
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value} className="text-white">
                                      {cat.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select value={editDayOfWeek} onValueChange={setEditDayOfWeek}>
                                <SelectTrigger className="bg-[#232325] border-gray-700 text-white text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#18181b] text-white">
                                  {daysOfWeek.map((d) => (
                                    <SelectItem key={d} value={d} className="text-white">
                                      {d}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" onClick={() => saveEdit(task.id)} className="text-green-500 hover:text-green-700">
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button size="sm" onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
                                <X className="w-3 h-3" />
                              </Button>
                              <Button size="sm" onClick={() => deleteTask(task.id)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-2 flex-1">
                                <Checkbox
                                  checked={task.completed}
                                  onCheckedChange={() => toggleTask(task.id, task.completed)}
                                  className="mt-0.5"
                                />
                                <span className={`text-sm ${task.completed ? "line-through text-gray-500" : "text-white"}`}>
                                  {task.title}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <Button size="sm" onClick={() => startEdit(task)} className="text-blue-400 hover:text-blue-600">
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button size="sm" onClick={() => deleteTask(task.id)} className="text-red-500 hover:text-red-700">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className={`text-xs ${categoryInfo.color} font-medium`}>
                              {getCategoryInfo(task.category).label}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 