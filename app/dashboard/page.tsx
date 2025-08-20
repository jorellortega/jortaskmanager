"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  ArrowLeft,
  ArrowRight,
  Sun,
  Dumbbell,
  Cake,
  Repeat,
  CheckSquare,
  Target,
  Users,
  DollarSign,
  Lightbulb,
  Plane,
  ClockIcon,
  StickyNote,
  BookOpen,
  Utensils,
  Home,
  UserIcon,
  Settings,
  LogOut,
  Briefcase,
  Rss,
  Trophy,
  Edit2,
  Trash2,
} from "lucide-react"
import { format, addDays, startOfWeek, parseISO, differenceInDays, subDays } from "date-fns"
import Link from "next/link"
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

type Todo = {
  id: string
  user_id: string
  task: string
  due_date: string | null
  completed: boolean
  parent_id?: string | null
}

type Appointment = {
  id: string
  user_id: string
  title: string
  date: string
  time: string
  completed: boolean
}

type LeisureActivity = {
  id: string
  user_id: string
  activity: string
  activity_date: string
  completed: boolean
}

type FitnessActivity = {
  id: string
  user_id: string
  activity: string
  activity_date: string
  completed: boolean
}

type WorkPriority = {
  id: string;
  user_id: string;
  title: string;
  due_date_only?: string | null;
  due_datetime?: string;
  created_at?: string;
  completed: boolean;
};

type SelfDevPriority = {
  id: string;
  user_id: string;
  title: string;
  due_date_only?: string | null;
  due_datetime?: string;
  created_at?: string;
  completed: boolean;
};

