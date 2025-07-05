"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Save, Plus } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

type Routine = {
  id: string
  user_id: string
  title: string
  description: string | null
  frequency: "daily" | "weekly" | "monthly" | "yearly"
  completed: boolean
  created_at?: string
}

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [newRoutine, setNewRoutine] = useState<{ title: string; description: string; frequency: "daily" | "weekly" | "monthly" | "yearly" }>({ title: "", description: "", frequency: "daily" })
  const [isExpanded, setIsExpanded] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedRoutine, setEditedRoutine] = useState<Routine | null>(null)
  const [activeFrequency, setActiveFrequency] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchRoutines = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view routines.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      const { data, error: fetchError } = await supabase
        .from("routines")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
      if (fetchError) {
        setError("Failed to fetch routines.")
      } else {
        setRoutines(data || [])
      }
      setLoading(false)
    }
    fetchRoutines()
  }, [])

  const addRoutine = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!userId) {
      setError("You must be logged in to add routines.")
      return
    }
    if (newRoutine.title) {
      setLoading(true)
      const { data, error: insertError } = await supabase
        .from("routines")
        .insert([
          {
            user_id: userId,
            title: newRoutine.title,
            description: newRoutine.description,
            frequency: newRoutine.frequency,
            completed: false,
          },
        ])
        .select()
      if (insertError) {
        setError(insertError.message || "Failed to add routine. Please try again.")
      } else if (data && data.length > 0) {
        setRoutines((prev) => [...prev, data[0]])
        setNewRoutine({ title: "", description: "", frequency: "daily" })
      }
      setLoading(false)
    }
  }

  const handleEdit = (routine: Routine) => {
    setEditingId(routine.id)
    setEditedRoutine(routine)
  }

  const handleSave = async () => {
    if (!editedRoutine) return
    setError(null)
    setLoading(true)
    const { data, error: updateError } = await supabase
      .from("routines")
      .update({
        title: editedRoutine.title,
        description: editedRoutine.description,
        frequency: editedRoutine.frequency,
      })
      .eq("id", editedRoutine.id)
      .select()
    if (updateError) {
      setError(updateError.message || "Failed to update routine.")
    } else if (data && data.length > 0) {
      setRoutines((prev) => prev.map((r) => r.id === editedRoutine.id ? data[0] : r))
      setEditingId(null)
      setEditedRoutine(null)
    }
    setLoading(false)
  }

  const toggleRoutineCompletion = async (id: string, completed: boolean) => {
    setError(null)
    setLoading(true)
    const { data, error: updateError } = await supabase
      .from("routines")
      .update({ completed: !completed })
      .eq("id", id)
      .select()
    if (updateError) {
      setError(updateError.message || "Failed to update routine.")
    } else if (data && data.length > 0) {
      setRoutines((prev) => prev.map((r) => r.id === id ? data[0] : r))
    }
    setLoading(false)
  }

  const filteredRoutines = routines.filter((routine) => routine.frequency === activeFrequency)

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4">Routines</h1>
      <Card
        className={`bg-[#141415] border border-gray-700 mb-4 text-white transition-all duration-300 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isExpanded ? "p-4" : "p-2"
        }`}
        aria-expanded={isExpanded}
        tabIndex={0}
      >
        <CardHeader
          className={`flex justify-center items-center ${isExpanded ? "" : "h-16"} cursor-pointer`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <CardTitle>Add New Routine</CardTitle>
          ) : (
            <div className="flex items-center justify-center w-full group">
              <CardTitle className="text-2xl font-bold mr-2">ROUTINES</CardTitle>
              <Plus className="h-8 w-8 text-green-400 opacity-0 scale-75 transition-all duration-200 group-hover:opacity-100 group-hover:scale-125 group-hover:text-green-300" />
            </div>
          )}
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <form onSubmit={addRoutine} className="space-y-4">
              <div>
                <Label htmlFor="title">Routine Title</Label>
                <Input
                  id="title"
                  value={newRoutine.title}
                  onChange={(e) => setNewRoutine({ ...newRoutine, title: e.target.value })}
                  className="bg-[#1A1A1B] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newRoutine.description || ""}
                  onChange={(e) => setNewRoutine({ ...newRoutine, description: e.target.value }) }
                  className="bg-[#1A1A1B] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <select
                  id="frequency"
                  value={newRoutine.frequency}
                  onChange={(e) =>
                    setNewRoutine({
                      ...newRoutine,
                      frequency: e.target.value as "daily" | "weekly" | "monthly" | "yearly",
                    })
                  }
                  className="w-full bg-[#1A1A1B] border-gray-700 text-white rounded-md"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <Button type="submit">Add Routine</Button>
            </form>
          </CardContent>
        )}
      </Card>
      <Card className="bg-[#141415] border border-gray-700">
        <CardHeader className="text-white">
          <Tabs
            defaultValue="daily"
            className="w-full"
            onValueChange={(value) => setActiveFrequency(value as "daily" | "weekly" | "monthly" | "yearly")}
          >
            <TabsList className="grid w-full grid-cols-4 bg-[#141415]">
              <TabsTrigger
                value="daily"
                className="data-[state=active]:bg-[#1A1A1B] data-[state=active]:text-white text-gray-500 hover:text-gray-300"
              >
                Daily
              </TabsTrigger>
              <TabsTrigger
                value="weekly"
                className="data-[state=active]:bg-[#1A1A1B] data-[state=active]:text-white text-gray-500 hover:text-gray-300"
              >
                Weekly
              </TabsTrigger>
              <TabsTrigger
                value="monthly"
                className="data-[state=active]:bg-[#1A1A1B] data-[state=active]:text-white text-gray-500 hover:text-gray-300"
              >
                Monthly
              </TabsTrigger>
              <TabsTrigger
                value="yearly"
                className="data-[state=active]:bg-[#1A1A1B] data-[state=active]:text-white text-gray-500 hover:text-gray-300"
              >
                Yearly
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-white">
            {filteredRoutines.map((routine) => (
              <li
                key={routine.id}
                className="bg-[#1A1A1B] p-2 rounded flex items-center text-white transition-opacity duration-200"
                aria-label={`${routine.title}${routine.completed ? " (completed)" : ""}`}
              >
                <Checkbox
                  checked={routine.completed}
                  onCheckedChange={() => toggleRoutineCompletion(routine.id, routine.completed)}
                  className={`mr-2 transition-all duration-200 border-2 ${
                    routine.completed ? "border-transparent opacity-10" : "border-white"
                  }`}
                  style={{ backgroundColor: routine.completed ? "white" : "transparent" }}
                />
                {editingId === routine.id ? (
                  <>
                    <Input
                      value={editedRoutine?.title || ""}
                      onChange={(e) => setEditedRoutine({ ...editedRoutine!, title: e.target.value })}
                      className="bg-[#2A2A2B] border-gray-700 text-white mr-2"
                    />
                    <Button onClick={handleSave} size="sm" className="p-1">
                      <Save className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className={`flex-grow ${routine.completed ? "opacity-10" : ""}`}>
                      <strong>{routine.title}</strong>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

