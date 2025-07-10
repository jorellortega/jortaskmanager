"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, Play, Square } from "lucide-react"
import Link from "next/link"
import { format, differenceInSeconds } from "date-fns"
import { supabase } from "@/lib/supabaseClient"

type WorkSession = {
  id: string
  user_id: string
  clock_in: string
  clock_out: string | null
  created_at: string
}

export default function WorkClockPage() {
  const [isClockingIn, setIsClockingIn] = useState(false)
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null)
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([])
  const [elapsedTime, setElapsedTime] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view work sessions.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      const { data, error: fetchError } = await supabase
        .from("work_clock")
        .select("*")
        .eq("user_id", user.id)
        .order("clock_in", { ascending: false })
      if (fetchError) {
        setError("Failed to fetch work sessions.")
      } else {
        setWorkSessions(data || [])
        // Find any open session
        const openSession = (data || []).find((s: WorkSession) => !s.clock_out)
        if (openSession) {
          setCurrentSession(openSession)
          setIsClockingIn(true)
          const startTime = new Date(openSession.clock_in).getTime()
          const now = new Date().getTime()
          setElapsedTime(Math.floor((now - startTime) / 1000))
        }
      }
      setLoading(false)
    }
    fetchSessions()
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    if (isClockingIn && currentSession) {
      intervalRef.current = setInterval(() => {
        const startTime = new Date(currentSession.clock_in).getTime()
        const now = new Date().getTime()
        setElapsedTime(Math.floor((now - startTime) / 1000))
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isClockingIn, currentSession])

  const handleClockIn = async () => {
    setError(null)
    if (!userId) {
      setError("You must be logged in to clock in.")
      return
    }
    setLoading(true)
    const now = new Date().toISOString()
    const { data, error: insertError } = await supabase
      .from("work_clock")
      .insert([
        {
          user_id: userId,
          clock_in: now,
        },
      ])
      .select()
    if (insertError) {
      setError(insertError.message || "Failed to clock in.")
    } else if (data && data.length > 0) {
      setCurrentSession(data[0])
      setIsClockingIn(true)
      setElapsedTime(0)
    }
    setLoading(false)
  }

  const handleClockOut = async () => {
    if (!currentSession) return
    setError(null)
    setLoading(true)
    const now = new Date().toISOString()
    const { data, error: updateError } = await supabase
      .from("work_clock")
      .update({ clock_out: now })
      .eq("id", currentSession.id)
      .select()
    if (updateError) {
      setError(updateError.message || "Failed to clock out.")
    } else if (data && data.length > 0) {
      setWorkSessions((prev) => [data[0], ...prev.filter((s) => s.id !== currentSession.id)])
      setCurrentSession(null)
      setIsClockingIn(false)
      setElapsedTime(0)
    }
    setLoading(false)
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
      if (session.clock_in && session.clock_out) {
        return total + differenceInSeconds(new Date(session.clock_out), new Date(session.clock_in))
      }
      return total
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
          <CardTitle className="!text-white">Clock In/Out</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <h2 className="text-3xl font-bold !text-white">{formatTime(elapsedTime)}</h2>
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
          <CardTitle className="!text-white">Work Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg mb-2 !text-white">Total Hours Worked: {getTotalHours()} hours</p>
          <p className="text-lg !text-white">Total Days Worked: {workSessions.length} days</p>
        </CardContent>
      </Card>
      <Card className="bg-[#141415] border border-gray-700">
        <CardHeader>
          <CardTitle className="!text-white">Work History</CardTitle>
        </CardHeader>
        <CardContent>
          {workSessions.length === 0 ? (
            <p className="!text-white">No work sessions recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {workSessions.map((session) => {
                const duration = session.clock_in && session.clock_out
                  ? differenceInSeconds(new Date(session.clock_out), new Date(session.clock_in))
                  : null
                return (
                  <li key={session.id} className="flex justify-between items-center bg-[#1A1A1B] p-2 rounded !text-white">
                    <div>
                      <p className="font-semibold !text-white">{format(new Date(session.clock_in), "MMM d, yyyy")}</p>
                      <p className="text-sm !text-white">
                        {format(new Date(session.clock_in), "hh:mm a")} -{" "}
                        {session.clock_out ? format(new Date(session.clock_out), "hh:mm a") : "In Progress"}
                      </p>
                    </div>
                    <p className="font-bold !text-white">
                      {duration ? `${(duration / 3600).toFixed(2)} hours` : "In Progress"}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
      {error && <div className="bg-red-900 text-red-200 p-2 mb-4 rounded">{error}</div>}
      {loading && <div className="text-blue-300 mb-2">Loading...</div>}
    </div>
  )
}

