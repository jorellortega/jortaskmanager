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

export type Appointment = {
  id: number
  title: string
  date: string
  time: string
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [newAppointment, setNewAppointment] = useState({ title: "", date: "", time: "" })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const storedAppointments = localStorage.getItem("appointments")
      if (storedAppointments) {
        setAppointments(JSON.parse(storedAppointments))
      }
    } catch (err) {
      console.error("Error loading appointments:", err)
      setError("Failed to load appointments. Please try refreshing the page.")
    }
  }, [])

  const addAppointment = (e: React.FormEvent) => {
    e.preventDefault()
    if (newAppointment.title && newAppointment.date && newAppointment.time) {
      try {
        const updatedAppointments = [...appointments, { id: Date.now(), ...newAppointment }]
        setAppointments(updatedAppointments)
        localStorage.setItem("appointments", JSON.stringify(updatedAppointments))
        setNewAppointment({ title: "", date: "", time: "" })
      } catch (err) {
        console.error("Error adding appointment:", err)
        setError("Failed to add appointment. Please try again.")
      }
    }
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto p-4 bg-black min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4">Appointments</h1>
      <Card className="bg-gray-800 border border-gray-700 mb-4 p-4">
        <CardHeader>
          <CardTitle>Add New Appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addAppointment} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newAppointment.title}
                onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                className="bg-gray-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newAppointment.date}
                onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                className="bg-gray-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={newAppointment.time}
                onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                className="bg-gray-700 text-white"
              />
            </div>
            <Button type="submit">Add Appointment</Button>
          </form>
        </CardContent>
      </Card>
      <Card className="bg-gray-800 border border-gray-700">
        <CardHeader>
          <CardTitle>Your Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p>No appointments scheduled.</p>
          ) : (
            <ul className="space-y-2">
              {appointments.map((appointment) => (
                <li key={appointment.id} className="bg-gray-700 p-2 rounded">
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

