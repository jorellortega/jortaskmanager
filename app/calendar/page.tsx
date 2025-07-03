"use client"

import { useState } from "react"
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

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

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
            {monthDays.map((day, index) => (
              <div
                key={day.toString()}
                className={`text-center p-2 rounded cursor-pointer ${
                  !isSameMonth(day, currentMonth)
                    ? "text-gray-400"
                    : isToday(day)
                      ? "bg-blue-600 text-white"
                      : "text-white hover:bg-gray-700"
                }`}
                onClick={() => handleDateClick(day)}
              >
                {format(day, "d")}
              </div>
            ))}
          </div>
          {selectedDate && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">{format(selectedDate, "MMMM d, yyyy")}</h3>
              <p>Add your expanded view content here</p>
              <Button onClick={() => setSelectedDate(null)} className="mt-2" variant="outline">
                Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

