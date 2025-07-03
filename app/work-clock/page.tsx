"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, Play, Square } from "lucide-react"
import Link from "next/link"
import { format, differenceInSeconds } from "date-fns"

type WorkSession = {
  id: number
  startTime: string
  endTime: string | null
  duration: number | null
}

const mockWorkSessions: WorkSession[] = [
  {
    id: 1,
    startTime: "2024-03-15T09:00:00.000Z",
    endTime: "2024-03-15T17:00:00.000Z",
    duration: 28800, // 8 hours
  },
  {
    id: 2,
    startTime: "2024-03-16T09:30:00.000Z",
    endTime: "2024-03-16T18:00:00.000Z",
    duration: 30600, // 8.5 hours
  },
  {
    id: 3,
    startTime: "2024-03-17T10:00:00.000Z",
    endTime: "2024-03-17T16:30:00.000Z",
    duration: 23400, // 6.5 hours
  },
  {
    id: 4,
    startTime: "2024-03-18T08:45:00.000Z",
    endTime: "2024-03-18T17:15:00.000Z",
    duration: 30600, // 8.5 hours
  },
  {
    id: 5,
    startTime: "2024-03-19T09:15:00.000Z",
    endTime: "2024-03-19T17:45:00.000Z",
    duration: 30600, // 8.5 hours
  },
]

export default function WorkClockPage() {
  const [isClockingIn, setIsClockingIn] = useState(false)
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null)
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([])
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    const storedSessions = localStorage.getItem("workSessions")
    if (storedSessions) {
      setWorkSessions(JSON.parse(storedSessions))
    } else {
      setWorkSessions(mockWorkSessions)
    }

    const lastSession = JSON.parse(localStorage.getItem("currentSession") || "null")
    if (lastSession && !lastSession.endTime) {
      setCurrentSession(lastSession)
      setIsClockingIn(true)
      const startTime = new Date(lastSession.startTime).getTime()
      const now = new Date().getTime()
      setElapsedTime(Math.floor((now - startTime) / 1000))
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isClockingIn) {
      interval = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isClockingIn])

  useEffect(() => {
    localStorage.setItem("workSessions", JSON.stringify(workSessions))
  }, [workSessions])

  useEffect(() => {
    if (currentSession) {
      localStorage.setItem("currentSession", JSON.stringify(currentSession))
    } else {
      localStorage.removeItem("currentSession")
    }
  }, [currentSession])

  const handleClockIn = () => {
    const newSession: WorkSession = {
      id: Date.now(),
      startTime: new Date().toISOString(),
      endTime: null,
      duration: null,
    }
    setCurrentSession(newSession)
    setIsClockingIn(true)
    setElapsedTime(0)
  }

  const handleClockOut = () => {
    if (currentSession) {
      const endTime = new Date().toISOString()
      const updatedSession = {
        ...currentSession,
        endTime,
        duration: differenceInSeconds(new Date(endTime), new Date(currentSession.startTime)),
      }
      setWorkSessions([...workSessions, updatedSession])
      setCurrentSession(null)
      setIsClockingIn(false)
      setElapsedTime(0)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`
  }

  const getTotalHours = () => {
    const totalSeconds = workSessions.reduce((total, session) => {
      return total + (session.duration || 0)
    }, 0)
    return (totalSeconds / 3600).toFixed(2)
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4 flex items-center">
        <Clock className="mr-2" /> Work Clock
      </h1>
      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="text-white">Clock In/Out</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <h2 className="text-3xl font-bold">{formatTime(elapsedTime)}</h2>
          </div>
          {isClockingIn ? (
            <Button onClick={handleClockOut} className="w-full bg-red-500 hover:bg-red-600 text-white">
              <Square className="mr-2 h-4 w-4" /> Clock Out
            </Button>
          ) : (
            <Button onClick={handleClockIn} className="w-full bg-green-500 hover:bg-green-600 text-white">
              <Play className="mr-2 h-4 w-4" /> Clock In
            </Button>
          )}
        </CardContent>
      </Card>
      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="text-white">Work Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg mb-2">Total Hours Worked: {getTotalHours()} hours</p>
          <p className="text-lg">Total Days Worked: {workSessions.length} days</p>
        </CardContent>
      </Card>
      <Card className="bg-[#141415] border border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Work History</CardTitle>
        </CardHeader>
        <CardContent>
          {workSessions.length === 0 ? (
            <p>No work sessions recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {workSessions.map((session) => (
                <li key={session.id} className="flex justify-between items-center bg-[#1A1A1B] p-2 rounded">
                  <div>
                    <p className="font-semibold">{format(new Date(session.startTime), "MMM d, yyyy")}</p>
                    <p className="text-sm text-white">
                      {format(new Date(session.startTime), "HH:mm")} -{" "}
                      {session.endTime ? format(new Date(session.endTime), "HH:mm") : "In Progress"}
                    </p>
                  </div>
                  <p className="font-bold">
                    {session.duration ? `${(session.duration / 3600).toFixed(2)} hours` : "In Progress"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

