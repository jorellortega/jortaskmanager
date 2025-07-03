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
} from "lucide-react"
import { format, addDays, startOfWeek, parseISO } from "date-fns"
import Link from "next/link"
import type { Appointment } from "./appointments/page"

type Task = {
  id: number
  text: string
  completed: boolean
}

type DayTasks = {
  [key: string]: Task[]
}

// Add this new type
type LeisureActivity = {
  id: number
  activity: string
  date: string
}

type FitnessActivity = {
  id: number
  activity: string
  date: string
}

// Define the Todo type
type Todo = {
  id: number
  text: string
  completed: boolean
  dueDate: string
  isOverdue: boolean
}

const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const sampleAppointments: Appointment[] = [
  { id: 1, title: "Dentist Appointment", date: format(addDays(new Date(), 1), "yyyy-MM-dd"), time: "14:00" },
  { id: 2, title: "Team Building Event", date: format(addDays(new Date(), 3), "yyyy-MM-dd"), time: "10:00" },
  { id: 3, title: "Project Deadline", date: format(addDays(new Date(), 5), "yyyy-MM-dd"), time: "18:00" },
]

// Add this after the sampleAppointments
const sampleLeisureActivities: LeisureActivity[] = [
  { id: 1, activity: "Movie Night", date: format(addDays(new Date(), 2), "yyyy-MM-dd") },
  { id: 2, activity: "Picnic in the Park", date: format(addDays(new Date(), 4), "yyyy-MM-dd") },
  { id: 3, activity: "Beach Day", date: format(addDays(new Date(), 6), "yyyy-MM-dd") },
]

const sampleFitnessActivities: FitnessActivity[] = [
  { id: 1, activity: "Morning Run", date: format(addDays(new Date(), 1), "yyyy-MM-dd") },
  { id: 2, activity: "Yoga Class", date: format(addDays(new Date(), 3), "yyyy-MM-dd") },
  { id: 3, activity: "Gym Workout", date: format(addDays(new Date(), 5), "yyyy-MM-dd") },
]

// Define sampleTasks
const sampleTasks: { [key: string]: { id: number; text: string; completed: boolean }[] } = {
  Monday: [
    { id: 1, text: "Grocery Shopping", completed: false },
    { id: 2, text: "Pay Bills", completed: false },
  ],
  Tuesday: [{ id: 3, text: "Doctor's Appointment", completed: false }],
  Wednesday: [{ id: 4, text: "Book Club Meeting", completed: false }],
  Thursday: [{ id: 5, text: "Laundry", completed: false }],
  Friday: [{ id: 6, text: "Dinner with Friends", completed: false }],
  Saturday: [{ id: 7, text: "Weekend Getaway", completed: false }],
  Sunday: [{ id: 8, text: "Relax and Recharge", completed: false }],
}

const isCurrentDay = (day: string) => {
  return day === format(new Date(), "EEEE")
}

