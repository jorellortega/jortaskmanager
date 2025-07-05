"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
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
} from "date-fns"
import { supabase } from "@/lib/supabaseClient"

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [newEvent, setNewEvent] = useState({ title: "", description: "", event_time: "" })
  const [editingEvent, setEditingEvent] = useState<any | null>(null)
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"))
  const minutes = ["00", "15", "30", "45"]
  const ampm = ["AM", "PM"]

  function parseTimeString(timeStr: string) {
    if (!timeStr) return { hour: "12", minute: "00", ampm: "AM" }
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (!match) return { hour: "12", minute: "00", ampm: "AM" }
    return { hour: match[1].padStart(2, "0"), minute: match[2], ampm: match[3].toUpperCase() }
  }

  const [timeParts, setTimeParts] = useState(parseTimeString(newEvent.event_time))

  useEffect(() => {
    setTimeParts(parseTimeString(newEvent.event_time))
  }, [editingEvent])

  const handleTimeChange = (part: "hour" | "minute" | "ampm", value: string) => {
    const updated = { ...timeParts, [part]: value }
    setTimeParts(updated)
    setNewEvent((prev) => ({ ...prev, event_time: `${updated.hour}:${updated.minute} ${updated.ampm}` }))
  }

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setNewEvent({ title: "", description: "", event_time: "" })
    setEditingEvent(null)
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view calendar events.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      const { data, error: fetchError } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .order("event_date", { ascending: true })
      if (fetchError) {
        setError("Failed to fetch events.")
      } else {
        setEvents(data || [])
      }
      setLoading(false)
    }
    fetchEvents()
    // eslint-disable-next-line
  }, [])

  const handleAddEvent = async () => {
    if (!userId || !selectedDate || !newEvent.title) return
    setLoading(true)
    setError(null)
    const { data, error: insertError } = await supabase
      .from("calendar_events")
      .insert([
        {
          user_id: userId,
          title: newEvent.title,
          description: newEvent.description,
          event_date: format(selectedDate, "yyyy-MM-dd"),
          event_time: newEvent.event_time || null,
        },
      ])
      .select()
    if (insertError) {
      setError(insertError.message || "Failed to add event.")
    } else if (data && data.length > 0) {
      setEvents((prev) => [...prev, data[0]])
      setNewEvent({ title: "", description: "", event_time: "" })
      setSelectedDate(null)
    }
    setLoading(false)
  }

  const handleDeleteEvent = async (id: string) => {
    setLoading(true)
    setError(null)
    const { error: deleteError } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", id)
    if (deleteError) {
      setError(deleteError.message || "Failed to delete event.")
    } else {
      setEvents((prev) => prev.filter((e) => e.id !== id))
    }
    setLoading(false)
  }

  const handleEditEvent = (event: any) => {
    setEditingEvent(event)
    setNewEvent({
      title: event.title,
      description: event.description || "",
      event_time: event.event_time || "",
    })
  }

  const handleUpdateEvent = async () => {
    if (!editingEvent) return
    setLoading(true)
    setError(null)
    const { data, error: updateError } = await supabase
      .from("calendar_events")
      .update({
        title: newEvent.title,
        description: newEvent.description,
        event_time: newEvent.event_time || null,
      })
      .eq("id", editingEvent.id)
      .select()
    if (updateError) {
      setError(updateError.message || "Failed to update event.")
    } else if (data && data.length > 0) {
      setEvents((prev) => prev.map((e) => (e.id === editingEvent.id ? data[0] : e)))
      setEditingEvent(null)
      setSelectedDate(null)
      setNewEvent({ title: "", description: "", event_time: "" })
    }
    setLoading(false)
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
              const dayEvents = events.filter(
                (e) => e.event_date === format(day, "yyyy-MM-dd")
              )
              return (
                <div
                  key={day.toString()}
                  className={`text-center p-2 rounded cursor-pointer min-h-[48px] flex flex-col items-center justify-start ${
                    !isSameMonth(day, currentMonth)
                      ? "text-gray-400"
                      : isToday(day)
                        ? "bg-blue-600 text-white"
                        : "text-white hover:bg-gray-700"
                  }`}
                  onClick={() => handleDateClick(day)}
                >
                  <span>{format(day, "d")}</span>
                  {dayEvents.length > 0 && (
                    <span className="text-xs mt-1 bg-gray-800 px-2 py-0.5 rounded-full">
                      {dayEvents.length} event{dayEvents.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          {selectedDate && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">{format(selectedDate, "MMMM d, yyyy")}</h3>
              <ul className="mb-4">
                {events
                  .filter((e) => e.event_date === format(selectedDate, "yyyy-MM-dd"))
                  .map((event) => (
                    <li key={event.id} className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between bg-[#1A1A1B] p-2 rounded">
                      <div>
                        <span className="font-semibold">{event.title}</span>
                        {event.event_time && (
                          <span className="ml-2 text-xs text-blue-300">{event.event_time}</span>
                        )}
                        {event.description && (
                          <div className="text-xs text-gray-400 mt-1">{event.description}</div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2 md:mt-0">
                        <Button size="sm" variant="outline" onClick={() => handleEditEvent(event)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteEvent(event.id)}>
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
              </ul>
              {editingEvent ? (
                <div className="mb-2">
                  <input
                    className="w-full p-2 mb-2 rounded bg-[#18181A] border border-gray-700 text-white"
                    placeholder="Event Title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  <input
                    className="w-full p-2 mb-2 rounded bg-[#18181A] border border-gray-700 text-white"
                    placeholder="Description (optional)"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
                  />
                  <div className="flex gap-2 mb-2">
                    <select
                      className="p-2 rounded bg-[#18181A] border border-gray-700 text-white"
                      value={timeParts.hour}
                      onChange={(e) => handleTimeChange("hour", e.target.value)}
                    >
                      {hours.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <span className="self-center">:</span>
                    <select
                      className="p-2 rounded bg-[#18181A] border border-gray-700 text-white"
                      value={timeParts.minute}
                      onChange={(e) => handleTimeChange("minute", e.target.value)}
                    >
                      {minutes.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      className="p-2 rounded bg-[#18181A] border border-gray-700 text-white"
                      value={timeParts.ampm}
                      onChange={(e) => handleTimeChange("ampm", e.target.value)}
                    >
                      {ampm.map((ap) => (
                        <option key={ap} value={ap}>{ap}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdateEvent}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingEvent(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-2">
                  <input
                    className="w-full p-2 mb-2 rounded bg-[#18181A] border border-gray-700 text-white"
                    placeholder="Event Title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  <input
                    className="w-full p-2 mb-2 rounded bg-[#18181A] border border-gray-700 text-white"
                    placeholder="Description (optional)"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
                  />
                  <div className="flex gap-2 mb-2">
                    <select
                      className="p-2 rounded bg-[#18181A] border border-gray-700 text-white"
                      value={timeParts.hour}
                      onChange={(e) => handleTimeChange("hour", e.target.value)}
                    >
                      {hours.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <span className="self-center">:</span>
                    <select
                      className="p-2 rounded bg-[#18181A] border border-gray-700 text-white"
                      value={timeParts.minute}
                      onChange={(e) => handleTimeChange("minute", e.target.value)}
                    >
                      {minutes.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      className="p-2 rounded bg-[#18181A] border border-gray-700 text-white"
                      value={timeParts.ampm}
                      onChange={(e) => handleTimeChange("ampm", e.target.value)}
                    >
                      {ampm.map((ap) => (
                        <option key={ap} value={ap}>{ap}</option>
                      ))}
                    </select>
                  </div>
                  <Button size="sm" className="w-full" onClick={handleAddEvent}>
                    Add Event
                  </Button>
                </div>
              )}
              <Button onClick={() => { setSelectedDate(null); setEditingEvent(null); }} className="mt-2" variant="outline">
                Close
              </Button>
              {error && <div className="bg-red-900 text-red-200 p-2 mt-2 rounded">{error}</div>}
              {loading && <div className="text-blue-300 mt-2">Loading...</div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