const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export default function WeeklyTaskManager() {
  // Store the actual 'today' date at mount
  const [today, setToday] = useState<Date>(() => new Date());
  const [currentDay, setCurrentDay] = useState<string>("")
  const [days, setDays] = useState<string[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [leisureActivities, setLeisureActivities] = useState<LeisureActivity[]>([])
  const [fitnessActivities, setFitnessActivities] = useState<FitnessActivity[]>([])
  const [workPriorities, setWorkPriorities] = useState<WorkPriority[]>([]);
  const [selfDevPriorities, setSelfDevPriorities] = useState<SelfDevPriority[]>([]);
  const [focusedDayIndex, setFocusedDayIndex] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addingTask, setAddingTask] = useState(false)
  const [newTaskText, setNewTaskText] = useState("")
  const [subtasks, setSubtasks] = useState<string[]>([""])
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set())
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTaskText, setEditingTaskText] = useState<string>("")
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
  const [editingSubtaskText, setEditingSubtaskText] = useState<string>("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'task' | 'subtask'; name: string } | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [activeSubtaskId, setActiveSubtaskId] = useState<string | null>(null)
  const router = useRouter();
  const [focusedDate, setFocusedDate] = useState<string>("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view dashboard data.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      // Fetch todos
      const { data: todosData, error: todosError } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id)
      // Fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
      // Fetch leisure
      const { data: leisureData, error: leisureError } = await supabase
        .from("leisure_activities")
        .select("*")
        .eq("user_id", user.id)
      // Fetch fitness
      const { data: fitnessData, error: fitnessError } = await supabase
        .from("fitness_activities")
        .select("*")
        .eq("user_id", user.id)
      // Fetch work priorities
      const { data: workData, error: workError } = await supabase
        .from("work_priorities")
        .select("*")
        .eq("user_id", user.id);
      // Fetch self-development priorities
      const { data: selfDevData, error: selfDevError } = await supabase
        .from("self_development_priorities")
        .select("*")
        .eq("user_id", user.id);
      if (todosError || appointmentsError || leisureError || fitnessError) {
        setError("Failed to fetch dashboard data.")
      } else {
        setTodos(todosData || [])
        setAppointments(appointmentsData || [])
        setLeisureActivities(leisureData || [])
        setFitnessActivities(fitnessData || [])
        setWorkPriorities(workData || [])
        setSelfDevPriorities(selfDevData || [])
      }
      setLoading(false)
    }
    fetchAll()
  }, [])

  useEffect(() => {
    const now = new Date();
    setToday(now); // Store 'today' only once
    // JS: 0 (Sun) - 6 (Sat), but our allDays starts with Monday
    let dayIndex = now.getDay();
    // Map Sunday (0) to 6, Monday (1) to 0, etc.
    let idx = dayIndex === 0 ? 6 : dayIndex - 1;
    setCurrentDay(allDays[idx]);
    setDays(allDays); // Always Monday-Sunday
    setFocusedDayIndex(idx); // Focus on today by default
    // Set initial focusedDate to today
    const monday = startOfWeek(now, { weekStartsOn: 1 });
    setFocusedDate(format(addDays(monday, idx), "yyyy-MM-dd"));
  }, []);

  useEffect(() => {
    localStorage.setItem("appointments", JSON.stringify(appointments))
  }, [appointments])

  const addTask = (day: string) => {
    setAddingTask(true)
    setNewTaskText("")
    setSubtasks([""])
  }

  const handleAddTaskConfirm = async () => {
    if (!userId || !focusedDate || !newTaskText.trim()) {
      setAddingTask(false)
      setNewTaskText("")
      setSubtasks([""])
      return
    }
    setLoading(true)
    setError(null)
    // Use focusedDate directly instead of calculating from currentDay
    const dueDate = focusedDate
    
    // Insert main todo
    const { data: mainData, error: insertError } = await supabase
      .from("todos")
      .insert([
        {
          user_id: userId,
          task: newTaskText.trim(),
          due_date: dueDate,
          completed: false,
          parent_id: null,
        },
      ])
      .select()
    
    if (insertError) {
      setError(insertError.message || "Failed to add task.")
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
    
    if (newTodos.length > 0) {
      setTodos((prev) => [...prev, ...newTodos])
    }
    
    setAddingTask(false)
    setNewTaskText("")
    setSubtasks([""])
    setLoading(false)
  }

  const handleAddTaskCancel = () => {
    setAddingTask(false)
    setNewTaskText("")
    setSubtasks([""])
  }

  const toggleTask = async (day: string, taskId: string) => {
    setError(null)
    setLoading(true)
    const todo = todos.find((t) => t.id === taskId)
    if (!todo) return
    const { data, error: updateError } = await supabase
      .from("todos")
      .update({ completed: !todo.completed })
      .eq("id", taskId)
      .select()
    if (updateError) {
      setError(updateError.message || "Failed to update task.")
    } else if (data && data.length > 0) {
      setTodos((prev) => prev.map((t) => (t.id === taskId ? data[0] : t)))
    }
    setLoading(false)
  }

  const navigateDay = (direction: "prev" | "next") => {
    setFocusedDayIndex((prevIndex) => {
      if (direction === "prev") {
        return prevIndex > 0 ? prevIndex - 1 : days.length - 1
      } else {
        return prevIndex < days.length - 1 ? prevIndex + 1 : 0
      }
    })
  }

  const goToToday = useCallback(() => {
    // Use the stored 'today' date to set the focused date and day
    const todayDateStr = format(today, "yyyy-MM-dd");
    const todayDayLabel = format(today, "EEEE");
    
    setFocusedDate(todayDateStr);
    setCurrentDay(todayDayLabel);
    setFocusedDayIndex(allDays.indexOf(todayDayLabel));
  }, [today])

  const goToPreviousDay = useCallback(() => {
    // Calculate how many days back we can go (max 7 days back from today)
    const currentDate = parseISO(focusedDate);
    const todayDate = today;
    const daysDiff = differenceInDays(todayDate, currentDate);
    
    // Only allow going back if we're not already 7 days back
    if (daysDiff < 7) {
      const previousDate = subDays(currentDate, 1);
      const previousDateStr = format(previousDate, "yyyy-MM-dd");
      const previousDayLabel = format(previousDate, "EEEE");
      
      setFocusedDate(previousDateStr);
      setCurrentDay(previousDayLabel);
      setFocusedDayIndex(allDays.indexOf(previousDayLabel));
    }
  }, [focusedDate, today]);

  const goToNextDay = useCallback(() => {
    // Calculate how many days forward we can go (max 7 days forward from today)
    const currentDate = parseISO(focusedDate);
    const todayDate = today;
    const daysDiff = differenceInDays(currentDate, todayDate);
    
    // Only allow going forward if we're not already 7 days forward
    if (daysDiff < 7) {
      const nextDate = addDays(currentDate, 1);
      const nextDateStr = format(nextDate, "yyyy-MM-dd");
      const nextDayLabel = format(nextDate, "EEEE");
      
      setFocusedDate(nextDateStr);
      setCurrentDay(nextDayLabel);
      setFocusedDayIndex(allDays.indexOf(nextDayLabel));
    }
  }, [focusedDate, today]);

  const handleDayClick = (clickedDate: string, clickedDayLabel: string) => {
    setFocusedDate(clickedDate);
    setCurrentDay(clickedDayLabel);
    setFocusedDayIndex(allDays.indexOf(clickedDayLabel));
  };

  // Always map day label to correct date in current week
  function getDateForDay(day: string) {
    // Use the stored 'today' date for all calculations
    const monday = startOfWeek(today, { weekStartsOn: 1 });
    const idx = allDays.indexOf(day);
    return format(addDays(monday, idx), "yyyy-MM-dd");
  }
  // Helper function to get subtodos for a parent todo
  const getSubtodos = (parentId: string) => {
    return todos.filter(todo => todo.parent_id === parentId);
  };

  // Helper function to check if a todo has subtodos
  const hasSubtodos = (todoId: string) => {
    return todos.some(todo => todo.parent_id === todoId);
  };

  // Helper function to toggle expanded state
  const toggleExpanded = (todoId: string) => {
    setExpandedTodos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(todoId)) {
        newSet.delete(todoId);
      } else {
        newSet.add(todoId);
      }
      return newSet;
    });
  };

  // Use focusedDate directly for filtering - only show parent todos (no parent_id)
  const todosForDay = todos.filter((todo) => todo.due_date === focusedDate && !todo.parent_id);
  const workPrioritiesForDay = workPriorities.filter((wp) => {
    // Use due_date_only if present, else due_datetime
    if (wp.due_date_only) {
      return wp.due_date_only === focusedDate;
    } else if (wp.due_datetime) {
      return wp.due_datetime.startsWith(focusedDate);
    }
    return false;
  });

  const selfDevPrioritiesForDay = selfDevPriorities.filter((sd) => {
    if (sd.due_date_only) {
      return sd.due_date_only === focusedDate;
    } else if (sd.due_datetime) {
      return sd.due_datetime.startsWith(focusedDate);
    }
    return false;
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  function isCurrentDay(day: string) {
    // Use the stored 'today' date for comparison
    return day === format(today, "EEEE");
  }

  // Helper to get the next 7 days (excluding today)
  const sidebarDates = Array.from({ length: 7 }, (_, i) => addDays(today, i + 1));

  const handleToggleFitness = async (id: string, completed: boolean) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("fitness_activities")
      .update({ completed: !completed })
      .eq("id", id)
      .select();
    if (error) {
      setError(error.message || "Failed to update fitness activity.");
    } else if (data && data.length > 0) {
      setFitnessActivities((prev) => prev.map((a) => (a.id === id ? data[0] : a)));
    }
    setLoading(false);
  };
  const handleToggleLeisure = async (id: string, completed: boolean) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("leisure_activities")
      .update({ completed: !completed })
      .eq("id", id)
      .select();
    if (error) {
      setError(error.message || "Failed to update leisure activity.");
    } else if (data && data.length > 0) {
      setLeisureActivities((prev) => prev.map((a) => (a.id === id ? data[0] : a)));
    }
    setLoading(false);
  };
  const handleToggleAppointment = async (id: string, completed: boolean) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("appointments")
      .update({ completed: !completed })
      .eq("id", id)
      .select();
    if (error) {
      setError(error.message || "Failed to update appointment.");
    } else if (data && data.length > 0) {
      setAppointments((prev) => prev.map((a) => (a.id === id ? data[0] : a)));
    }
    setLoading(false);
  };