export default function WeeklyTaskManager() {
  const [currentDay, setCurrentDay] = useState<string>("")
  const [days, setDays] = useState<string[]>([])
  const [tasks, setTasks] = useState<DayTasks>({})
  const [focusedDayIndex, setFocusedDayIndex] = useState(0)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  // Add this to the component's state
  const [leisureActivities, setLeisureActivities] = useState<LeisureActivity[]>([])
  const [fitnessActivities, setFitnessActivities] = useState<FitnessActivity[]>([])
  // Add this new state variable
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const storedTodos = localStorage.getItem("todos")
    if (storedTodos) {
      const todos: Todo[] = JSON.parse(storedTodos)
      const tasksByDay: DayTasks = {}
      todos.forEach((todo) => {
        const day = format(parseISO(todo.dueDate), "EEEE")
        if (!tasksByDay[day]) {
          tasksByDay[day] = []
        }
        tasksByDay[day].push({
          id: todo.id,
          text: todo.text,
          completed: todo.completed,
        })
      })
      setTasks(tasksByDay)
    }
  }, []) // Empty dependency array to run only once

  useEffect(() => {
    const now = new Date()
    const dayIndex = now.getDay()
    const todayName = allDays[dayIndex === 0 ? 6 : dayIndex - 1] // Adjust for Sunday
    setCurrentDay(todayName)

    // Reorder days to start from current day
    const reorderedDays = [
      ...allDays.slice(dayIndex === 0 ? 6 : dayIndex - 1),
      ...allDays.slice(0, dayIndex === 0 ? 6 : dayIndex - 1),
    ]
    setDays(reorderedDays.slice(0, 7)) // Take all 7 days

    // Initialize tasks state with sample data
    const initialTasks: DayTasks = {}
    reorderedDays.slice(0, 7).forEach((day, index) => {
      const date = addDays(startOfWeek(now, { weekStartsOn: 1 }), index)
      const dayName = format(date, "EEEE") as keyof typeof sampleTasks
      initialTasks[day] = sampleTasks[dayName].map((task) => ({
        ...task,
        id: Date.now() + task.id, // Ensure unique IDs
      }))
    })
    setTasks((prevTasks) => ({ ...prevTasks, ...initialTasks }))

    // Load appointments from localStorage
    const storedAppointments = localStorage.getItem("appointments")
    if (storedAppointments) {
      setAppointments(JSON.parse(storedAppointments))
    } else {
      setAppointments(sampleAppointments)
      localStorage.setItem("appointments", JSON.stringify(sampleAppointments))
    }

    // Set leisure and fitness activities
    setLeisureActivities(sampleLeisureActivities)
    setFitnessActivities(sampleFitnessActivities)
  }, []) // Empty dependency array to run only once

  useEffect(() => {
    localStorage.setItem("appointments", JSON.stringify(appointments))
  }, [appointments])

  const addTask = useCallback(
    (day: string) => {
      const taskName = `New Task ${tasks[day]?.length + 1 || 1}`
      const newTask = {
        id: Date.now(),
        text: taskName,
        completed: false,
        dueDate: format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), days.indexOf(day)), "yyyy-MM-dd"),
        isOverdue: false,
      }
      setTasks((prev) => ({
        ...prev,
        [day]: [...(prev[day] || []), newTask],
      }))
      const storedTodos = JSON.parse(localStorage.getItem("todos") || "[]")
      localStorage.setItem("todos", JSON.stringify([...storedTodos, newTask]))
    },
    [tasks, days],
  )

  const toggleTask = useCallback((day: string, taskId: number) => {
    setTasks((prev) => ({
      ...prev,
      [day]: prev[day].map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
    }))
    const storedTodos = JSON.parse(localStorage.getItem("todos") || "[]")
    const updatedTodos = storedTodos.map((todo: Todo) =>
      todo.id === taskId ? { ...todo, completed: !todo.completed } : todo,
    )
    localStorage.setItem("todos", JSON.stringify(updatedTodos))
  }, [])

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

  return (
    <div className="container mx-auto p-4 pb-24">
      <Card className="bg-[#141415] border border-gray-700 mb-4 mt-2 p-2 w-full">
        <CardContent className="p-0">
          <div className="flex justify-between items-center text-white">
            <div className="flex items-center space-x-4">
              <Link href="/calendar">
                <CalendarDays className="h-5 w-5 cursor-pointer hover:text-blue-400" />
              </Link>
              <Link href="/appointments">
                <Clock className="h-5 w-5 cursor-pointer hover:text-blue-400" />
              </Link>
              <Link href="/expenses">
                <DollarSign className="h-5 w-5 text-green-400 cursor-pointer hover:text-green-300" />
              </Link>
              <Link href="/leisure">
                <Sun className="h-5 w-5 text-yellow-400 cursor-pointer hover:text-yellow-300" />
              </Link>
              <Link href="/meal-planning">
                <Utensils className="h-5 w-5 text-orange-400 cursor-pointer hover:text-orange-300" />
              </Link>
              <Link href="/fitness">
                <Dumbbell className="h-5 w-5 text-green-400 cursor-pointer hover:text-green-300" />
              </Link>
              <Link href="/birthdays">
                <Cake className="h-5 w-5 text-pink-400 cursor-pointer hover:text-pink-300" />
              </Link>
              <Link href="/routines">
                <Repeat className="h-5 w-5 text-purple-400 cursor-pointer hover:text-purple-300" />
              </Link>
              <Link href="/todo">
                <CheckSquare className="h-5 w-5 text-indigo-400 cursor-pointer hover:text-indigo-300" />
              </Link>
              <Link href="/goals">
                <Target className="h-5 w-5 text-red-400 cursor-pointer hover:text-red-300" />
              </Link>
              <Link href="/peersync">
                <Users className="h-5 w-5 text-blue-400 cursor-pointer hover:text-blue-300" />
              </Link>
              <Link href="/brainstorming">
                <Lightbulb className="h-5 w-5 text-yellow-400 cursor-pointer hover:text-yellow-300" />
              </Link>
              <Link href="/travel">
                <Plane className="h-5 w-5 text-purple-400 cursor-pointer hover:text-purple-300" />
              </Link>
              <Link href="/work-clock">
                <ClockIcon className="h-5 w-5 text-blue-400 cursor-pointer hover:text-blue-300" />
              </Link>
              <Link href="/notes">
                <StickyNote className="h-5 w-5 text-yellow-400 cursor-pointer hover:text-yellow-300" />
              </Link>
              <Link href="/journal">
                <BookOpen className="h-5 w-5 text-green-400 cursor-pointer hover:text-green-300" />
              </Link>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigateDay("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={goToToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigateDay("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Focused day - always in the first column */}
        <Card
          className={`
            bg-[#141415]
            ${
              appointments.some(
                (apt) =>
                  format(new Date(apt.date), "yyyy-MM-dd") ===
                  format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), days.indexOf(focusedDay)), "yyyy-MM-dd"),
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
                      format(new Date(apt.date), "yyyy-MM-dd") ===
                      format(
                        addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), days.indexOf(focusedDay)),
                        "yyyy-MM-dd",
                      ),
                  ) && <Clock className="h-5 w-5 text-red-500" />}
                  {leisureActivities.some(
                    (activity) =>
                      format(new Date(activity.date), "yyyy-MM-dd") ===
                      format(
                        addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), days.indexOf(focusedDay)),
                        "yyyy-MM-dd",
                      ),
                  ) && <Sun className="h-5 w-5 text-yellow-400" />}
                  {fitnessActivities.some(
                    (activity) =>
                      format(new Date(activity.date), "yyyy-MM-dd") ===
                      format(
                        addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), days.indexOf(focusedDay)),
                        "yyyy-MM-dd",
                      ),
                  ) && <Dumbbell className="h-5 w-5 text-green-400" />}
                </div>
                <span className="text-xs text-gray-300">
                  {format(
                    addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), days.indexOf(focusedDay)),
                    "MMM d, yyyy",
                  )}
                </span>
              </CardTitle>
            </CardHeader>
            {/* Add this to the focused day card content to display leisure activities: */}
            <CardContent className="p-2 space-y-4">
              <div className="space-y-2">
                {tasks[focusedDay]?.map((task) => (
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
                      {task.text}
                    </label>
                  </div>
                ))}
              </div>
              {appointments.some(
                (apt) =>
                  format(new Date(apt.date), "yyyy-MM-dd") ===
                  format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), days.indexOf(focusedDay)), "yyyy-MM-dd"),
              ) && (
                <div className="mt-4">
                  <h3 className="text-red-500 font-semibold mb-2">Appointments:</h3>
                  <ul className="list-disc list-inside">
                    {appointments
                      .filter(
                        (apt) =>
                          format(new Date(apt.date), "yyyy-MM-dd") ===
                          format(
                            addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), days.indexOf(focusedDay)),
                            "yyyy-MM-dd",
                          ),
                      )
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
                (activity) =>
                  format(new Date(activity.date), "yyyy-MM-dd") ===
                  format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), days.indexOf(focusedDay)), "yyyy-MM-dd"),
              ) && (
                <div className="mt-4">
                  <h3 className="text-yellow-400 font-semibold mb-2">Leisure Activities:</h3>
                  <ul className="list-disc list-inside">
                    {leisureActivities
                      .filter(
                        (activity) =>
                          format(new Date(activity.date), "yyyy-MM-dd") ===
                          format(
                            addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), days.indexOf(focusedDay)),
                            "yyyy-MM-dd",
                          ),
                      )
                      .map((activity) => (
                        <li key={activity.id} className="text-white">
                          {activity.activity}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              {fitnessActivities.some(
                (activity) =>
                  format(new Date(activity.date), "yyyy-MM-dd") ===
                  format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), days.indexOf(focusedDay)), "yyyy-MM-dd"),
              ) && (
                <div className="mt-4">
                  <h3 className="text-green-400 font-semibold mb-2">Fitness Activities:</h3>
                  <ul className="list-disc list-inside">
                    {fitnessActivities
                      .filter(
                        (activity) =>
                          format(new Date(activity.date), "yyyy-MM-dd") ===
                          format(
                            addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), days.indexOf(focusedDay)),
                            "yyyy-MM-dd",
                          ),
                      )
                      .map((activity) => (
                        <li key={activity.id} className="text-white">
                          {activity.activity}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              <Button onClick={() => addTask(focusedDay)} className="w-full">
                Add Task
              </Button>
            </CardContent>
          </div>
        </Card>

        {/* Other days - in the third column */}
        <div className="space-y-4">
          {days
            .filter((day) => day !== focusedDay)
            .map((day) => (
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
                            format(new Date(apt.date), "yyyy-MM-dd") ===
                            format(
                              addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), days.indexOf(day)),
                              "yyyy-MM-dd",
                            ),
                        ) && <Clock className="h-4 w-4 text-red-500 mr-2" />}
                        {leisureActivities.some(
                          (activity) =>
                            format(new Date(activity.date), "yyyy-MM-dd") ===
                            format(
                              addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), days.indexOf(day)),
                              "yyyy-MM-dd",
                            ),
                        ) && <Sun className="h-4 w-4 text-yellow-400 mr-2" />}
                        {fitnessActivities.some(
                          (activity) =>
                            format(new Date(activity.date), "yyyy-MM-dd") ===
                            format(
                              addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), days.indexOf(day)),
                              "yyyy-MM-dd",
                            ),
                        ) && <Dumbbell className="h-4 w-4 text-green-400 mr-2" />}
                        {day.toUpperCase()}
                      </div>
                      <span className="text-xs text-gray-300">
                        {format(
                          addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), days.indexOf(day)),
                          "MMM d, yyyy",
                        )}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-1">
                    <p className="text-sm text-gray-400 flex items-center justify-center h-full">
                      {tasks[day]?.length || 0} task(s)
                    </p>
                  </CardContent>
                </div>
              </Card>
            ))}
        </div>
      </div>
      <p className="text-center text-xs text-gray-500 mt-8">Developed by JOR powered by Covion Studio</p>
      <nav className="fixed bottom-0 left-0 w-full bg-[#18181A] border-t border-gray-800 z-50 flex justify-center items-center py-2">
        <div className="flex justify-between w-full max-w-md px-8">
          <Link href="/" className="flex flex-col items-center text-gray-300 hover:text-blue-400 transition">
            <Home className="h-6 w-6 mb-1" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/auth" className="flex flex-col items-center text-gray-300 hover:text-blue-400 transition">
            <UserIcon className="h-6 w-6 mb-1" />
            <span className="text-xs">Account</span>
          </Link>
          <Link href="/settings" className="flex flex-col items-center text-gray-300 hover:text-blue-400 transition">
            <Settings className="h-6 w-6 mb-1" />
            <span className="text-xs">Settings</span>
          </Link>
          <button onClick={() => alert('Sign out logic goes here!')} className="flex flex-col items-center text-gray-300 hover:text-red-400 transition focus:outline-none">
            <LogOut className="h-6 w-6 mb-1" />
            <span className="text-xs">Sign Out</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

