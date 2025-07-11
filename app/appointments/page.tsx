"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { supabase } from "@/lib/supabaseClient"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Trash2, Edit2, Check, X } from "lucide-react";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

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

  const startEdit = (apt: Appointment) => {
    setEditingId(apt.id);
    setEditTitle(apt.title);
    setEditDate(apt.date);
    setEditTime(apt.time);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDate("");
    setEditTime("");
  };

  const saveEdit = async (id: string) => {
    setError(null);
    setLoading(true);
    const { data, error: updateError } = await supabase
      .from("appointments")
      .update({ title: editTitle, date: editDate, time: editTime })
      .eq("id", id)
      .select();
    if (updateError) {
      setError(updateError.message || "Failed to update appointment.");
    } else if (data && data.length > 0) {
      setAppointments((prev) => prev.map((apt) => (apt.id === id ? data[0] : apt)));
      cancelEdit();
    }
    setLoading(false);
  };

  const deleteAppointment = async (id: string) => {
    setError(null);
    setLoading(true);
    const { error: deleteError } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);
    if (deleteError) {
      setError(deleteError.message || "Failed to delete appointment.");
    } else {
      setAppointments((prev) => prev.filter((apt) => apt.id !== id));
      if (editingId === id) cancelEdit();
    }
    setLoading(false);
  };

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
                <SelectContent className="dark:bg-[#18181b] dark:text-white bg-[#18181b] text-white">
                  {timeOptions.map(({ display, value }) => (
                    <SelectItem key={value} value={value} className="dark:bg-[#18181b] dark:text-white bg-[#18181b] text-white">
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
                <li key={appointment.id} className="bg-[#1A1A1B] p-2 rounded !text-white flex items-center justify-between gap-2">
                  {editingId === appointment.id ? (
                    <>
                      <div className="flex flex-col gap-1 flex-1">
                        <Input
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="mb-1 bg-[#232325] !text-white"
                        />
                        <div className="flex gap-2">
                          <Input
                            type="date"
                            value={editDate}
                            onChange={e => setEditDate(e.target.value)}
                            className="bg-[#232325] !text-white"
                          />
                          <Select
                            value={editTime}
                            onValueChange={value => setEditTime(value)}
                          >
                            <SelectTrigger id="edit-apt-time" className="bg-[#232325] border-gray-700 !text-white w-full rounded px-3 py-2">
                              <SelectValue placeholder="Select a time" className="!text-white !placeholder:text-gray-400" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-[#18181b] dark:text-white bg-[#18181b] text-white">
                              {timeOptions.map(({ display, value }) => (
                                <SelectItem key={value} value={value} className="dark:bg-[#18181b] dark:text-white bg-[#18181b] text-white">
                                  {display}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <Button size="icon" variant="ghost" onClick={() => saveEdit(appointment.id)} title="Save" className="text-green-500 hover:text-green-700"><Check className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={cancelEdit} title="Cancel" className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteAppointment(appointment.id)} title="Delete" className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="flex-1">
                        <strong>{appointment.title}</strong> - {format(parseISO(appointment.date), "MMM d, yyyy")} at {appointment.time}
                      </span>
                      <div className="flex gap-2 ml-2">
                        <Button size="icon" variant="ghost" onClick={() => startEdit(appointment)} title="Edit" className="text-blue-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteAppointment(appointment.id)} title="Delete" className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

