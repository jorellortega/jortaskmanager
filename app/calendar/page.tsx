"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Heart, Users, Gift, Utensils, Briefcase, Target, Dumbbell, Settings, Trash2, Edit, X, ChevronDown } from "lucide-react"
import Link from "next/link"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek,
  isSameDay,
} from "date-fns"
import { supabase } from "@/lib/supabaseClient"

interface CalendarItem {
  id: string;
  type: 'event' | 'appointment' | 'task' | 'cycle' | 'pregnancy' | 'wedding' | 'baby_shower';
  title: string;
  description?: string;
  time?: string;
  date: string;
  category?: string;
  priority?: string;
  completed?: boolean;
  parent_id?: string | null;
  subtasks?: CalendarItem[];
}

interface QuickAddButton {
  id: string;
  name: string;
  category: string;
  icon: string;
  color: string;
  priority: string;
  sort_order: number;
  is_active: boolean;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDateItems, setSelectedDateItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [newTask, setNewTask] = useState({ title: "", description: "", category: "", priority: "medium" })
  const [activeTab, setActiveTab] = useState('items')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [quickAddButtons, setQuickAddButtons] = useState<QuickAddButton[]>([])
  const [showQuickAddSettings, setShowQuickAddSettings] = useState(false)
  const [editingItem, setEditingItem] = useState<CalendarItem | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editForm, setEditForm] = useState({ title: "", description: "", category: "", priority: "medium" })
  const [editSubtasks, setEditSubtasks] = useState<CalendarItem[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")



  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const handleDateClick = async (date: Date) => {
    setSelectedDate(date)
    setNewTask({ title: "", description: "", category: "", priority: "medium" })
    await fetchDateItems(date)
  }

  const fetchDateItems = async (date: Date) => {
    if (!userId) {
      console.log('No userId available');
      return;
    }
    
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      console.log('Fetching items for date:', dateStr, 'userId:', userId);
      const allItems: CalendarItem[] = [];


      // Fetch appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", userId)
        .eq("date", dateStr);

      if (appointmentsError) {
        console.log('Appointments error:', appointmentsError);
      } else {
        console.log('Appointments:', appointments);
      }

      if (appointments) {
        appointments.forEach(appointment => {
          allItems.push({
            id: appointment.id,
            type: 'appointment',
            title: appointment.title,
            description: appointment.description,
            time: appointment.time,
            date: appointment.date,
            category: 'appointment'
          });
        });
      }

      // Fetch todos (only parent tasks)
      const { data: todos } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", userId)
        .eq("due_date", dateStr)
        .is("parent_id", null);

      if (todos) {
        for (const task of todos) {
          // Fetch subtasks for this todo
          const { data: todoSubtasks } = await supabase
            .from("todos")
            .select("*")
            .eq("user_id", userId)
            .eq("parent_id", task.id);

          const subtasks: CalendarItem[] = todoSubtasks?.map(subtask => ({
            id: subtask.id,
            type: 'task',
            title: subtask.task,
            description: subtask.task,
            date: subtask.due_date,
            category: 'todo',
            completed: subtask.completed,
            parent_id: subtask.parent_id
          })) || [];

          allItems.push({
            id: task.id,
            type: 'task',
            title: task.task,
            description: task.task,
            date: task.due_date,
            category: 'todo',
            completed: task.completed,
            subtasks: subtasks
          });
        }
      }

      // Fetch work priorities (only parent tasks)
      const { data: workPriorities } = await supabase
        .from("work_priorities")
        .select("*")
        .eq("user_id", userId)
        .eq("due_date_only", dateStr)
        .is("parent_id", null);

      if (workPriorities) {
        for (const task of workPriorities) {
          // Fetch subtasks for this work priority
          const { data: workSubtasks } = await supabase
            .from("work_priorities")
            .select("*")
            .eq("user_id", userId)
            .eq("parent_id", task.id);

          const subtasks: CalendarItem[] = workSubtasks?.map(subtask => ({
            id: subtask.id,
            type: 'task',
            title: subtask.title,
            description: subtask.title,
            date: subtask.due_date_only,
            category: 'work',
            completed: subtask.completed,
            parent_id: subtask.parent_id
          })) || [];

          allItems.push({
            id: task.id,
            type: 'task',
            title: task.title,
            description: task.title,
            date: task.due_date_only,
            category: 'work',
            completed: task.completed,
            subtasks: subtasks
          });
        }
      }

      // Fetch self-development priorities (only parent tasks)
      const { data: selfDevPriorities } = await supabase
        .from("self_development_priorities")
        .select("*")
        .eq("user_id", userId)
        .eq("due_date_only", dateStr)
        .is("parent_id", null);

      if (selfDevPriorities) {
        for (const task of selfDevPriorities) {
          // Fetch subtasks for this self-dev priority
          const { data: selfDevSubtasks } = await supabase
            .from("self_development_priorities")
            .select("*")
            .eq("user_id", userId)
            .eq("parent_id", task.id);

          const subtasks: CalendarItem[] = selfDevSubtasks?.map(subtask => ({
            id: subtask.id,
            type: 'task',
            title: subtask.title,
            description: subtask.title,
            date: subtask.due_date_only,
            category: 'selfdev',
            completed: subtask.completed,
            parent_id: subtask.parent_id
          })) || [];

          allItems.push({
            id: task.id,
            type: 'task',
            title: task.title,
            description: task.title,
            date: task.due_date_only,
            category: 'selfdev',
            completed: task.completed,
            subtasks: subtasks
          });
        }
      }

      // Fetch leisure activities
      const { data: leisureActivities } = await supabase
        .from("leisure_activities")
        .select("*")
        .eq("user_id", userId)
        .eq("activity_date", dateStr);

      if (leisureActivities) {
        leisureActivities.forEach(activity => {
          allItems.push({
            id: activity.id,
            type: 'task',
            title: activity.activity,
            description: activity.activity,
            date: activity.activity_date,
            category: 'leisure',
            completed: activity.completed
          });
        });
      }

      // Fetch fitness activities (only parent activities)
      const { data: fitnessActivities } = await supabase
        .from("fitness_activities")
        .select("*")
        .eq("user_id", userId)
        .eq("activity_date", dateStr)
        .is("parent_id", null);

      if (fitnessActivities) {
        for (const activity of fitnessActivities) {
          // Fetch subtasks for this fitness activity
          const { data: fitnessSubtasks } = await supabase
            .from("fitness_activities")
            .select("*")
            .eq("user_id", userId)
            .eq("parent_id", activity.id);

          const subtasks: CalendarItem[] = fitnessSubtasks?.map(subtask => ({
            id: subtask.id,
            type: 'task',
            title: subtask.activity,
            description: subtask.activity,
            date: subtask.activity_date,
            category: 'fitness',
            completed: subtask.completed,
            parent_id: subtask.parent_id
          })) || [];

          allItems.push({
            id: activity.id,
            type: 'task',
            title: activity.activity,
            description: activity.activity,
            date: activity.activity_date,
            category: 'fitness',
            completed: activity.completed,
            subtasks: subtasks
          });
        }
      }

      // Fetch cycle entries
      const { data: cycleEntries } = await supabase
        .from("cycle_entries")
        .select("*")
        .eq("user_id", userId)
        .eq("start_date", dateStr);

      if (cycleEntries) {
        cycleEntries.forEach(cycle => {
          allItems.push({
            id: cycle.id,
            type: 'cycle',
            title: 'Period Start',
            description: cycle.notes,
            date: cycle.start_date,
            category: 'cycle'
          });
        });
      }

      // Fetch pregnancy appointments
      const { data: pregnancyAppointments } = await supabase
        .from("pregnancy_appointments")
        .select("*")
        .eq("user_id", userId)
        .eq("date", dateStr);

      if (pregnancyAppointments) {
        pregnancyAppointments.forEach(appointment => {
          allItems.push({
            id: appointment.id,
            type: 'pregnancy',
            title: appointment.title,
            description: appointment.notes,
            time: appointment.time,
            date: appointment.date,
            category: 'pregnancy'
          });
        });
      }

      // Fetch wedding tasks
      const { data: weddingTasks } = await supabase
        .from("wedding_tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("due_date", dateStr);

      if (weddingTasks) {
        weddingTasks.forEach(task => {
          allItems.push({
            id: task.id,
            type: 'wedding',
            title: task.title,
            description: task.notes,
            date: task.due_date,
            category: task.category,
            priority: task.priority,
            completed: task.completed
          });
        });
      }

      // Sort items by time if available, then by title
      allItems.sort((a, b) => {
        if (a.time && b.time) {
          return a.time.localeCompare(b.time);
        }
        return a.title.localeCompare(b.title);
      });

      console.log('Total items found:', allItems.length, allItems);
      setSelectedDateItems(allItems);
    } catch (err) {
      console.error('Error fetching date items:', err);
    }
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view calendar.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      await fetchQuickAddButtons(user.id)
      setLoading(false)
    }
    fetchUser()
  }, [])

  const fetchQuickAddButtons = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("quick_add_buttons")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error('Error fetching quick add buttons:', error);
      } else {
        setQuickAddButtons(data || []);
      }
    } catch (err) {
      console.error('Error fetching quick add buttons:', err);
    }
  }

  const addQuickAddButton = async (buttonData: Partial<QuickAddButton>) => {
    if (!userId) return
    
    const { data, error } = await supabase
      .from("quick_add_buttons")
      .insert({
        user_id: userId,
        name: buttonData.name || "",
        category: buttonData.category || "",
        icon: buttonData.icon || "Plus",
        color: buttonData.color || "blue",
        priority: buttonData.priority || "medium",
        sort_order: quickAddButtons.length + 1
      })
      .select()
      .single()

    if (error) {
      setError(`Failed to add quick add button: ${error.message}`)
    } else {
      await fetchQuickAddButtons(userId)
      // Don't close the dialog automatically - let user close it manually
    }
  }

  const updateQuickAddButton = async (buttonId: string, updates: Partial<QuickAddButton>) => {
    if (!userId) return
    
    const { error } = await supabase
      .from("quick_add_buttons")
      .update(updates)
      .eq("id", buttonId)
      .eq("user_id", userId)

    if (error) {
      setError(`Failed to update quick add button: ${error.message}`)
    } else {
      await fetchQuickAddButtons(userId)
    }
  }

  const deleteQuickAddButton = async (buttonId: string) => {
    if (!userId) return
    
    const { error } = await supabase
      .from("quick_add_buttons")
      .delete()
      .eq("id", buttonId)
      .eq("user_id", userId)

    if (error) {
      setError(`Failed to delete quick add button: ${error.message}`)
    } else {
      await fetchQuickAddButtons(userId)
    }
  }

  const handleEditItem = (item: CalendarItem) => {
    // Set the item data for editing
    setEditForm({
      title: item.title,
      description: item.description || "",
      category: item.category || "",
      priority: item.priority || "medium"
    })
    setEditSubtasks(item.subtasks || [])
    setEditingItem(item)
    setShowEditDialog(true)
  }

  const handleDeleteItem = async (item: CalendarItem) => {
    if (!userId || !selectedDate) return
    
    const confirmDelete = confirm(`Are you sure you want to delete "${item.title}"?`)
    if (!confirmDelete) return

    setLoading(true)
    setError(null)

    try {
      // Determine the table name based on item type/category
      let tableName = ""
      switch (item.category) {
        case 'todo':
          tableName = "todos"
          break
        case 'work':
          tableName = "work_priorities"
          break
        case 'selfdev':
          tableName = "self_development_priorities"
          break
        case 'leisure':
          tableName = "leisure_activities"
          break
        case 'fitness':
          tableName = "fitness_activities"
          break
        case 'appointment':
          tableName = "appointments"
          break
        case 'cycle':
          tableName = "cycle_entries"
          break
        case 'pregnancy':
          tableName = "pregnancy_appointments"
          break
        case 'wedding':
          tableName = "wedding_tasks"
          break
        default:
          throw new Error("Unknown item category")
      }

      const { error } = await supabase
        .from(tableName)
      .delete()
        .eq("id", item.id)
        .eq("user_id", userId)

      if (error) {
        setError(`Failed to delete item: ${error.message}`)
    } else {
        // Refresh the items for the selected date
        await fetchDateItems(selectedDate)
    }
    } catch (err) {
      setError(`Error deleting item: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
    setLoading(false)
    }
  }

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return
    
    const newSubtask: CalendarItem = {
      id: `temp-${Date.now()}`, // Temporary ID for new subtasks
      type: 'task',
      title: newSubtaskTitle.trim(),
      date: format(selectedDate!, "yyyy-MM-dd"),
      category: editForm.category,
      priority: editForm.priority,
      completed: false
    }
    
    setEditSubtasks(prev => [...prev, newSubtask])
    setNewSubtaskTitle("")
  }

  const updateSubtask = (subtaskId: string, updates: Partial<CalendarItem>) => {
    setEditSubtasks(prev => 
      prev.map(subtask => 
        subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
      )
    )
  }

  const deleteSubtask = (subtaskId: string) => {
    setEditSubtasks(prev => prev.filter(subtask => subtask.id !== subtaskId))
  }

  const handleUpdateItem = async () => {
    if (!userId || !selectedDate || !editingItem || !editForm.title) return
    setLoading(true)
    setError(null)
    
    const dateStr = format(selectedDate, "yyyy-MM-dd")
    let tableName = ""
    let updateData = {}
    
    // Determine which table to update based on category
    switch (editForm.category) {
      case "todo":
        tableName = "todos"
        updateData = {
          task: editForm.title,
          due_date: dateStr,
          completed: false
        }
        break
      case "work":
        tableName = "work_priorities"
        updateData = {
          title: editForm.title,
          due_date_only: dateStr,
          completed: false
        }
        break
      case "selfdev":
        tableName = "self_development_priorities"
        updateData = {
          title: editForm.title,
          due_date_only: dateStr,
          completed: false
        }
        break
      case "leisure":
        tableName = "leisure_activities"
        updateData = {
          activity: editForm.title,
          activity_date: dateStr,
          completed: false
        }
        break
      case "fitness":
        tableName = "fitness_activities"
        updateData = {
          activity: editForm.title,
          activity_date: dateStr,
          completed: false
        }
        break
      case "appointment":
        tableName = "appointments"
        updateData = {
          title: editForm.title,
          appointment_date: dateStr,
          completed: false
        }
        break
      case "cycle":
        tableName = "cycle_entries"
        updateData = {
          title: editForm.title,
          date: dateStr,
          completed: false
        }
        break
      case "pregnancy":
        tableName = "pregnancy_appointments"
        updateData = {
          title: editForm.title,
          appointment_date: dateStr,
          completed: false
        }
        break
      case "wedding":
        tableName = "wedding_tasks"
        updateData = {
          title: editForm.title,
          due_date: dateStr,
          completed: false
        }
        break
      case "baby_shower":
        tableName = "wedding_tasks" // Assuming baby shower uses wedding_tasks table
        updateData = {
          title: editForm.title,
          due_date: dateStr,
          completed: false
        }
        break
      default:
        setError("Please select a category.")
        setLoading(false)
        return
    }
    
    try {
      // Update the main item
      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq("id", editingItem.id)
        .eq("user_id", userId)

      if (error) {
        setError(`Failed to update item: ${error.message}`)
        setLoading(false)
        return
      }

      // Handle subtasks - update existing ones and create new ones
      for (const subtask of editSubtasks) {
        if (subtask.id.startsWith('temp-')) {
          // Create new subtask
          const subtaskData = {
            user_id: userId,
            parent_id: editingItem.id,
            ...(editForm.category === 'todo' ? { task: subtask.title, due_date: dateStr, completed: subtask.completed } :
                editForm.category === 'work' ? { title: subtask.title, due_date_only: dateStr, completed: subtask.completed } :
                editForm.category === 'selfdev' ? { title: subtask.title, due_date_only: dateStr, completed: subtask.completed } :
                editForm.category === 'leisure' ? { activity: subtask.title, activity_date: dateStr, completed: subtask.completed } :
                editForm.category === 'fitness' ? { activity: subtask.title, activity_date: dateStr, completed: subtask.completed } :
                editForm.category === 'appointment' ? { title: subtask.title, appointment_date: dateStr, completed: subtask.completed } :
                editForm.category === 'cycle' ? { title: subtask.title, date: dateStr, completed: subtask.completed } :
                editForm.category === 'pregnancy' ? { title: subtask.title, appointment_date: dateStr, completed: subtask.completed } :
                editForm.category === 'wedding' ? { title: subtask.title, due_date: dateStr, completed: subtask.completed } :
                editForm.category === 'baby_shower' ? { title: subtask.title, due_date: dateStr, completed: subtask.completed } : {})
          }
          
          await supabase.from(tableName).insert(subtaskData)
        } else {
          // Update existing subtask
          const subtaskUpdateData = {
            ...(editForm.category === 'todo' ? { task: subtask.title, completed: subtask.completed } :
                editForm.category === 'work' ? { title: subtask.title, completed: subtask.completed } :
                editForm.category === 'selfdev' ? { title: subtask.title, completed: subtask.completed } :
                editForm.category === 'leisure' ? { activity: subtask.title, completed: subtask.completed } :
                editForm.category === 'fitness' ? { activity: subtask.title, completed: subtask.completed } :
                editForm.category === 'appointment' ? { title: subtask.title, completed: subtask.completed } :
                editForm.category === 'cycle' ? { title: subtask.title, completed: subtask.completed } :
                editForm.category === 'pregnancy' ? { title: subtask.title, completed: subtask.completed } :
                editForm.category === 'wedding' ? { title: subtask.title, completed: subtask.completed } :
                editForm.category === 'baby_shower' ? { title: subtask.title, completed: subtask.completed } : {})
          }
          
          await supabase.from(tableName).update(subtaskUpdateData).eq("id", subtask.id)
        }
      }

      // Refresh the items for the selected date
      await fetchDateItems(selectedDate)
      setShowEditDialog(false)
      setEditingItem(null)
      setEditForm({ title: "", description: "", category: "", priority: "medium" })
      setEditSubtasks([])
      setNewSubtaskTitle("")
    } catch (err) {
      setError(`Error updating item: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = async () => {
    if (!userId || !selectedDate || !newTask.title) return
    setLoading(true)
    setError(null)
    
    const isEditing = editingItem !== null
    
    const dateStr = format(selectedDate, "yyyy-MM-dd")
    let tableName = ""
    let insertData = {}
    
    // Determine which table to insert into based on category
    switch (newTask.category) {
      case "todo":
        tableName = "todos"
        insertData = {
          user_id: userId,
          task: newTask.title,
          due_date: dateStr,
          completed: false
        }
        break
      case "work":
        tableName = "work_priorities"
        insertData = {
          user_id: userId,
          title: newTask.title,
          due_date_only: dateStr,
          completed: false
        }
        break
      case "selfdev":
        tableName = "self_development_priorities"
        insertData = {
          user_id: userId,
          title: newTask.title,
          due_date_only: dateStr,
          completed: false
        }
        break
      case "leisure":
        tableName = "leisure_activities"
        insertData = {
          user_id: userId,
          activity: newTask.title,
          activity_date: dateStr,
          completed: false
        }
        break
      case "fitness":
        tableName = "fitness_activities"
        insertData = {
          user_id: userId,
          activity: newTask.title,
          activity_date: dateStr,
          completed: false
        }
        break
      default:
        setError("Please select a category.")
        setLoading(false)
        return
    }
    
    try {
      let result
      if (isEditing) {
        // Update existing item
        const updateData = { ...insertData } as any
        delete updateData.user_id // Don't update user_id
        
        result = await supabase
          .from(tableName)
          .update(updateData)
          .eq("id", editingItem.id)
          .eq("user_id", userId)
      .select()
      } else {
        // Insert new item
        result = await supabase
          .from(tableName)
          .insert([insertData])
          .select()
      }
      
      if (result.error) {
        setError(result.error.message || `Failed to ${isEditing ? 'update' : 'add'} task.`)
      } else {
        // Refresh the items for the selected date
        await fetchDateItems(selectedDate)
        setNewTask({ title: "", description: "", category: "", priority: "medium" })
        setEditingItem(null)
      }
    } catch (err) {
      setError(`Error ${isEditing ? 'updating' : 'adding'} task: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
    setLoading(false)
    }
  }


  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4">Calendar</h1>
      <Card className="bg-[#1A1A1B] border border-gray-700 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex justify-between items-center text-white">
            <Button onClick={prevMonth} variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-white">{format(currentMonth, "MMMM yyyy")}</span>
            <Button onClick={nextMonth} variant="ghost" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center font-bold text-white">
                {day}
              </div>
            ))}
            {monthDays.map((day, index) => {
              return (
                <div
                  key={day.toString()}
                  className={`text-center p-2 rounded cursor-pointer min-h-[48px] flex flex-col items-center justify-start ${
                    isToday(day)
                      ? "bg-blue-600 text-white"
                      : !isSameMonth(day, currentMonth)
                        ? "text-gray-400"
                        : "text-white hover:bg-gray-700"
                  }`}
                  onClick={() => handleDateClick(day)}
                >
                  <span>{format(day, "d")}</span>
                </div>
              )
            })}
          </div>
          {selectedDate && (
            <div className="mt-4">
              <Card className="bg-[#1A1A1B] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    {format(selectedDate, "MMMM d, yyyy")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-[#1A1A1B] border border-gray-500">
                      <TabsTrigger 
                        value="items" 
                        className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:hover:bg-[#232325]"
                      >
                        Items ({selectedDateItems.length})
                      </TabsTrigger>
                      <TabsTrigger 
                        value="add-task" 
                        className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:hover:bg-[#232325]"
                      >
                        Add Task
                      </TabsTrigger>
                      <TabsTrigger 
                        value="quick-add" 
                        className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:hover:bg-[#232325]"
                      >
                        Quick Add
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="items" className="mt-4">
                      {selectedDateItems.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No items scheduled for this date</p>
                          <p className="text-sm">Click "Quick Add" to add something!</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedDateItems.map((item) => (
                            <div key={item.id} className="bg-[#232325] rounded-lg border border-gray-600">
                              <div className="flex items-start justify-between p-3">
                                <div className="flex-1">
                                  <div 
                                    className={`flex items-center justify-between mb-1 ${item.subtasks && item.subtasks.length > 0 ? 'cursor-pointer hover:bg-[#2A2A2B] rounded p-1 -m-1' : ''}`}
                                    onClick={() => {
                                      if (item.subtasks && item.subtasks.length > 0) {
                                        const newExpanded = new Set(expandedItems);
                                        if (newExpanded.has(item.id)) {
                                          newExpanded.delete(item.id);
                                        } else {
                                          newExpanded.add(item.id);
                                        }
                                        setExpandedItems(newExpanded);
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      {item.type === 'event' && <CalendarIcon className="w-4 h-4 text-blue-400" />}
                                      {item.type === 'appointment' && <Clock className="w-4 h-4 text-green-400" />}
                                      {item.type === 'task' && <Plus className="w-4 h-4 text-purple-400" />}
                                      {item.type === 'cycle' && <Heart className="w-4 h-4 text-pink-400" />}
                                      {item.type === 'pregnancy' && <Users className="w-4 h-4 text-yellow-400" />}
                                      {item.type === 'wedding' && <Gift className="w-4 h-4 text-rose-400" />}
                                      <span className="font-semibold text-white">{item.title}</span>
                                      {item.completed && (
                                        <Badge variant="secondary" className="text-xs bg-green-600 text-white">
                                          Completed
                                        </Badge>
                                      )}
                                      {item.subtasks && item.subtasks.length > 0 && (
                                        <span className="text-xs text-gray-400">
                                          ({item.subtasks.length})
                                        </span>
                        )}
                      </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs border-gray-500 text-gray-300">
                                        {item.category}
                                      </Badge>
                                      {item.subtasks && item.subtasks.length > 0 && (
                                        <div className={`transform transition-transform duration-200 ${expandedItems.has(item.id) ? 'rotate-180' : ''}`}>
                                          <ChevronDown className="w-4 h-4 text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-400">
                                    {item.time && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {item.time}
                                      </span>
                                    )}
                                    {item.priority && (
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${
                                          item.priority === 'high' ? 'border-red-500 text-red-300' :
                                          item.priority === 'medium' ? 'border-yellow-500 text-yellow-300' :
                                          'border-gray-500 text-gray-300'
                                        }`}
                                      >
                                        {item.priority}
                                      </Badge>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-sm text-gray-300 mt-1">{item.description}</p>
                                  )}
                                </div>
                                
                                {/* Edit and Delete buttons */}
                                <div className="flex gap-2 ml-3">
                                  <Button
                                    onClick={() => handleEditItem(item)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20"
                                    title="Edit item"
                                  >
                                    <Edit className="h-3 w-3" />
                        </Button>
                                  <Button
                                    onClick={() => handleDeleteItem(item)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-red-900/20"
                                    title="Delete item"
                                  >
                                    <X className="h-3 w-3" />
                        </Button>
                      </div>
                              </div>
                              
                              {/* Subtasks */}
                              {item.subtasks && item.subtasks.length > 0 && expandedItems.has(item.id) && (
                                <div className="px-3 pb-3 border-t border-gray-600">
                                  <div className="mt-2 space-y-2">
                                    <p className="text-xs text-gray-400 font-medium">Subtasks:</p>
                                    {item.subtasks.map((subtask) => (
                                      <div key={subtask.id} className="flex items-center gap-2 bg-[#1A1A1B] p-2 rounded border border-gray-700">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                        <span className="text-sm text-gray-300">{subtask.title}</span>
                                        {subtask.completed && (
                                          <Badge variant="secondary" className="text-xs bg-green-600 text-white ml-auto">
                                            Completed
                                          </Badge>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="add-task" className="mt-4">
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="task-title" className="text-white">Task Title</Label>
                          <Input
                            id="task-title"
                            className="bg-[#1A1A1B] border-gray-500 text-white placeholder:text-gray-400 focus:border-blue-500"
                            placeholder="Enter task title"
                            value={newTask.title}
                            onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="task-category" className="text-white">Category</Label>
                          <Select value={newTask.category} onValueChange={(value) => setNewTask((prev) => ({ ...prev, category: value }))}>
                            <SelectTrigger className="bg-[#1A1A1B] border-gray-500 text-white focus:border-blue-500">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1A1A1B] border-gray-500">
                              <SelectItem value="todo" className="text-white hover:bg-[#232325]">📝 Todo</SelectItem>
                              <SelectItem value="work" className="text-white hover:bg-[#232325]">💼 Work Priority</SelectItem>
                              <SelectItem value="selfdev" className="text-white hover:bg-[#232325]">🎯 Self Development</SelectItem>
                              <SelectItem value="leisure" className="text-white hover:bg-[#232325]">🎮 Leisure Activity</SelectItem>
                              <SelectItem value="fitness" className="text-white hover:bg-[#232325]">💪 Fitness Activity</SelectItem>
                              <SelectItem value="appointment" className="text-white hover:bg-[#232325]">📅 Appointment</SelectItem>
                              <SelectItem value="cycle" className="text-white hover:bg-[#232325]">🔄 Cycle Entry</SelectItem>
                              <SelectItem value="pregnancy" className="text-white hover:bg-[#232325]">🤱 Pregnancy Appointment</SelectItem>
                              <SelectItem value="wedding" className="text-white hover:bg-[#232325]">💒 Wedding Task</SelectItem>
                              <SelectItem value="baby_shower" className="text-white hover:bg-[#232325]">🎉 Baby Shower</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="task-priority" className="text-white">Priority</Label>
                          <Select value={newTask.priority} onValueChange={(value) => setNewTask((prev) => ({ ...prev, priority: value }))}>
                            <SelectTrigger className="bg-[#1A1A1B] border-gray-500 text-white focus:border-blue-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1A1A1B] border-gray-500">
                              <SelectItem value="low" className="text-white hover:bg-[#232325]">🟢 Low</SelectItem>
                              <SelectItem value="medium" className="text-white hover:bg-[#232325]">🟡 Medium</SelectItem>
                              <SelectItem value="high" className="text-white hover:bg-[#232325]">🔴 High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" 
                            onClick={handleAddTask}
                            disabled={!newTask.title || !newTask.category}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {editingItem ? 'Update Task' : 'Add Task'}
                          </Button>
                          {editingItem && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700" 
                              onClick={() => {
                                setEditingItem(null)
                                setNewTask({ title: "", description: "", category: "", priority: "medium" })
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="quick-add" className="mt-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold text-white">Quick Add Tasks</h3>
                          <Button 
                            onClick={() => setShowQuickAddSettings(!showQuickAddSettings)}
                            variant="outline" 
                            size="sm"
                            className="border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Manage
                          </Button>
                        </div>
                        
                        {showQuickAddSettings && (
                          <div className="border border-gray-600 rounded-lg p-4 bg-[#1A1A1B]">
                            <h4 className="text-md font-semibold text-white mb-3">Manage Quick Add Buttons</h4>
                            <div className="space-y-2">
                              {quickAddButtons.map((button) => (
                                <div key={button.id} className="flex items-center justify-between p-2 border border-gray-600 rounded bg-[#0F0F0F]">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{button.icon}</span>
                                    <span className="text-white">{button.name}</span>
                                    <Badge variant="secondary" className="text-xs">{button.category}</Badge>
                  </div>
                  <div className="flex gap-2">
                                    <Button 
                                      onClick={() => deleteQuickAddButton(button.id)}
                                      variant="outline" 
                                      size="sm"
                                      className="h-8 w-8 p-0 border-red-500 text-red-400 hover:bg-red-600 hover:text-white"
                                    >
                                      <Trash2 className="h-3 w-3" />
                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-gray-600">
                              <h5 className="text-sm font-medium text-white mb-3">Add Pre-made Button:</h5>
                              <div className="grid grid-cols-2 gap-2 mb-4">
                                {/* Todo */}
                                <Button 
                                  onClick={() => addQuickAddButton({
                                    name: "Todo",
                                    category: "todo",
                                    icon: "📝",
                                    color: "purple",
                                    priority: "medium"
                                  })}
                                  variant="outline" 
                                  className="h-12 flex flex-col items-center justify-center gap-1 border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700 hover:border-purple-500"
                                >
                                  <span className="text-sm">📝</span>
                                  <span className="text-xs">Todo</span>
                                </Button>

                                {/* Work Priority */}
                                <Button 
                                  onClick={() => addQuickAddButton({
                                    name: "Work Priority",
                                    category: "work",
                                    icon: "💼",
                                    color: "blue",
                                    priority: "medium"
                                  })}
                                  variant="outline" 
                                  className="h-12 flex flex-col items-center justify-center gap-1 border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700 hover:border-blue-500"
                                >
                                  <span className="text-sm">💼</span>
                                  <span className="text-xs">Work Priority</span>
                                </Button>

                                {/* Self Development */}
                                <Button 
                                  onClick={() => addQuickAddButton({
                                    name: "Self Development",
                                    category: "selfdev",
                                    icon: "🎯",
                                    color: "yellow",
                                    priority: "medium"
                                  })}
                                  variant="outline" 
                                  className="h-12 flex flex-col items-center justify-center gap-1 border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700 hover:border-yellow-500"
                                >
                                  <span className="text-sm">🎯</span>
                                  <span className="text-xs">Self Development</span>
                                </Button>

                                {/* Leisure Activity */}
                                <Button 
                                  onClick={() => addQuickAddButton({
                                    name: "Leisure Activity",
                                    category: "leisure",
                                    icon: "🎮",
                                    color: "green",
                                    priority: "low"
                                  })}
                                  variant="outline" 
                                  className="h-12 flex flex-col items-center justify-center gap-1 border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700 hover:border-green-500"
                                >
                                  <span className="text-sm">🎮</span>
                                  <span className="text-xs">Leisure Activity</span>
                                </Button>

                                {/* Fitness Activity */}
                                <Button 
                                  onClick={() => addQuickAddButton({
                                    name: "Fitness Activity",
                                    category: "fitness",
                                    icon: "💪",
                                    color: "purple",
                                    priority: "medium"
                                  })}
                                  variant="outline" 
                                  className="h-12 flex flex-col items-center justify-center gap-1 border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700 hover:border-purple-500"
                                >
                                  <span className="text-sm">💪</span>
                                  <span className="text-xs">Fitness Activity</span>
                                </Button>

                                {/* Appointment */}
                                <Button 
                                  onClick={() => addQuickAddButton({
                                    name: "Appointment",
                                    category: "appointment",
                                    icon: "📅",
                                    color: "green",
                                    priority: "high"
                                  })}
                                  variant="outline" 
                                  className="h-12 flex flex-col items-center justify-center gap-1 border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700 hover:border-green-500"
                                >
                                  <span className="text-sm">📅</span>
                                  <span className="text-xs">Appointment</span>
                                </Button>

                                {/* Cycle Entry */}
                                <Button 
                                  onClick={() => addQuickAddButton({
                                    name: "Cycle Entry",
                                    category: "cycle",
                                    icon: "🔄",
                                    color: "pink",
                                    priority: "medium"
                                  })}
                                  variant="outline" 
                                  className="h-12 flex flex-col items-center justify-center gap-1 border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700 hover:border-pink-500"
                                >
                                  <span className="text-sm">🔄</span>
                                  <span className="text-xs">Cycle Entry</span>
                                </Button>

                                {/* Pregnancy Appointment */}
                                <Button 
                                  onClick={() => addQuickAddButton({
                                    name: "Pregnancy Appointment",
                                    category: "pregnancy",
                                    icon: "🤱",
                                    color: "yellow",
                                    priority: "high"
                                  })}
                                  variant="outline" 
                                  className="h-12 flex flex-col items-center justify-center gap-1 border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700 hover:border-yellow-500"
                                >
                                  <span className="text-sm">🤱</span>
                                  <span className="text-xs">Pregnancy Appointment</span>
                                </Button>

                                {/* Wedding Task */}
                                <Button 
                                  onClick={() => addQuickAddButton({
                                    name: "Wedding Task",
                                    category: "wedding",
                                    icon: "💒",
                                    color: "rose",
                                    priority: "medium"
                                  })}
                                  variant="outline" 
                                  className="h-12 flex flex-col items-center justify-center gap-1 border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700 hover:border-rose-500"
                                >
                                  <span className="text-sm">💒</span>
                                  <span className="text-xs">Wedding Task</span>
                                </Button>

                                {/* Baby Shower */}
                                <Button 
                                  onClick={() => addQuickAddButton({
                                    name: "Baby Shower",
                                    category: "baby_shower",
                                    icon: "🎉",
                                    color: "purple",
                                    priority: "medium"
                                  })}
                                  variant="outline" 
                                  className="h-12 flex flex-col items-center justify-center gap-1 border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700 hover:border-purple-500"
                                >
                                  <span className="text-sm">🎉</span>
                                  <span className="text-xs">Baby Shower</span>
                                </Button>
                              </div>
                              
                              <Button 
                                onClick={() => {
                                  const name = prompt("Button name:");
                                  const category = prompt("Category (todo, work, selfdev, leisure, fitness, appointment, cycle, pregnancy, wedding, baby_shower):");
                                  const icon = prompt("Icon emoji:");
                                  const color = prompt("Color (blue, green, purple, red, yellow):");
                                  
                                  if (name && category && icon && color) {
                                    addQuickAddButton({
                                      name,
                                      category,
                                      icon,
                                      color,
                                      priority: "medium"
                                    });
                                  }
                                }}
                                variant="outline" 
                                className="w-full border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Custom Button
                              </Button>
                            </div>
                </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3">
                          {quickAddButtons.length > 0 ? (
                            quickAddButtons.map((button) => (
                              <Button 
                                key={button.id}
                                onClick={() => { 
                                  setNewTask({ ...newTask, category: button.category, priority: button.priority }); 
                                  setActiveTab('add-task'); 
                                }} 
                                variant="outline" 
                                className={`h-20 flex flex-col items-center justify-center gap-2 border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700 ${
                                  button.color === 'blue' ? 'hover:border-blue-500' :
                                  button.color === 'green' ? 'hover:border-green-500' :
                                  button.color === 'purple' ? 'hover:border-purple-500' :
                                  button.color === 'red' ? 'hover:border-red-500' :
                                  button.color === 'yellow' ? 'hover:border-yellow-500' : ''
                                }`}
                              >
                                <span className="text-lg">{button.icon}</span>
                                <span className="text-sm">{button.name}</span>
                              </Button>
                            ))
                          ) : (
                            // Default buttons when no custom buttons are configured
                            <>
                              <Button 
                                onClick={() => { 
                                  setNewTask({ ...newTask, category: "todo", priority: "medium" }); 
                                  setActiveTab('add-task'); 
                                }} 
                                variant="outline" 
                                className="h-20 flex flex-col items-center justify-center gap-2 border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700 hover:border-blue-500"
                              >
                                <span className="text-lg">📝</span>
                                <span className="text-sm">Todo</span>
                              </Button>
                              <Button 
                                onClick={() => { 
                                  setNewTask({ ...newTask, category: "work", priority: "medium" }); 
                                  setActiveTab('add-task'); 
                                }} 
                                variant="outline" 
                                className="h-20 flex flex-col items-center justify-center gap-2 border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700 hover:border-blue-500"
                              >
                                <span className="text-lg">💼</span>
                                <span className="text-sm">Work Task</span>
                              </Button>
                              <Button 
                                onClick={() => { 
                                  setNewTask({ ...newTask, category: "selfdev", priority: "medium" }); 
                                  setActiveTab('add-task'); 
                                }} 
                                variant="outline" 
                                className="h-20 flex flex-col items-center justify-center gap-2 border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700 hover:border-yellow-500"
                              >
                                <span className="text-lg">🎯</span>
                                <span className="text-sm">Self Dev</span>
                  </Button>
                              <Button 
                                onClick={() => { 
                                  setNewTask({ ...newTask, category: "leisure", priority: "low" }); 
                                  setActiveTab('add-task'); 
                                }} 
                                variant="outline" 
                                className="h-20 flex flex-col items-center justify-center gap-2 border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700 hover:border-green-500"
                              >
                                <span className="text-lg">🎮</span>
                                <span className="text-sm">Leisure</span>
                              </Button>
                              <Button 
                                onClick={() => { 
                                  setNewTask({ ...newTask, category: "fitness", priority: "medium" }); 
                                  setActiveTab('add-task'); 
                                }} 
                                variant="outline" 
                                className="h-20 flex flex-col items-center justify-center gap-2 border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700 hover:border-purple-500"
                              >
                                <span className="text-lg">💪</span>
                                <span className="text-sm">Fitness</span>
                              </Button>
                              <Button 
                                onClick={() => { 
                                  setNewTask({ ...newTask, category: "appointment", priority: "high" }); 
                                  setActiveTab('add-task'); 
                                }} 
                                variant="outline" 
                                className="h-20 flex flex-col items-center justify-center gap-2 border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700 hover:border-green-500"
                              >
                                <span className="text-lg">📅</span>
                                <span className="text-sm">Appointment</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <Button 
                      onClick={() => { 
                        setSelectedDate(null); 
                        setSelectedDateItems([]);
                      }} 
                      variant="outline" 
                      className="w-full border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700"
                    >
                Close
              </Button>
                  </div>
                  
              {error && <div className="bg-red-900 text-red-200 p-2 mt-2 rounded">{error}</div>}
              {loading && <div className="text-blue-300 mt-2">Loading...</div>}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Item Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#1A1A1B] border-gray-600 text-white">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title" className="text-white">Title</Label>
              <Input
                id="edit-title"
                className="bg-[#0F0F0F] border-gray-500 text-white placeholder:text-gray-400 focus:border-blue-500"
                placeholder="Enter item title"
                value={editForm.title}
                onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description" className="text-white">Description</Label>
              <Textarea
                id="edit-description"
                className="bg-[#0F0F0F] border-gray-500 text-white placeholder:text-gray-400 focus:border-blue-500"
                placeholder="Enter description (optional)"
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-category" className="text-white">Category</Label>
              <Select value={editForm.category} onValueChange={(value) => setEditForm((prev) => ({ ...prev, category: value }))}>
                <SelectTrigger className="bg-[#0F0F0F] border-gray-500 text-white focus:border-blue-500">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1B] border-gray-500">
                  <SelectItem value="todo" className="text-white hover:bg-[#232325]">📝 Todo</SelectItem>
                  <SelectItem value="work" className="text-white hover:bg-[#232325]">💼 Work Priority</SelectItem>
                  <SelectItem value="selfdev" className="text-white hover:bg-[#232325]">🎯 Self Development</SelectItem>
                  <SelectItem value="leisure" className="text-white hover:bg-[#232325]">🎮 Leisure Activity</SelectItem>
                  <SelectItem value="fitness" className="text-white hover:bg-[#232325]">💪 Fitness Activity</SelectItem>
                  <SelectItem value="appointment" className="text-white hover:bg-[#232325]">📅 Appointment</SelectItem>
                  <SelectItem value="cycle" className="text-white hover:bg-[#232325]">🔄 Cycle Entry</SelectItem>
                  <SelectItem value="pregnancy" className="text-white hover:bg-[#232325]">🤱 Pregnancy Appointment</SelectItem>
                  <SelectItem value="wedding" className="text-white hover:bg-[#232325]">💒 Wedding Task</SelectItem>
                  <SelectItem value="baby_shower" className="text-white hover:bg-[#232325]">🎉 Baby Shower</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-priority" className="text-white">Priority</Label>
              <Select value={editForm.priority} onValueChange={(value) => setEditForm((prev) => ({ ...prev, priority: value }))}>
                <SelectTrigger className="bg-[#0F0F0F] border-gray-500 text-white focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1B] border-gray-500">
                  <SelectItem value="low" className="text-white hover:bg-[#232325]">🟢 Low</SelectItem>
                  <SelectItem value="medium" className="text-white hover:bg-[#232325]">🟡 Medium</SelectItem>
                  <SelectItem value="high" className="text-white hover:bg-[#232325]">🔴 High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subtasks Section */}
            <div>
              <Label className="text-white">Subtasks</Label>
              <div className="mt-2 space-y-2">
                {/* Add New Subtask */}
                <div className="flex gap-2">
                  <Input
                    className="bg-[#0F0F0F] border-gray-500 text-white placeholder:text-gray-400 focus:border-blue-500"
                    placeholder="Add subtask..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                  />
                  <Button
                    onClick={addSubtask}
                    disabled={!newSubtaskTitle.trim()}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Existing Subtasks */}
                {editSubtasks.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {editSubtasks.map((subtask, index) => (
                      <div key={subtask.id} className="flex items-center gap-2 p-2 bg-[#0F0F0F] rounded border border-gray-600">
                        <input
                          type="checkbox"
                          checked={subtask.completed || false}
                          onChange={(e) => updateSubtask(subtask.id, { completed: e.target.checked })}
                          className="rounded border-gray-500"
                        />
                        <Input
                          className="bg-[#1A1A1B] border-gray-600 text-white focus:border-blue-500"
                          value={subtask.title}
                          onChange={(e) => updateSubtask(subtask.id, { title: e.target.value })}
                        />
                        <Button
                          onClick={() => deleteSubtask(subtask.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-red-900/20"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(false)}
              className="border-gray-500 text-white bg-[#1A1A1B] hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateItem}
              disabled={!editForm.title || !editForm.category || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Updating..." : "Update Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