const handleToggleWorkPriority = async (id: string, completed: boolean) => {
  setLoading(true);
  setError(null);
  const { data, error } = await supabase
    .from("work_priorities")
    .update({ completed: !completed })
    .eq("id", id)
    .select();
  if (error) {
    setError(error.message || "Failed to update work priority.");
  } else if (data && data.length > 0) {
    setWorkPriorities((prev) => prev.map((a) => (a.id === id ? data[0] : a)));
  }
  setLoading(false);
};
  const handleToggleSelfDevPriority = async (id: string, completed: boolean) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("self_development_priorities")
      .update({ completed: !completed })
      .eq("id", id)
      .select();
    if (error) {
      setError(error.message || "Failed to update self-development priority.");
    } else if (data && data.length > 0) {
      setSelfDevPriorities((prev) => prev.map((a) => (a.id === id ? data[0] : a)));
    }
    setLoading(false);
  };

  // Edit task functions
  const saveEditingTask = async (id: string) => {
    if (!editingTaskText.trim()) return;
    setLoading(true);
    setError(null);
    const { data, error: updateError } = await supabase
      .from("todos")
      .update({ task: editingTaskText.trim() })
      .eq("id", id)
      .select();
    if (updateError) {
      setError(updateError.message || "Failed to update task text.");
    } else if (data && data.length > 0) {
      setTodos((prev) => prev.map((todo) => (todo.id === id ? data[0] : todo)));
      setEditingTaskId(null);
      setEditingTaskText("");
    }
    setLoading(false);
  };

  const saveEditingSubtask = async (id: string) => {
    if (!editingSubtaskText.trim()) return;
    setLoading(true);
    setError(null);
    const { data, error: updateError } = await supabase
      .from("todos")
      .update({ task: editingSubtaskText.trim() })
      .eq("id", id)
      .select();
    if (updateError) {
      setError(updateError.message || "Failed to update subtask text.");
    } else if (data && data.length > 0) {
      setTodos((prev) => prev.map((todo) => (todo.id === id ? data[0] : todo)));
      setEditingSubtaskId(null);
      setEditingSubtaskText("");
    }
    setLoading(false);
  };

  // Delete task functions
  const confirmDeleteTodo = (id: string, name: string) => {
    setDeleteTarget({ id, type: 'task', name });
    setShowDeleteConfirm(true);
  };

  const deleteTodo = async (id: string) => {
    setError(null);
    setLoading(true);
    // First delete all subtasks
    const { error: deleteSubtasksError } = await supabase
      .from("todos")
      .delete()
      .eq("parent_id", id);
    
    if (deleteSubtasksError) {
      setError(deleteSubtasksError.message || "Failed to delete subtasks.");
      setLoading(false);
      return;
    }
    
    // Then delete the main task
    const { error: deleteError } = await supabase
      .from("todos")
      .delete()
      .eq("id", id);
    
    if (deleteError) {
      setError(deleteError.message || "Failed to delete task.");
    } else {
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    }
    setLoading(false);
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const confirmDeleteSubtask = (id: string, name: string) => {
    setDeleteTarget({ id, type: 'subtask', name });
    setShowDeleteConfirm(true);
  };

  const deleteSubtask = async (id: string) => {
    setError(null);
    setLoading(true);
    const { error: deleteError } = await supabase
      .from("todos")
      .delete()
      .eq("id", id);
    
    if (deleteError) {
      setError(deleteError.message || "Failed to delete subtask.");
    } else {
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    }
    setLoading(false);
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  // Close active states when editing starts
  const startEditingTask = (id: string, currentText: string) => {
    setEditingTaskId(id);
    setEditingTaskText(currentText);
    setActiveTaskId(null);
    setActiveSubtaskId(null);
  };

  const startEditingSubtask = (id: string, currentText: string) => {
    setEditingSubtaskId(id);
    setEditingSubtaskText(currentText);
    setActiveTaskId(null);
    setActiveSubtaskId(null);
  };

  return (
    <div className="container mx-auto p-4 pb-24">
      {/* Display the user's name at the top */}
      {userName && (
        <div className="text-lg font-semibold text-white mb-2">Welcome, {userName}!</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Focused day - always in the first column */}
        <Card
          className={`
            bg-[#141415]
            ${
              appointments.some(
                (apt) => apt.date === focusedDate
              )
                ? "border-4 border-transparent bg-gradient-to-r from-red-500 via-red-400 to-red-300 p-[1px]"
                : "border-4 border-transparent bg-gradient-to-r from-green-500 via-green-400 to-green-300 p-[1px]"
            }
            min-h-[300px]
            md:col-span-2
          `}
        >
          <div className="h-full w-full bg-[#141415] p-4 rounded-lg overflow-y-auto">
            <CardHeader className="p-2 bg-black">
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center">
                  {/* Back arrow - only show if we can go back (not 7 days back from today) */}
                  {(() => {
                    const currentDate = parseISO(focusedDate);
                    const todayDate = today;
                    const daysDiff = differenceInDays(todayDate, currentDate);
                    return daysDiff < 7 ? (
                      <ArrowLeft className="h-5 w-5 mr-2 cursor-pointer hover:text-blue-400" onClick={goToPreviousDay} />
                    ) : null;
                  })()}
                  {currentDay.toUpperCase()}
                  {/* Forward arrow - only show if we can go forward (not 7 days forward from today) */}
                  {(() => {
                    const currentDate = parseISO(focusedDate);
                    const todayDate = today;
                    const daysDiff = differenceInDays(currentDate, todayDate);
                    return daysDiff < 7 ? (
                      <ArrowRight className="h-5 w-5 ml-2 cursor-pointer hover:text-blue-400" onClick={goToNextDay} />
                    ) : null;
                  })()}
                </div>
                {/* Today button - centered and only show if not on today */}
                {!isCurrentDay(currentDay) && (
                  <button 
                    onClick={goToToday}
                    className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-sm rounded border border-green-400 transition-colors font-medium"
                  >
                    Today
                  </button>
                )}
                <div className="flex items-center space-x-4">
                  {appointments.some(
                    (apt) =>
                      format(new Date(apt.date), "yyyy-MM-dd") === focusedDate,
                  ) && <Clock className="h-5 w-5 text-red-500" />}
                  {leisureActivities.some(
                    (activity) => activity.activity_date === focusedDate,
                  ) && <Sun className="h-5 w-5 text-yellow-400" />}
                  {fitnessActivities.some(
                    (activity) => activity.activity_date === focusedDate,
                  ) && <Dumbbell className="h-5 w-5 text-green-400" />}
                  {workPrioritiesForDay.length > 0 && (
                    <Briefcase className="h-5 w-5 text-blue-400" />
                  )}
                 {selfDevPrioritiesForDay.length > 0 && (
                   <Trophy className="h-5 w-5 text-yellow-400" />
                 )}
                </div>
                <span className="text-xs text-gray-300">
                  {focusedDate ? format(parseISO(focusedDate), "MMM d, yyyy") : ""}
                </span>
              </CardTitle>
            </CardHeader>
            {/* Add this to the focused day card content to display leisure activities: */}
            <CardContent className="p-2 space-y-4">
              {addingTask && (
                <div className="space-y-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox disabled checked={false} />
                    <input
                      autoFocus
                      className="flex-grow p-1 rounded bg-[#18181A] border border-gray-700 text-white outline-none"
                      placeholder="Enter new task..."
                      value={newTaskText}
                      onChange={e => setNewTaskText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddTaskConfirm()
                        }
                        if (e.key === "Escape") handleAddTaskCancel()
                      }}
                    />
                  </div>
                  {/* Dynamic subtasks */}
                  {newTaskText.trim() && (
                    <div className="ml-6">
                      <div className="text-xs text-gray-400 mb-2">Subtasks:</div>
                      {subtasks.map((sub, idx) => (
                        <div key={idx} className="flex items-center space-x-2 mb-2">
                          <Checkbox disabled checked={false} />
                          <input
                            type="text"
                            value={sub}
                            onChange={e => {
                              const newSubs = [...subtasks]
                              newSubs[idx] = e.target.value
                              // If last input and not empty, add another
                              if (idx === subtasks.length - 1 && e.target.value.trim() !== "") {
                                newSubs.push("")
                              }
                              // Remove empty subtasks except the last one
                              if (idx !== subtasks.length - 1 && e.target.value.trim() === "") {
                                newSubs.splice(idx, 1)
                              }
                              setSubtasks(newSubs)
                            }}
                            placeholder={`Subtask ${idx + 1}`}
                            className="flex-grow p-1 rounded bg-[#18181A] border border-gray-700 text-white outline-none"
                          />
                        </div>
                      ))}
                      
                      {/* Action buttons */}
                      <div className="flex space-x-2">
                        <Button 
                          onClick={handleAddTaskConfirm}
                          size="sm"
                          className="bg-green-600 hover:bg-green-500"
                        >
                          Add Task
                        </Button>
                        <Button 
                          onClick={handleAddTaskCancel}
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {todosForDay.map((task) => {
                const subtodos = getSubtodos(task.id);
                const hasSubtodosCount = subtodos.length > 0;
                const isExpanded = expandedTodos.has(task.id);
                
                return (
                  <div key={task.id} className="space-y-1">
                    <div 
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[#1a1a1b] transition-colors cursor-pointer"
                      onClick={() => setActiveTaskId(activeTaskId === task.id ? null : task.id)}
                    >
                                              <Checkbox
                          id={`task-${task.id}`}
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(currentDay, task.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      <div className="flex items-center space-x-2 flex-grow">
                        {editingTaskId === task.id ? (
                          <input
                            type="text"
                            value={editingTaskText}
                            autoFocus
                            onChange={e => setEditingTaskText(e.target.value)}
                            onBlur={() => saveEditingTask(task.id)}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                saveEditingTask(task.id)
                              }
                              if (e.key === "Escape") {
                                setEditingTaskId(null)
                                setEditingTaskText("")
                              }
                            }}
                            className="flex-grow p-1 rounded bg-[#18181A] border border-gray-700 text-white outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <label
                            htmlFor={`task-${task.id}`}
                            className={`${task.completed ? "line-through text-gray-400 opacity-45" : "text-white"} cursor-pointer hover:underline`}
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingTask(task.id, task.task);
                            }}
                            title="Click to edit"
                          >
                            {task.task}
                          </label>
                        )}
                        {hasSubtodosCount && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(task.id);
                            }}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                            title={isExpanded ? "Hide subtasks" : "Show subtasks"}
                          >
                            {subtodos.length} subtask{subtodos.length !== 1 ? 's' : ''}
                          </button>
                        )}
                      </div>
                      
                      {/* Action buttons - only show when active */}
                      {activeTaskId === task.id && (
                        <div className="flex items-center space-x-1 animate-in slide-in-from-right-2 duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingTask(task.id, task.task);
                            }}
                            className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                            title="Edit task"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteTodo(task.id, task.task);
                            }}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            title="Delete task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Subtodos */}
                    {isExpanded && hasSubtodosCount && (
                      <div className="ml-6 space-y-1">
                        {subtodos.map((subtask) => (
                          <div 
                            key={subtask.id} 
                            className="flex items-center space-x-2 p-1 rounded-lg hover:bg-[#1a1a1b] transition-colors cursor-pointer ml-6"
                            onClick={() => setActiveSubtaskId(activeSubtaskId === subtask.id ? null : subtask.id)}
                          >
                            <Checkbox
                              id={`subtask-${subtask.id}`}
                              checked={subtask.completed}
                              onCheckedChange={() => toggleTask(currentDay, subtask.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex items-center space-x-2 flex-grow">
                              {editingSubtaskId === subtask.id ? (
                                <input
                                  type="text"
                                  value={editingSubtaskText}
                                  autoFocus
                                  onChange={e => setEditingSubtaskText(e.target.value)}
                                  onBlur={() => saveEditingSubtask(subtask.id)}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") {
                                      saveEditingSubtask(subtask.id)
                                    }
                                    if (e.key === "Escape") {
                                      setEditingSubtaskId(null)
                                      setEditingSubtaskText("")
                                    }
                                  }}
                                  className="flex-grow p-1 rounded bg-[#18181A] border border-gray-700 text-white outline-none text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <label
                                  htmlFor={`subtask-${subtask.id}`}
                                  className={`flex-grow text-sm ${subtask.completed ? "line-through text-gray-400 opacity-45" : "text-gray-300"} cursor-pointer hover:underline`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingSubtask(subtask.id, subtask.task);
                                  }}
                                  title="Click to edit"
                                >
                                  {subtask.task}
                                </label>
                              )}
                            </div>
                            
                            {/* Subtask action buttons - only show when active */}
                            {activeSubtaskId === subtask.id && (
                              <div className="flex items-center space-x-1 animate-in slide-in-from-right-2 duration-200">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingSubtask(subtask.id, subtask.task);
                                  }}
                                  className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                  title="Edit subtask"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmDeleteSubtask(subtask.id, subtask.task);
                                  }}
                                  className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                  title="Delete subtask"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {appointments.some(
                (apt) => apt.date === focusedDate,
              ) && (
                <div className="mt-4">
                  <h3 className="text-red-500 font-semibold mb-2">Appointments:</h3>
                  <ul className="list-disc list-inside">
                    {appointments
                      .filter((apt) => apt.date === focusedDate)
                      .map((apt) => (
                        <li key={apt.id} className="text-white flex items-center space-x-2">
                          <Checkbox
                            checked={apt.completed}
                            onCheckedChange={() => handleToggleAppointment(apt.id, apt.completed)}
                            className="border-gray-400"
                          />
                          <span className={apt.completed ? "line-through text-gray-500" : ""}>
                            {apt.title} at {apt.time}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              {leisureActivities.some(
                (activity) => activity.activity_date === focusedDate,
              ) && (
                <div className="mt-4">
                  <h3 className="text-yellow-400 font-semibold mb-2">Leisure Activities:</h3>
                  <ul className="list-disc list-inside">
                    {leisureActivities
                      .filter((activity) => activity.activity_date === focusedDate)
                      .map((activity) => (
                        <li key={activity.id} className="text-white flex items-center space-x-2">
                          <Checkbox
                            checked={activity.completed}
                            onCheckedChange={() => handleToggleLeisure(activity.id, activity.completed)}
                            className="border-gray-400"
                          />
                          <span className={activity.completed ? "line-through text-gray-500" : ""}>{activity.activity}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              {fitnessActivities.some(
                (activity) => activity.activity_date === focusedDate,
              ) && (
                <div className="mt-4">
                  <h3 className="text-green-400 font-semibold mb-2">Fitness Activities:</h3>
                  <ul className="list-disc list-inside">
                    {fitnessActivities
                      .filter((activity) => activity.activity_date === focusedDate)
                      .map((activity) => (
                        <li key={activity.id} className="text-white flex items-center space-x-2">
                          <Checkbox
                            checked={activity.completed}
                            onCheckedChange={() => handleToggleFitness(activity.id, activity.completed)}
                            className="border-gray-400"
                          />
                          <span className={activity.completed ? "line-through text-gray-500" : ""}>{activity.activity}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              {workPrioritiesForDay.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-blue-400 font-semibold mb-2 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" /> Work Priorities:
                  </h3>
                  <ul className="list-disc list-inside">
                    {workPrioritiesForDay.map((wp) => (
                      <li key={wp.id} className="text-white flex items-center space-x-2">
                        <Checkbox
                          checked={wp.completed}
                          onCheckedChange={() => handleToggleWorkPriority(wp.id, wp.completed)}
                          className="border-gray-400"
                        />
                        <span className={wp.completed ? "line-through text-gray-500" : ""}>{wp.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selfDevPrioritiesForDay.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-yellow-400 font-semibold mb-2 flex items-center">
                    <Trophy className="w-5 h-5 mr-2" /> Self-Development Priorities:
                  </h3>
                  <ul className="list-disc list-inside">
                    {selfDevPrioritiesForDay.map((sd) => (
                      <li key={sd.id} className="text-white flex items-center space-x-2">
                        <Checkbox
                          checked={sd.completed}
                          onCheckedChange={() => handleToggleSelfDevPriority(sd.id, sd.completed)}
                          className="border-gray-400"
                        />
                        <span className={sd.completed ? "line-through text-gray-500" : ""}>{sd.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!addingTask && (
                <Button onClick={() => addTask(currentDay)} className="w-full">
                  Add Task
                </Button>
              )}
            </CardContent>
          </div>
        </Card>

        {/* Other days - in the third column */}
        <div className="space-y-4">
          {sidebarDates.map((dateObj) => {
            const dayLabel = format(dateObj, "EEEE");
            const dateStr = format(dateObj, "yyyy-MM-dd");
              const numTasksForDay =
                todos.filter((todo) => todo.due_date === dateStr).length +
                workPriorities.filter((wp) => wp.due_date_only && wp.due_date_only === dateStr).length +
                appointments.filter((apt) => apt.date === dateStr).length +
                fitnessActivities.filter((fa) => fa.activity_date === dateStr).length +
                leisureActivities.filter((la) => la.activity_date === dateStr).length;
             const selfDevForDay = selfDevPriorities.filter((sd) => sd.due_date_only && sd.due_date_only === dateStr);
              return (
                <Card
                key={dateStr}
                  className="bg-[#141415] border border-gray-700 cursor-pointer hover:bg-[#1a1a1b] transition-colors"
                onClick={() => handleDayClick(dateStr, dayLabel)}
                >
                  <div className="h-full w-full bg-[#141415] p-2 max-h-[150px] overflow-y-auto">
                    <CardHeader className="p-1 bg-black">
                      <CardTitle className="flex justify-between items-center text-white">
                        <div className="flex items-center">
                          {appointments.some(
                          (apt) => apt.date === dateStr,
                          ) && <Clock className="h-4 w-4 text-red-500 mr-2" />}
                          {leisureActivities.some(
                          (activity) => activity.activity_date === dateStr,
                          ) && <Sun className="h-4 w-4 text-yellow-400 mr-2" />}
                          {fitnessActivities.some(
                          (activity) => activity.activity_date === dateStr,
                          ) && <Dumbbell className="h-4 w-4 text-green-400 mr-2" />}
                         {selfDevForDay.length > 0 && <Trophy className="h-4 w-4 text-yellow-400 mr-2" />}
                        {dayLabel.toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-300">
                        {format(dateObj, "MMM d, yyyy")}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-1">
                      <p className="text-sm text-gray-400 flex items-center justify-center h-full">
                        {numTasksForDay} task(s)
                      </p>
                    </CardContent>
                  </div>
                </Card>
            );
            })}
        </div>
      </div>
      <p className="text-center text-xs text-gray-500 mt-8">Developed by JOR powered by Covion Studio</p>
      <nav className="fixed bottom-0 left-0 w-full bg-[#18181A] border-t border-gray-800 z-50 flex justify-center items-center py-2">
        <div className="flex justify-between w-full max-w-md px-8">
          <Link href="/" className="flex flex-col items-center text-gray-300 hover:text-blue-400 transition">
            <Home className="h-6 w-6 mb-1" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/feed" className="flex flex-col items-center text-gray-300 hover:text-blue-400 transition">
            <Rss className="h-6 w-6 mb-1" />
            <span className="text-xs">Feed</span>
          </Link>
          <Link href="/account" className="flex flex-col items-center text-gray-300 hover:text-blue-400 transition">
            <UserIcon className="h-6 w-6 mb-1" />
            <span className="text-xs">Account</span>
          </Link>
          <Link href="/settings" className="flex flex-col items-center text-gray-300 hover:text-blue-400 transition">
            <Settings className="h-6 w-6 mb-1" />
            <span className="text-xs">Settings</span>
          </Link>
          {userId ? (
            <button onClick={handleSignOut} className="flex flex-col items-center text-gray-300 hover:text-red-400 transition focus:outline-none">
              <LogOut className="h-6 w-6 mb-1" />
              <span className="text-xs">Sign Out</span>
            </button>
          ) : (
            <Link href="/auth" className="flex flex-col items-center text-gray-300 hover:text-green-400 transition">
              <LogOut className="h-6 w-6 mb-1" />
              <span className="text-xs">Sign In</span>
            </Link>
          )}
        </div>
      </nav>
      {error && <div className="bg-red-900 text-red-200 p-2 mb-4 rounded">{error}</div>}
      {loading && <div className="text-blue-300 mb-2">Loading...</div>}
      
      {/* Custom Delete Confirmation Dialog */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1b] border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Confirm Deletion</h3>
                <p className="text-sm text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-white">
                "{deleteTarget.name}"
              </span>
              {deleteTarget.type === 'task' ? ' and all its subtasks' : ''}?
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteTarget.type === 'task') {
                    deleteTodo(deleteTarget.id);
                  } else {
                    deleteSubtask(deleteTarget.id);
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

