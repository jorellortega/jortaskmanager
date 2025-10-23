"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Plus,
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
  parent_id?: string | null
  created_at?: string
  peer_name?: string  // For peer activities
  is_peer_activity?: boolean  // To distinguish peer activities
  participant_count?: number  // Number of participants
  user_participation?: {
    id: string
    status: string
    note?: string
  }  // User's participation status
}

type WorkPriority = {
  id: string;
  user_id: string;
  title: string;
  due_date_only?: string | null;
  due_datetime?: string;
  created_at?: string;
  completed: boolean;
  parent_id?: string | null;
};

type SelfDevPriority = {
  id: string;
  user_id: string;
  title: string;
  due_date_only?: string | null;
  due_datetime?: string;
  created_at?: string;
  completed: boolean;
  parent_id?: string | null;
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'task' | 'subtask' | 'work' | 'work-subtask' | 'selfdev' | 'selfdev-subtask' | 'leisure' | 'fitness' | 'fitness-subtask'; name: string } | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [activeSubtaskId, setActiveSubtaskId] = useState<string | null>(null)
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null)
  const [activeWorkSubtaskId, setActiveWorkSubtaskId] = useState<string | null>(null)
  const [activeSelfDevId, setActiveSelfDevId] = useState<string | null>(null)
  const [activeSelfDevSubtaskId, setActiveSelfDevSubtaskId] = useState<string | null>(null)
  const [activeLeisureId, setActiveLeisureId] = useState<string | null>(null)
  const [activeFitnessId, setActiveFitnessId] = useState<string | null>(null)
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null)
  const [editingWorkText, setEditingWorkText] = useState<string>("")
  const [editingWorkSubtaskId, setEditingWorkSubtaskId] = useState<string | null>(null)
  const [editingWorkSubtaskText, setEditingWorkSubtaskText] = useState<string>("")
  const [editingSelfDevId, setEditingSelfDevId] = useState<string | null>(null)
  const [editingSelfDevText, setEditingSelfDevText] = useState<string>("")
  const [editingSelfDevSubtaskId, setEditingSelfDevSubtaskId] = useState<string | null>(null)
  const [editingSelfDevSubtaskText, setEditingSelfDevSubtaskText] = useState<string>("")
  const [editingLeisureId, setEditingLeisureId] = useState<string | null>(null)
  const [editingLeisureText, setEditingLeisureText] = useState<string>("")
  const [editingFitnessId, setEditingFitnessId] = useState<string | null>(null)
  const [editingFitnessText, setEditingFitnessText] = useState<string>("")
  const [editingFitnessSubtaskId, setEditingFitnessSubtaskId] = useState<string | null>(null)
  const [editingFitnessSubtaskText, setEditingFitnessSubtaskText] = useState<string>("")
  const [activeFitnessSubtaskId, setActiveFitnessSubtaskId] = useState<string | null>(null)
  const [subtaskInputs, setSubtaskInputs] = useState<{ [parentId: string]: string }>({})
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null)
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
      
      // Fetch peer fitness activities
      let allFitnessActivities = [...(fitnessData || [])]
      
      // Check if user has fitness sync enabled
      const { data: userPrefs, error: prefsError } = await supabase
        .from("peer_sync_preferences")
        .select("*")
        .eq("user_id", user.id)
        .eq("preference_key", "fitness")
        .eq("enabled", true)
      
      if (userPrefs && userPrefs.length > 0) {
        // User has fitness sync enabled, fetch peer activities
        const { data: peers, error: peersError } = await supabase
          .from("peers")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "accepted")
        
        if (peers && !peersError) {
          for (const peer of peers) {
            // Check if peer also has fitness enabled
            const { data: peerPrefs, error: peerPrefsError } = await supabase
              .from("peer_sync_preferences")
              .select("*")
              .eq("user_id", peer.peer_user_id)
              .eq("preference_key", "fitness")
              .eq("enabled", true)
            
            if (peerPrefs && peerPrefs.length > 0) {
              // Both users have fitness enabled, fetch peer's activities
              const { data: peerActivities, error: peerActivitiesError } = await supabase
                .from("fitness_activities")
                .select("*")
                .eq("user_id", peer.peer_user_id)
              
              if (peerActivities && !peerActivitiesError) {
                // Add peer activities with peer info and participant data
                const peerActivitiesWithInfo = await Promise.all(
                  peerActivities.map(async (activity) => {
                    // Fetch participant count for this activity
                    const { data: participants, error: participantsError } = await supabase
                      .from("activity_participants")
                      .select("*")
                      .eq("activity_id", activity.id)
                      .eq("activity_type", "fitness")
                    
                    // Check if current user has joined this activity
                    const userParticipation = participants?.find(p => p.user_id === user.id)
                    
                    return {
                      ...activity,
                      peer_name: peer.peer_name || "Peer",
                      is_peer_activity: true,
                      participant_count: (participants?.length || 0) + 1, // +1 for the original creator
                      user_participation: userParticipation ? {
                        id: userParticipation.id,
                        status: userParticipation.status,
                        note: userParticipation.note
                      } : undefined
                    }
                  })
                )
                allFitnessActivities = [...allFitnessActivities, ...peerActivitiesWithInfo]
              }
            }
          }
        }
      }
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
        setFitnessActivities(allFitnessActivities)
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
  
  // Filter work priorities - only show parents for the focused day
  const workPrioritiesForDay = workPriorities.filter((wp) => {
    // Only show parent work priorities (no parent_id)
    if (wp.parent_id) return false;
    
    // Use due_date_only if present, else due_datetime
    if (wp.due_date_only) {
      return wp.due_date_only === focusedDate;
    } else if (wp.due_datetime) {
      return wp.due_datetime.startsWith(focusedDate);
    }
    return false;
  });

  const selfDevPrioritiesForDay = selfDevPriorities.filter((sd) => {
    // Only show parent priorities (no parent_id)
    if (sd.parent_id) return false;
    
    if (sd.due_date_only) {
      return sd.due_date_only === focusedDate;
    } else if (sd.due_datetime) {
      return sd.due_datetime.startsWith(focusedDate);
    }
    return false;
  });
  
  // Helper to get work priority subtasks
  const getWorkSubtasks = (parentId: string) => {
    return workPriorities.filter(wp => wp.parent_id === parentId);
  };
  
  // Helper to get self-dev subtasks
  const getSelfDevSubtasks = (parentId: string) => {
    return selfDevPriorities.filter(sd => sd.parent_id === parentId);
  };
  
  // Helper to get fitness subtasks
  const getFitnessSubtasks = (parentId: string) => {
    return fitnessActivities.filter(fa => fa.parent_id === parentId);
  };
  
  // Helper to check if a fitness activity has subtasks
  const hasFitnessSubtasks = (fitnessId: string) => {
    return fitnessActivities.some(fa => fa.parent_id === fitnessId);
  };

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

  const joinFitnessActivity = async (activityId: string, peerUserId: string) => {
    if (!userId) return
    
    setLoading(true)
    const { error } = await supabase
      .from("activity_participants")
      .insert([{
        activity_id: activityId,
        activity_type: "fitness",
        user_id: userId,
        peer_user_id: peerUserId,
        status: "joined"
      }])
    
    if (error) {
      setError("Failed to join activity.")
    } else {
      // Refresh page to show updated participant count
      window.location.reload()
    }
    setLoading(false)
  }

  const leaveFitnessActivity = async (participationId: string) => {
    setLoading(true)
    const { error } = await supabase
      .from("activity_participants")
      .delete()
      .eq("id", participationId)
    
    if (error) {
      setError("Failed to leave activity.")
    } else {
      // Refresh page to show updated participant count
      window.location.reload()
    }
    setLoading(false)
  }
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

  // Work Priority Edit Functions
  const startEditingWork = (id: string, currentText: string) => {
    setEditingWorkId(id);
    setEditingWorkText(currentText);
    setActiveWorkId(null);
    setActiveWorkSubtaskId(null);
  };

  const saveEditingWork = async (id: string) => {
    if (!editingWorkText.trim()) return;
    setLoading(true);
    setError(null);
    const { data, error: updateError } = await supabase
      .from("work_priorities")
      .update({ title: editingWorkText.trim() })
      .eq("id", id)
      .select();
    if (updateError) {
      setError(updateError.message || "Failed to update work priority.");
    } else if (data && data.length > 0) {
      setWorkPriorities((prev) => prev.map((wp) => (wp.id === id ? data[0] : wp)));
      setEditingWorkId(null);
      setEditingWorkText("");
    }
    setLoading(false);
  };

  const startEditingWorkSubtask = (id: string, currentText: string) => {
    setEditingWorkSubtaskId(id);
    setEditingWorkSubtaskText(currentText);
    setActiveWorkId(null);
    setActiveWorkSubtaskId(null);
  };

  const saveEditingWorkSubtask = async (id: string) => {
    if (!editingWorkSubtaskText.trim()) return;
    setLoading(true);
    setError(null);
    const { data, error: updateError } = await supabase
      .from("work_priorities")
      .update({ title: editingWorkSubtaskText.trim() })
      .eq("id", id)
      .select();
    if (updateError) {
      setError(updateError.message || "Failed to update work subtask.");
    } else if (data && data.length > 0) {
      setWorkPriorities((prev) => prev.map((wp) => (wp.id === id ? data[0] : wp)));
      setEditingWorkSubtaskId(null);
      setEditingWorkSubtaskText("");
    }
    setLoading(false);
  };

  // Self-Dev Edit Functions
  const startEditingSelfDev = (id: string, currentText: string) => {
    setEditingSelfDevId(id);
    setEditingSelfDevText(currentText);
    setActiveSelfDevId(null);
    setActiveSelfDevSubtaskId(null);
  };

  const saveEditingSelfDev = async (id: string) => {
    if (!editingSelfDevText.trim()) return;
    setLoading(true);
    setError(null);
    const { data, error: updateError } = await supabase
      .from("self_development_priorities")
      .update({ title: editingSelfDevText.trim() })
      .eq("id", id)
      .select();
    if (updateError) {
      setError(updateError.message || "Failed to update self-dev priority.");
    } else if (data && data.length > 0) {
      setSelfDevPriorities((prev) => prev.map((sd) => (sd.id === id ? data[0] : sd)));
      setEditingSelfDevId(null);
      setEditingSelfDevText("");
    }
    setLoading(false);
  };

  const startEditingSelfDevSubtask = (id: string, currentText: string) => {
    setEditingSelfDevSubtaskId(id);
    setEditingSelfDevSubtaskText(currentText);
    setActiveSelfDevId(null);
    setActiveSelfDevSubtaskId(null);
  };

  const saveEditingSelfDevSubtask = async (id: string) => {
    if (!editingSelfDevSubtaskText.trim()) return;
    setLoading(true);
    setError(null);
    const { data, error: updateError } = await supabase
      .from("self_development_priorities")
      .update({ title: editingSelfDevSubtaskText.trim() })
      .eq("id", id)
      .select();
    if (updateError) {
      setError(updateError.message || "Failed to update self-dev subtask.");
    } else if (data && data.length > 0) {
      setSelfDevPriorities((prev) => prev.map((sd) => (sd.id === id ? data[0] : sd)));
      setEditingSelfDevSubtaskId(null);
      setEditingSelfDevSubtaskText("");
    }
    setLoading(false);
  };

  // Delete Functions
  const confirmDeleteWork = (id: string, name: string) => {
    setDeleteTarget({ id, type: 'work', name });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteWorkSubtask = (id: string, name: string) => {
    setDeleteTarget({ id, type: 'work-subtask', name });
    setShowDeleteConfirm(true);
  };

  const deleteWorkPriority = async (id: string, isParent: boolean = false) => {
    setError(null);
    setLoading(true);
    
    // If it's a parent, delete all subtasks first
    if (isParent) {
      const { error: deleteSubtasksError } = await supabase
        .from("work_priorities")
        .delete()
        .eq("parent_id", id);
      
      if (deleteSubtasksError) {
        setError(deleteSubtasksError.message || "Failed to delete work subtasks.");
        setLoading(false);
        return;
      }
    }
    
    const { error: deleteError } = await supabase
      .from("work_priorities")
      .delete()
      .eq("id", id);
    
    if (deleteError) {
      setError(deleteError.message || "Failed to delete work priority.");
    } else {
      setWorkPriorities((prev) => prev.filter((wp) => wp.id !== id && wp.parent_id !== id));
    }
    setLoading(false);
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const confirmDeleteSelfDev = (id: string, name: string) => {
    setDeleteTarget({ id, type: 'selfdev', name });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSelfDevSubtask = (id: string, name: string) => {
    setDeleteTarget({ id, type: 'selfdev-subtask', name });
    setShowDeleteConfirm(true);
  };

  const deleteSelfDevPriority = async (id: string, isParent: boolean = false) => {
    setError(null);
    setLoading(true);
    
    // If it's a parent, delete all subtasks first
    if (isParent) {
      const { error: deleteSubtasksError } = await supabase
        .from("self_development_priorities")
        .delete()
        .eq("parent_id", id);
      
      if (deleteSubtasksError) {
        setError(deleteSubtasksError.message || "Failed to delete self-dev subtasks.");
        setLoading(false);
        return;
      }
    }
    
    const { error: deleteError } = await supabase
      .from("self_development_priorities")
      .delete()
      .eq("id", id);
    
    if (deleteError) {
      setError(deleteError.message || "Failed to delete self-dev priority.");
    } else {
      setSelfDevPriorities((prev) => prev.filter((sd) => sd.id !== id && sd.parent_id !== id));
    }
    setLoading(false);
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  // Leisure Edit Functions
  const startEditingLeisure = (id: string, currentText: string) => {
    setEditingLeisureId(id);
    setEditingLeisureText(currentText);
    setActiveLeisureId(null);
  };

  const saveEditingLeisure = async (id: string) => {
    if (!editingLeisureText.trim()) return;
    setLoading(true);
    setError(null);
    const { data, error: updateError } = await supabase
      .from("leisure_activities")
      .update({ activity: editingLeisureText.trim() })
      .eq("id", id)
      .select();
    if (updateError) {
      setError(updateError.message || "Failed to update leisure activity.");
    } else if (data && data.length > 0) {
      setLeisureActivities((prev) => prev.map((la) => (la.id === id ? data[0] : la)));
      setEditingLeisureId(null);
      setEditingLeisureText("");
    }
    setLoading(false);
  };

  const confirmDeleteLeisure = (id: string, name: string) => {
    setDeleteTarget({ id, type: 'leisure', name });
    setShowDeleteConfirm(true);
  };

  const deleteLeisureActivity = async (id: string) => {
    setError(null);
    setLoading(true);
    
    const { error: deleteError } = await supabase
      .from("leisure_activities")
      .delete()
      .eq("id", id);
    
    if (deleteError) {
      setError(deleteError.message || "Failed to delete leisure activity.");
    } else {
      setLeisureActivities((prev) => prev.filter((la) => la.id !== id));
    }
    setLoading(false);
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  // Fitness Edit Functions
  const startEditingFitness = (id: string, currentText: string) => {
    setEditingFitnessId(id);
    setEditingFitnessText(currentText);
    setActiveFitnessId(null);
  };

  const saveEditingFitness = async (id: string) => {
    if (!editingFitnessText.trim()) return;
    setLoading(true);
    setError(null);
    const { data, error: updateError } = await supabase
      .from("fitness_activities")
      .update({ activity: editingFitnessText.trim() })
      .eq("id", id)
      .select();
    if (updateError) {
      setError(updateError.message || "Failed to update fitness activity.");
    } else if (data && data.length > 0) {
      setFitnessActivities((prev) => prev.map((fa) => (fa.id === id ? data[0] : fa)));
      setEditingFitnessId(null);
      setEditingFitnessText("");
    }
    setLoading(false);
  };

  const confirmDeleteFitness = (id: string, name: string) => {
    setDeleteTarget({ id, type: 'fitness', name });
    setShowDeleteConfirm(true);
  };

  const deleteFitnessActivity = async (id: string) => {
    setError(null);
    setLoading(true);
    
    const { error: deleteError } = await supabase
      .from("fitness_activities")
      .delete()
      .eq("id", id);
    
    if (deleteError) {
      setError(deleteError.message || "Failed to delete fitness activity.");
    } else {
      setFitnessActivities((prev) => prev.filter((fa) => fa.id !== id));
    }
    setLoading(false);
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  // Fitness Subtask Functions
  const startEditingFitnessSubtask = (id: string, currentText: string) => {
    setEditingFitnessSubtaskId(id);
    setEditingFitnessSubtaskText(currentText);
    setActiveFitnessId(null);
    setActiveFitnessSubtaskId(null);
  };

  const saveEditingFitnessSubtask = async (id: string) => {
    if (!editingFitnessSubtaskText.trim()) return;
    setLoading(true);
    setError(null);
    const { data, error: updateError } = await supabase
      .from("fitness_activities")
      .update({ activity: editingFitnessSubtaskText.trim() })
      .eq("id", id)
      .select();
    if (updateError) {
      setError(updateError.message || "Failed to update fitness subtask.");
    } else if (data && data.length > 0) {
      setFitnessActivities((prev) => prev.map((fa) => (fa.id === id ? data[0] : fa)));
      setEditingFitnessSubtaskId(null);
      setEditingFitnessSubtaskText("");
    }
    setLoading(false);
  };

  const confirmDeleteFitnessSubtask = (id: string, name: string) => {
    setDeleteTarget({ id, type: 'fitness-subtask', name });
    setShowDeleteConfirm(true);
  };

  const deleteFitnessSubtask = async (id: string) => {
    setError(null);
    setLoading(true);
    
    const { error: deleteError } = await supabase
      .from("fitness_activities")
      .delete()
      .eq("id", id);
    
    if (deleteError) {
      setError(deleteError.message || "Failed to delete fitness subtask.");
    } else {
      setFitnessActivities((prev) => prev.filter((fa) => fa.id !== id));
    }
    setLoading(false);
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  // Add subtask functions
  const addSubtaskToTodo = async (parentId: string) => {
    setError(null);
    if (!userId) {
      setError("You must be logged in to add subtasks.");
      return;
    }
    const subtaskText = subtaskInputs[parentId]?.trim();
    if (subtaskText) {
      setLoading(true);
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
        .select();
      if (insertError) {
        setError(insertError.message || "Failed to add subtask. Please try again.");
      } else if (data && data.length > 0) {
        setTodos((prev) => [...prev, data[0]]);
        setSubtaskInputs((prev) => ({ ...prev, [parentId]: "" }));
        setAddingSubtaskTo(null);
        // Auto-expand to show the new subtask
        setExpandedTodos((prev) => new Set([...prev, parentId]));
      }
      setLoading(false);
    }
  };

  const addSubtaskToWork = async (parentId: string) => {
    setError(null);
    if (!userId) {
      setError("You must be logged in to add subtasks.");
      return;
    }
    const subtaskText = subtaskInputs[parentId]?.trim();
    if (subtaskText) {
      setLoading(true);
      const { data, error: insertError } = await supabase
        .from("work_priorities")
        .insert([
          {
            user_id: userId,
            title: subtaskText,
            due_date_only: null,
            due_datetime: null,
            parent_id: parentId,
          },
        ])
        .select();
      if (insertError) {
        setError(insertError.message || "Failed to add subtask. Please try again.");
      } else if (data && data.length > 0) {
        setWorkPriorities((prev) => [...prev, data[0]]);
        setSubtaskInputs((prev) => ({ ...prev, [parentId]: "" }));
        setAddingSubtaskTo(null);
        // Auto-expand to show the new subtask
        setExpandedTodos((prev) => new Set([...prev, parentId]));
      }
      setLoading(false);
    }
  };

  const addSubtaskToSelfDev = async (parentId: string) => {
    setError(null);
    if (!userId) {
      setError("You must be logged in to add subtasks.");
      return;
    }
    const subtaskText = subtaskInputs[parentId]?.trim();
    if (subtaskText) {
      setLoading(true);
      const { data, error: insertError } = await supabase
        .from("self_development_priorities")
        .insert([
          {
            user_id: userId,
            title: subtaskText,
            due_date_only: null,
            due_datetime: null,
            parent_id: parentId,
          },
        ])
        .select();
      if (insertError) {
        setError(insertError.message || "Failed to add subtask. Please try again.");
      } else if (data && data.length > 0) {
        setSelfDevPriorities((prev) => [...prev, data[0]]);
        setSubtaskInputs((prev) => ({ ...prev, [parentId]: "" }));
        setAddingSubtaskTo(null);
        // Auto-expand to show the new subtask
        setExpandedTodos((prev) => new Set([...prev, parentId]));
      }
      setLoading(false);
    }
  };

  const addSubtaskToFitness = async (parentId: string) => {
    setError(null);
    if (!userId) {
      setError("You must be logged in to add subtasks.");
      return;
    }
    const subtaskText = subtaskInputs[parentId]?.trim();
    if (subtaskText) {
      setLoading(true);
      const { data, error: insertError } = await supabase
        .from("fitness_activities")
        .insert([
          {
            user_id: userId,
            activity: subtaskText,
            activity_date: null,
            activity_time: null,
            completed: false,
            parent_id: parentId,
          },
        ])
        .select();
      if (insertError) {
        setError(insertError.message || "Failed to add subtask. Please try again.");
      } else if (data && data.length > 0) {
        setFitnessActivities((prev) => [...prev, data[0]]);
        setSubtaskInputs((prev) => ({ ...prev, [parentId]: "" }));
        setAddingSubtaskTo(null);
        // Auto-expand to show the new subtask
        setExpandedTodos((prev) => new Set([...prev, parentId]));
      }
      setLoading(false);
    }
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
                          className="border-gray-400 opacity-25"
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
                              className="border-gray-400 opacity-25"
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
                    
                    {/* Add Subtask */}
                    <div className="ml-12 mt-2">
                      {addingSubtaskTo === task.id ? (
                        <Input
                          type="text"
                          autoFocus
                          value={subtaskInputs[task.id] || ""}
                          onChange={(e) => setSubtaskInputs((prev) => ({ ...prev, [task.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && subtaskInputs[task.id]?.trim()) {
                              addSubtaskToTodo(task.id);
                            }
                            if (e.key === "Escape") {
                              setAddingSubtaskTo(null);
                              setSubtaskInputs((prev) => ({ ...prev, [task.id]: "" }));
                            }
                          }}
                          onBlur={() => {
                            if (subtaskInputs[task.id]?.trim()) {
                              addSubtaskToTodo(task.id);
                            } else {
                              setAddingSubtaskTo(null);
                              setSubtaskInputs((prev) => ({ ...prev, [task.id]: "" }));
                            }
                          }}
                          placeholder="Add subtask..."
                          className="w-48 bg-[#1A1A1B] border-gray-700 text-white text-sm"
                        />
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => setAddingSubtaskTo(task.id)}
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-white opacity-25"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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
                            className="border-gray-400 opacity-25"
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
                  <div className="space-y-2">
                    {leisureActivities
                      .filter((activity) => activity.activity_date === focusedDate)
                      .map((activity) => (
                        <div 
                          key={activity.id} 
                          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[#1a1a1b] transition-colors cursor-pointer"
                          onClick={() => setActiveLeisureId(activeLeisureId === activity.id ? null : activity.id)}
                        >
                          <Checkbox
                            checked={activity.completed}
                            onCheckedChange={() => handleToggleLeisure(activity.id, activity.completed)}
                            className="border-gray-400 opacity-25"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex items-center space-x-2 flex-grow">
                            {editingLeisureId === activity.id ? (
                              <input
                                type="text"
                                value={editingLeisureText}
                                autoFocus
                                onChange={e => setEditingLeisureText(e.target.value)}
                                onBlur={() => saveEditingLeisure(activity.id)}
                                onKeyDown={e => {
                                  if (e.key === "Enter") {
                                    saveEditingLeisure(activity.id)
                                  }
                                  if (e.key === "Escape") {
                                    setEditingLeisureId(null)
                                    setEditingLeisureText("")
                                  }
                                }}
                                className="flex-grow p-1 rounded bg-[#18181A] border border-gray-700 text-white outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span 
                                className={activity.completed ? "line-through text-gray-500" : "text-white"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingLeisure(activity.id, activity.activity);
                                }}
                                title="Click to edit"
                              >
                                {activity.activity}
                              </span>
                            )}
                          </div>
                          
                          {activeLeisureId === activity.id && (
                            <div className="flex items-center space-x-1 animate-in slide-in-from-right-2 duration-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingLeisure(activity.id, activity.activity);
                                }}
                                className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                title="Edit leisure activity"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDeleteLeisure(activity.id, activity.activity);
                                }}
                                className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                title="Delete leisure activity"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {fitnessActivities.some(
                (activity) => activity.activity_date === focusedDate && !activity.parent_id,
              ) && (
                <div className="mt-4">
                  <h3 className="text-green-400 font-semibold mb-2">Fitness Activities:</h3>
                  <div className="space-y-2">
                    {fitnessActivities
                      .filter((activity) => activity.activity_date === focusedDate && !activity.parent_id)
                      .map((activity) => {
                        const fitnessSubtasks = getFitnessSubtasks(activity.id);
                        const hasFitnessSubtasksCount = fitnessSubtasks.length > 0;
                        const isExpanded = expandedTodos.has(activity.id);
                        
                        return (
                          <div key={activity.id} className="space-y-1">
                            <div 
                              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[#1a1a1b] transition-colors cursor-pointer"
                              onClick={() => setActiveFitnessId(activeFitnessId === activity.id ? null : activity.id)}
                            >
                              <Checkbox
                                checked={activity.completed}
                                onCheckedChange={() => handleToggleFitness(activity.id, activity.completed)}
                                className="border-gray-400 opacity-25"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex items-center space-x-2 flex-grow">
                                <span className="text-white font-medium">
                                  {activity.activity}
                                </span>
                                {activity.is_peer_activity && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-blue-400 text-sm font-medium">
                                      👤 {activity.peer_name}
                                    </span>
                                    {activity.participant_count && activity.participant_count > 1 && (
                                      <span className="text-xs text-gray-400">
                                        {activity.participant_count} participants
                                      </span>
                                    )}
                                    {activity.user_participation ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => leaveFitnessActivity(activity.user_participation!.id)}
                                        className="text-gray-400 border-gray-600 bg-transparent hover:bg-transparent hover:text-green-400 hover:border-green-400 text-xs px-2 py-1"
                                      >
                                        Leave
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => joinFitnessActivity(activity.id, activity.user_id)}
                                        className="text-gray-400 border-gray-600 bg-transparent hover:bg-transparent hover:text-green-400 hover:border-green-400 text-xs px-2 py-1"
                                      >
                                        Join
                                      </Button>
                                    )}
                                  </div>
                                )}
                                {editingFitnessId === activity.id ? (
                                  <input
                                    type="text"
                                    value={editingFitnessText}
                                    autoFocus
                                    onChange={e => setEditingFitnessText(e.target.value)}
                                    onBlur={() => saveEditingFitness(activity.id)}
                                    onKeyDown={e => {
                                      if (e.key === "Enter") {
                                        saveEditingFitness(activity.id)
                                      }
                                      if (e.key === "Escape") {
                                        setEditingFitnessId(null)
                                        setEditingFitnessText("")
                                      }
                                    }}
                                    className="flex-grow p-1 rounded bg-[#18181A] border border-gray-700 text-white outline-none"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : null}
                                {hasFitnessSubtasksCount && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpanded(activity.id);
                                    }}
                                    className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
                                    title={isExpanded ? "Hide subtasks" : "Show subtasks"}
                                  >
                                    {fitnessSubtasks.length} subtask{fitnessSubtasks.length !== 1 ? 's' : ''}
                                  </button>
                                )}
                              </div>
                              
                              {activeFitnessId === activity.id && (
                                <div className="flex items-center space-x-1 animate-in slide-in-from-right-2 duration-200">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditingFitness(activity.id, activity.activity);
                                    }}
                                    className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                    title="Edit fitness activity"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmDeleteFitness(activity.id, activity.activity);
                                    }}
                                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                    title="Delete fitness activity"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            {/* Fitness Subtasks */}
                            {isExpanded && hasFitnessSubtasksCount && (
                              <div className="ml-6 space-y-1">
                                {fitnessSubtasks.map((subtask) => (
                                  <div 
                                    key={subtask.id} 
                                    className="flex items-center space-x-2 p-1 rounded-lg hover:bg-[#1a1a1b] transition-colors cursor-pointer ml-6"
                                    onClick={() => setActiveFitnessSubtaskId(activeFitnessSubtaskId === subtask.id ? null : subtask.id)}
                                  >
                                    <Checkbox
                                      checked={subtask.completed}
                                      onCheckedChange={() => handleToggleFitness(subtask.id, subtask.completed)}
                                      className="border-gray-400 opacity-25"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex items-center space-x-2 flex-grow">
                                      {editingFitnessSubtaskId === subtask.id ? (
                                        <input
                                          type="text"
                                          value={editingFitnessSubtaskText}
                                          autoFocus
                                          onChange={e => setEditingFitnessSubtaskText(e.target.value)}
                                          onBlur={() => saveEditingFitnessSubtask(subtask.id)}
                                          onKeyDown={e => {
                                            if (e.key === "Enter") {
                                              saveEditingFitnessSubtask(subtask.id)
                                            }
                                            if (e.key === "Escape") {
                                              setEditingFitnessSubtaskId(null)
                                              setEditingFitnessSubtaskText("")
                                            }
                                          }}
                                          className="flex-grow p-1 rounded bg-[#18181A] border border-gray-700 text-white outline-none text-sm"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      ) : (
                                        <span 
                                          className={`text-sm ${subtask.completed ? "line-through text-gray-500" : "text-gray-300"}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            startEditingFitnessSubtask(subtask.id, subtask.activity);
                                          }}
                                          title="Click to edit"
                                        >
                                          {subtask.activity}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Subtask action buttons - only show when active */}
                                    {activeFitnessSubtaskId === subtask.id && (
                                      <div className="flex items-center space-x-1 animate-in slide-in-from-right-2 duration-200">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            startEditingFitnessSubtask(subtask.id, subtask.activity);
                                          }}
                                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                          title="Edit subtask"
                                        >
                                          <Edit2 className="h-3 w-3" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            confirmDeleteFitnessSubtask(subtask.id, subtask.activity);
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
                            
                            {/* Add Subtask for Fitness */}
                            <div className="ml-12 mt-2">
                              {addingSubtaskTo === activity.id ? (
                                <Input
                                  type="text"
                                  autoFocus
                                  value={subtaskInputs[activity.id] || ""}
                                  onChange={(e) => setSubtaskInputs((prev) => ({ ...prev, [activity.id]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && subtaskInputs[activity.id]?.trim()) {
                                      addSubtaskToFitness(activity.id);
                                    }
                                    if (e.key === "Escape") {
                                      setAddingSubtaskTo(null);
                                      setSubtaskInputs((prev) => ({ ...prev, [activity.id]: "" }));
                                    }
                                  }}
                                  onBlur={() => {
                                    if (subtaskInputs[activity.id]?.trim()) {
                                      addSubtaskToFitness(activity.id);
                                    } else {
                                      setAddingSubtaskTo(null);
                                      setSubtaskInputs((prev) => ({ ...prev, [activity.id]: "" }));
                                    }
                                  }}
                                  placeholder="Add subtask..."
                                  className="w-48 bg-[#1A1A1B] border-gray-700 text-white text-sm"
                                />
                              ) : (
                                <Button 
                                  size="sm" 
                                  onClick={() => setAddingSubtaskTo(activity.id)}
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-white opacity-25"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
              {workPrioritiesForDay.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-blue-400 font-semibold mb-2 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" /> Work Priorities:
                  </h3>
                  <div className="space-y-2">
                    {workPrioritiesForDay.map((wp) => {
                      const workSubtasks = getWorkSubtasks(wp.id);
                      const hasWorkSubtasks = workSubtasks.length > 0;
                      const isExpanded = expandedTodos.has(wp.id);
                      
                      return (
                        <div key={wp.id} className="space-y-1">
                          <div 
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[#1a1a1b] transition-colors cursor-pointer"
                            onClick={() => setActiveWorkId(activeWorkId === wp.id ? null : wp.id)}
                          >
                         <Checkbox
                           checked={wp.completed}
                           onCheckedChange={() => handleToggleWorkPriority(wp.id, wp.completed)}
                           className="border-gray-400 opacity-25"
                               onClick={(e) => e.stopPropagation()}
                             />
                            <div className="flex items-center space-x-2 flex-grow">
                              {editingWorkId === wp.id ? (
                                <input
                                  type="text"
                                  value={editingWorkText}
                                  autoFocus
                                  onChange={e => setEditingWorkText(e.target.value)}
                                  onBlur={() => saveEditingWork(wp.id)}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") {
                                      saveEditingWork(wp.id)
                                    }
                                    if (e.key === "Escape") {
                                      setEditingWorkId(null)
                                      setEditingWorkText("")
                                    }
                                  }}
                                  className="flex-grow p-1 rounded bg-[#18181A] border border-gray-700 text-white outline-none"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <span 
                                  className={wp.completed ? "line-through text-gray-500" : "text-white"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingWork(wp.id, wp.title);
                                  }}
                                  title="Click to edit"
                                >
                                  {wp.title}
                                </span>
                              )}
                              {hasWorkSubtasks && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpanded(wp.id);
                                  }}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                                  title={isExpanded ? "Hide subtasks" : "Show subtasks"}
                                >
                                  {workSubtasks.length} subtask{workSubtasks.length !== 1 ? 's' : ''}
                                </button>
                              )}
                            </div>
                            
                            {/* Action buttons - only show when active */}
                            {activeWorkId === wp.id && (
                              <div className="flex items-center space-x-1 animate-in slide-in-from-right-2 duration-200">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingWork(wp.id, wp.title);
                                  }}
                                  className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                  title="Edit work priority"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmDeleteWork(wp.id, wp.title);
                                  }}
                                  className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                  title="Delete work priority"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* Work Priority Subtasks */}
                          {isExpanded && hasWorkSubtasks && (
                            <div className="ml-6 space-y-1">
                              {workSubtasks.map((subtask) => (
                                <div 
                                  key={subtask.id} 
                                  className="flex items-center space-x-2 p-1 rounded-lg hover:bg-[#1a1a1b] transition-colors cursor-pointer ml-6"
                                  onClick={() => setActiveWorkSubtaskId(activeWorkSubtaskId === subtask.id ? null : subtask.id)}
                                >
                                  <Checkbox
                                    checked={subtask.completed}
                                    onCheckedChange={() => handleToggleWorkPriority(subtask.id, subtask.completed)}
                                    className="border-gray-400 opacity-25"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex items-center space-x-2 flex-grow">
                                    {editingWorkSubtaskId === subtask.id ? (
                                      <input
                                        type="text"
                                        value={editingWorkSubtaskText}
                                        autoFocus
                                        onChange={e => setEditingWorkSubtaskText(e.target.value)}
                                        onBlur={() => saveEditingWorkSubtask(subtask.id)}
                                        onKeyDown={e => {
                                          if (e.key === "Enter") {
                                            saveEditingWorkSubtask(subtask.id)
                                          }
                                          if (e.key === "Escape") {
                                            setEditingWorkSubtaskId(null)
                                            setEditingWorkSubtaskText("")
                                          }
                                        }}
                                        className="flex-grow p-1 rounded bg-[#18181A] border border-gray-700 text-white outline-none text-sm"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    ) : (
                                      <span 
                                        className={`text-sm ${subtask.completed ? "line-through text-gray-500" : "text-gray-300"}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startEditingWorkSubtask(subtask.id, subtask.title);
                                        }}
                                        title="Click to edit"
                                      >
                                        {subtask.title}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Subtask action buttons - only show when active */}
                                  {activeWorkSubtaskId === subtask.id && (
                                    <div className="flex items-center space-x-1 animate-in slide-in-from-right-2 duration-200">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startEditingWorkSubtask(subtask.id, subtask.title);
                                        }}
                                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                        title="Edit subtask"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          confirmDeleteWorkSubtask(subtask.id, subtask.title);
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
                          
                          {/* Add Subtask for Work */}
                          <div className="ml-12 mt-2">
                            {addingSubtaskTo === wp.id ? (
                              <Input
                                type="text"
                                autoFocus
                                value={subtaskInputs[wp.id] || ""}
                                onChange={(e) => setSubtaskInputs((prev) => ({ ...prev, [wp.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && subtaskInputs[wp.id]?.trim()) {
                                    addSubtaskToWork(wp.id);
                                  }
                                  if (e.key === "Escape") {
                                    setAddingSubtaskTo(null);
                                    setSubtaskInputs((prev) => ({ ...prev, [wp.id]: "" }));
                                  }
                                }}
                                onBlur={() => {
                                  if (subtaskInputs[wp.id]?.trim()) {
                                    addSubtaskToWork(wp.id);
                                  } else {
                                    setAddingSubtaskTo(null);
                                    setSubtaskInputs((prev) => ({ ...prev, [wp.id]: "" }));
                                  }
                                }}
                                placeholder="Add subtask..."
                                className="w-48 bg-[#1A1A1B] border-gray-700 text-white text-sm"
                              />
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => setAddingSubtaskTo(wp.id)}
                                variant="ghost"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-white opacity-25"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {selfDevPrioritiesForDay.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-yellow-400 font-semibold mb-2 flex items-center">
                    <Trophy className="w-5 h-5 mr-2" /> Self-Development Priorities:
                  </h3>
                  <div className="space-y-2">
                    {selfDevPrioritiesForDay.map((sd) => {
                      const selfDevSubtasks = getSelfDevSubtasks(sd.id);
                      const hasSelfDevSubtasks = selfDevSubtasks.length > 0;
                      const isExpanded = expandedTodos.has(sd.id);
                      
                      return (
                        <div key={sd.id} className="space-y-1">
                          <div 
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[#1a1a1b] transition-colors cursor-pointer"
                            onClick={() => setActiveSelfDevId(activeSelfDevId === sd.id ? null : sd.id)}
                          >
                         <Checkbox
                           checked={sd.completed}
                           onCheckedChange={() => handleToggleSelfDevPriority(sd.id, sd.completed)}
                           className="border-gray-400 opacity-25"
                               onClick={(e) => e.stopPropagation()}
                             />
                            <div className="flex items-center space-x-2 flex-grow">
                              {editingSelfDevId === sd.id ? (
                                <input
                                  type="text"
                                  value={editingSelfDevText}
                                  autoFocus
                                  onChange={e => setEditingSelfDevText(e.target.value)}
                                  onBlur={() => saveEditingSelfDev(sd.id)}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") {
                                      saveEditingSelfDev(sd.id)
                                    }
                                    if (e.key === "Escape") {
                                      setEditingSelfDevId(null)
                                      setEditingSelfDevText("")
                                    }
                                  }}
                                  className="flex-grow p-1 rounded bg-[#18181A] border border-gray-700 text-white outline-none"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <span 
                                  className={sd.completed ? "line-through text-gray-500" : "text-white"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingSelfDev(sd.id, sd.title);
                                  }}
                                  title="Click to edit"
                                >
                                  {sd.title}
                                </span>
                              )}
                              {hasSelfDevSubtasks && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpanded(sd.id);
                                  }}
                                  className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs rounded transition-colors"
                                  title={isExpanded ? "Hide subtasks" : "Show subtasks"}
                                >
                                  {selfDevSubtasks.length} subtask{selfDevSubtasks.length !== 1 ? 's' : ''}
                                </button>
                              )}
                            </div>
                            
                            {/* Action buttons - only show when active */}
                            {activeSelfDevId === sd.id && (
                              <div className="flex items-center space-x-1 animate-in slide-in-from-right-2 duration-200">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingSelfDev(sd.id, sd.title);
                                  }}
                                  className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                  title="Edit self-dev priority"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmDeleteSelfDev(sd.id, sd.title);
                                  }}
                                  className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                  title="Delete self-dev priority"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* Self-Dev Subtasks */}
                          {isExpanded && hasSelfDevSubtasks && (
                            <div className="ml-6 space-y-1">
                              {selfDevSubtasks.map((subtask) => (
                                <div 
                                  key={subtask.id} 
                                  className="flex items-center space-x-2 p-1 rounded-lg hover:bg-[#1a1a1b] transition-colors cursor-pointer ml-6"
                                  onClick={() => setActiveSelfDevSubtaskId(activeSelfDevSubtaskId === subtask.id ? null : subtask.id)}
                                >
                                  <Checkbox
                                    checked={subtask.completed}
                                    onCheckedChange={() => handleToggleSelfDevPriority(subtask.id, subtask.completed)}
                                    className="border-gray-400 opacity-25"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex items-center space-x-2 flex-grow">
                                    {editingSelfDevSubtaskId === subtask.id ? (
                                      <input
                                        type="text"
                                        value={editingSelfDevSubtaskText}
                                        autoFocus
                                        onChange={e => setEditingSelfDevSubtaskText(e.target.value)}
                                        onBlur={() => saveEditingSelfDevSubtask(subtask.id)}
                                        onKeyDown={e => {
                                          if (e.key === "Enter") {
                                            saveEditingSelfDevSubtask(subtask.id)
                                          }
                                          if (e.key === "Escape") {
                                            setEditingSelfDevSubtaskId(null)
                                            setEditingSelfDevSubtaskText("")
                                          }
                                        }}
                                        className="flex-grow p-1 rounded bg-[#18181A] border border-gray-700 text-white outline-none text-sm"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    ) : (
                                      <span 
                                        className={`text-sm ${subtask.completed ? "line-through text-gray-500" : "text-gray-300"}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startEditingSelfDevSubtask(subtask.id, subtask.title);
                                        }}
                                        title="Click to edit"
                                      >
                                        {subtask.title}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Subtask action buttons - only show when active */}
                                  {activeSelfDevSubtaskId === subtask.id && (
                                    <div className="flex items-center space-x-1 animate-in slide-in-from-right-2 duration-200">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startEditingSelfDevSubtask(subtask.id, subtask.title);
                                        }}
                                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                        title="Edit subtask"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          confirmDeleteSelfDevSubtask(subtask.id, subtask.title);
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
                          
                          {/* Add Subtask for Self-Dev */}
                          <div className="ml-12 mt-2">
                            {addingSubtaskTo === sd.id ? (
                              <Input
                                type="text"
                                autoFocus
                                value={subtaskInputs[sd.id] || ""}
                                onChange={(e) => setSubtaskInputs((prev) => ({ ...prev, [sd.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && subtaskInputs[sd.id]?.trim()) {
                                    addSubtaskToSelfDev(sd.id);
                                  }
                                  if (e.key === "Escape") {
                                    setAddingSubtaskTo(null);
                                    setSubtaskInputs((prev) => ({ ...prev, [sd.id]: "" }));
                                  }
                                }}
                                onBlur={() => {
                                  if (subtaskInputs[sd.id]?.trim()) {
                                    addSubtaskToSelfDev(sd.id);
                                  } else {
                                    setAddingSubtaskTo(null);
                                    setSubtaskInputs((prev) => ({ ...prev, [sd.id]: "" }));
                                  }
                                }}
                                placeholder="Add subtask..."
                                className="w-48 bg-[#1A1A1B] border-gray-700 text-white text-sm"
                              />
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => setAddingSubtaskTo(sd.id)}
                                variant="ghost"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-white opacity-25"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                todos.filter((todo) => todo.due_date === dateStr && !todo.parent_id).length +
                workPriorities.filter((wp) => !wp.parent_id && wp.due_date_only && wp.due_date_only === dateStr).length +
                appointments.filter((apt) => apt.date === dateStr).length +
                fitnessActivities.filter((fa) => fa.activity_date === dateStr).length +
                leisureActivities.filter((la) => la.activity_date === dateStr).length;
             const selfDevForDay = selfDevPriorities.filter((sd) => !sd.parent_id && sd.due_date_only && sd.due_date_only === dateStr);
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
                          {workPriorities.some(
                          (wp) => !wp.parent_id && ((wp.due_date_only && wp.due_date_only === dateStr) || (wp.due_datetime && wp.due_datetime.startsWith(dateStr))),
                          ) && <Briefcase className="h-4 w-4 text-blue-400 mr-2" />}
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
              {(deleteTarget.type === 'task' || deleteTarget.type === 'work' || deleteTarget.type === 'selfdev' || deleteTarget.type === 'fitness') ? ' and all its subtasks' : ''}?
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
                  } else if (deleteTarget.type === 'subtask') {
                    deleteSubtask(deleteTarget.id);
                  } else if (deleteTarget.type === 'work') {
                    deleteWorkPriority(deleteTarget.id, true);
                  } else if (deleteTarget.type === 'work-subtask') {
                    deleteWorkPriority(deleteTarget.id, false);
                  } else if (deleteTarget.type === 'selfdev') {
                    deleteSelfDevPriority(deleteTarget.id, true);
                  } else if (deleteTarget.type === 'selfdev-subtask') {
                    deleteSelfDevPriority(deleteTarget.id, false);
                  } else if (deleteTarget.type === 'leisure') {
                    deleteLeisureActivity(deleteTarget.id);
                  } else if (deleteTarget.type === 'fitness') {
                    deleteFitnessActivity(deleteTarget.id);
                  } else if (deleteTarget.type === 'fitness-subtask') {
                    deleteFitnessSubtask(deleteTarget.id);
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

