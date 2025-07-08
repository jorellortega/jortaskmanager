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
} from "lucide-react"
import { format, addDays, startOfWeek, parseISO } from "date-fns"
import Link from "next/link"
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

type Todo = {
  id: string
  user_id: string
  task: string
  due_date: string | null
  completed: boolean
}

type Appointment = {
  id: string
  user_id: string
  title: string
  date: string
  time: string
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
};

type SelfDevPriority = {
  id: string;
  user_id: string;
  title: string;
  due_date_only?: string | null;
  due_datetime?: string;
  created_at?: string;
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
  const router = useRouter();

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
  }, []);

  useEffect(() => {
    localStorage.setItem("appointments", JSON.stringify(appointments))
  }, [appointments])

  const addTask = (day: string) => {
    setAddingTask(true)
    setNewTaskText("")
  }

  const handleAddTaskConfirm = async () => {
    if (!userId || !focusedDay || !newTaskText.trim()) {
      setAddingTask(false)
      setNewTaskText("")
      return
    }
    setLoading(true)
    setError(null)
    const dueDate = getDateForDay(focusedDay)
    const { data, error: insertError } = await supabase
      .from("todos")
      .insert([
        {
          user_id: userId,
          task: newTaskText.trim(),
          due_date: dueDate,
          completed: false,
        },
      ])
      .select()
    if (insertError) {
      setError(insertError.message || "Failed to add task.")
    } else if (data && data.length > 0) {
      setTodos((prev) => [...prev, data[0]])
    }
    setAddingTask(false)
    setNewTaskText("")
    setLoading(false)
  }

  const handleAddTaskCancel = () => {
    setAddingTask(false)
    setNewTaskText("")
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
    const todayIndex = days.indexOf(currentDay)
    if (todayIndex !== -1) {
      setFocusedDayIndex(todayIndex)
    }
  }, [days, currentDay])

  const handleDayClick = (clickedDay: string) => {
    setFocusedDayIndex(days.indexOf(clickedDay))
  }

  const focusedDay = days[focusedDayIndex] || ""
  // Always map day label to correct date in current week
  function getDateForDay(day: string) {
    // Use the stored 'today' date for all calculations
    const monday = startOfWeek(today, { weekStartsOn: 1 });
    const idx = allDays.indexOf(day);
    return format(addDays(monday, idx), "yyyy-MM-dd");
  }
  const focusedDate = focusedDay ? getDateForDay(focusedDay) : ""
  const todosForDay = todos.filter((todo) => todo.due_date === focusedDate)
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

  // Helper to get sidebar days in correct order, starting from the day after today
  const sidebarDays = [
    ...days.slice(focusedDayIndex + 1),
    ...days.slice(0, focusedDayIndex)
  ];

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
                (apt) =>
                  format(new Date(apt.date), "yyyy-MM-dd") ===
                  format(addDays(startOfWeek(today, { weekStartsOn: 1 }), days.indexOf(focusedDay)), "yyyy-MM-dd"),
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
                  {!isCurrentDay(focusedDay) && (
                    <ArrowLeft className="h-5 w-5 mr-2 cursor-pointer hover:text-blue-400" onClick={goToToday} />
                  )}
                  {focusedDay.toUpperCase()}
                </div>
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
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox disabled checked={false} />
                  <input
                    autoFocus
                    className="flex-grow p-1 rounded bg-[#18181A] border border-gray-700 text-white outline-none"
                    placeholder="Enter new task..."
                    value={newTaskText}
                    onChange={e => setNewTaskText(e.target.value)}
                    onBlur={handleAddTaskConfirm}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleAddTaskConfirm()
                      if (e.key === "Escape") handleAddTaskCancel()
                    }}
                  />
                </div>
              )}
              {todosForDay.map((task) => (
                <div key={task.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(focusedDay, task.id)}
                  />
                  <label
                    htmlFor={`task-${task.id}`}
                    className={`flex-grow ${task.completed ? "line-through text-gray-400 opacity-45" : "text-white"}`}
                  >
                    {task.task}
                  </label>
                </div>
              ))}
              {appointments.some(
                (apt) =>
                  format(new Date(apt.date), "yyyy-MM-dd") === focusedDate,
              ) && (
                <div className="mt-4">
                  <h3 className="text-red-500 font-semibold mb-2">Appointments:</h3>
                  <ul className="list-disc list-inside">
                    {appointments
                      .filter((apt) => format(parseISO(apt.date), "yyyy-MM-dd") === focusedDate)
                      .map((apt) => (
                        <li key={apt.id} className="text-white flex items-center">
                          <Clock className="h-4 w-4 text-red-500 mr-2 inline" />
                          <span>
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
                        <li key={activity.id} className="text-white">
                          {activity.activity}
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
                        <li key={activity.id} className="text-white">
                          {activity.activity}
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
                      <li key={wp.id} className="text-white">
                        {wp.title}
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
                      <li key={sd.id} className="text-white">
                        {sd.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Button onClick={() => addTask(focusedDay)} className="w-full" disabled={addingTask}>
                Add Task
              </Button>
            </CardContent>
          </div>
        </Card>

        {/* Other days - in the third column */}
        <div className="space-y-4">
          {sidebarDays.map((day) => {
              const dateStr = getDateForDay(day);
              const numTasksForDay =
                todos.filter((todo) => todo.due_date === dateStr).length +
                workPriorities.filter((wp) => wp.due_date_only && wp.due_date_only === dateStr).length +
                appointments.filter((apt) => format(parseISO(apt.date), "yyyy-MM-dd") === dateStr).length +
                fitnessActivities.filter((fa) => fa.activity_date === dateStr).length +
                leisureActivities.filter((la) => la.activity_date === dateStr).length;
             const selfDevForDay = selfDevPriorities.filter((sd) => sd.due_date_only && sd.due_date_only === dateStr);
              return (
                <Card
                  key={day}
                  className="bg-[#141415] border border-gray-700 cursor-pointer hover:bg-[#1a1a1b] transition-colors"
                  onClick={() => handleDayClick(day)}
                >
                  <div className="h-full w-full bg-[#141415] p-2 max-h-[150px] overflow-y-auto">
                    <CardHeader className="p-1 bg-black">
                      {/* Update the other days cards to show the leisure icon: */}
                      <CardTitle className="flex justify-between items-center text-white">
                        <div className="flex items-center">
                          {appointments.some(
                            (apt) =>
                              format(parseISO(apt.date), "yyyy-MM-dd") === getDateForDay(day),
                          ) && <Clock className="h-4 w-4 text-red-500 mr-2" />}
                          {leisureActivities.some(
                            (activity) => activity.activity_date === getDateForDay(day),
                          ) && <Sun className="h-4 w-4 text-yellow-400 mr-2" />}
                          {fitnessActivities.some(
                            (activity) => activity.activity_date === getDateForDay(day),
                          ) && <Dumbbell className="h-4 w-4 text-green-400 mr-2" />}
                         {selfDevForDay.length > 0 && <Trophy className="h-4 w-4 text-yellow-400 mr-2" />}
                          {day.toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-300">
                          {format(parseISO(getDateForDay(day)), "MMM d, yyyy")}
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
              )
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
    </div>
  )
}

