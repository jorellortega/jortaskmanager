"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { supabase } from "@/lib/supabaseClient"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export type Appointment = {
  id: string
  user_id: string
  title: string
  date: string
  time: string
  created_at?: string
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [newAppointment, setNewAppointment] = useState({ title: "", date: "", time: "" })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Generate time options in 30-minute intervals, display as 12-hour with AM/PM, value as 24-hour HH:MM:SS
  const timeOptions = Array.from({ length: 24 * 2 }, (_, i) => {
    const hour24 = Math.floor(i / 2);
    const min = i % 2 === 0 ? '00' : '30';
    const hour12 = ((hour24 + 11) % 12) + 1;
    const ampm = hour24 < 12 ? 'AM' : 'PM';
    const display = `${hour12.toString().padStart(2, '0')}:${min} ${ampm}`;
    const value = `${hour24.toString().padStart(2, '0')}:${min}:00`;
    return { display, value };
  });

  useEffect(() => {
    const getUserAndAppointments = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view appointments.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      const { data, error: fetchError } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true })
      if (fetchError) {
        setError("Failed to fetch appointments.")
      } else {
        setAppointments(data || [])
      }
      setLoading(false)
    }
    getUserAndAppointments()
  }, [])

  const addAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!userId) {
      setError("You must be logged in to add appointments.")
      return
    }
    if (newAppointment.title && newAppointment.date && newAppointment.time) {
      setLoading(true)
      // No need to reformat, already HH:MM:SS
      const { data, error: insertError } = await supabase
        .from("appointments")
        .insert([
          {
            user_id: userId,
            title: newAppointment.title,
            date: newAppointment.date,
            time: newAppointment.time,
          },
        ])
        .select()
      console.log("Insert result:", data, insertError)
      if (insertError) {
        setError(insertError.message || "Failed to add appointment. Please try again.")
      } else if (data && data.length > 0) {
        setAppointments((prev) => [...prev, data[0]])
        setNewAppointment({ title: "", date: "", time: "" })
      } else {
        setError("No data returned from Supabase. Check your table schema and required fields.")
      }
      setLoading(false)
    }
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }
  if (loading && appointments.length === 0) {
    return <div className="text-white p-4">Loading...</div>
  }

  return (
    <div className="container mx-auto p-4 bg-black min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4">Appointments</h1>
      <Card className="bg-[#141415] border border-gray-700 mb-4 p-4">
        <CardHeader>
          <CardTitle className="!text-white">Add New Appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addAppointment} className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-white">Title</Label>
              <Input
                id="title"
                value={newAppointment.title}
                onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                className="bg-[#1A1A1B] border-gray-700 !text-white !placeholder:text-gray-400"
                placeholder="Enter appointment title"
              />
            </div>
            <div>
              <Label htmlFor="date" className="text-white">Date</Label>
              <Input
                id="date"
                type="date"
                value={newAppointment.date}
                onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                className="bg-[#1A1A1B] border-gray-700 !text-white !placeholder:text-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="time" className="text-white">Time</Label>
              <Select
                value={newAppointment.time}
                onValueChange={(value) => setNewAppointment({ ...newAppointment, time: value })}
              >
                <SelectTrigger id="time" className="bg-[#1A1A1B] border-gray-700 !text-white w-full rounded px-3 py-2">
                  <SelectValue placeholder="Select a time" className="!text-white !placeholder:text-gray-400" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map(({ display, value }) => (
                    <SelectItem key={value} value={value} className="!text-white">
                      {display}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Appointment"}</Button>
          </form>
        </CardContent>
      </Card>
      <Card className="bg-[#141415] border border-gray-700">
        <CardHeader>
          <CardTitle className="!text-white">Your Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p>No appointments scheduled.</p>
          ) : (
            <ul className="space-y-2">
              {appointments.map((appointment) => (
                <li key={appointment.id} className="bg-[#1A1A1B] p-2 rounded !text-white">
                  <strong>{appointment.title}</strong> - {format(new Date(appointment.date), "MMM d, yyyy")} at{" "}
                  {appointment.time}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

