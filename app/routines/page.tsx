"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Save } from "lucide-react"
import Link from "next/link"

type Routine = {
  id: number
  name: string
  completed: boolean
  frequency: "daily" | "weekly" | "monthly" | "yearly"
}

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([
    { id: 1, name: "Morning Workout", completed: false, frequency: "daily" },
    { id: 2, name: "Read a Book", completed: false, frequency: "weekly" },
    { id: 3, name: "Family Game Night", completed: false, frequency: "weekly" },
    { id: 4, name: "Deep House Cleaning", completed: false, frequency: "monthly" },
  ])
  const [newRoutine, setNewRoutine] = useState({ name: "", frequency: "daily" as const })
  const [isExpanded, setIsExpanded] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editedRoutine, setEditedRoutine] = useState<Routine | null>(null)
  const [activeFrequency, setActiveFrequency] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily")

  useEffect(() => {
    const storedRoutines = localStorage.getItem("routines")
    if (storedRoutines) {
      setRoutines(JSON.parse(storedRoutines))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("routines", JSON.stringify(routines))
  }, [routines])

  const addRoutine = (e: React.FormEvent) => {
    e.preventDefault()
    if (newRoutine.name) {
      const updatedRoutines = [...routines, { id: Date.now(), ...newRoutine, completed: false }]
      setRoutines(updatedRoutines)
      setNewRoutine({ name: "", frequency: "daily" })
    }
  }

  const handleEdit = (routine: Routine) => {
    setEditingId(routine.id)
    setEditedRoutine(routine)
  }

  const handleSave = () => {
    if (editedRoutine) {
      setRoutines((prevRoutines) => prevRoutines.map((r) => (r.id === editedRoutine.id ? editedRoutine : r)))
      setEditingId(null)
      setEditedRoutine(null)
    }
  }

  const toggleRoutineCompletion = (id: number) => {
    setRoutines((prevRoutines) =>
      prevRoutines.map((routine) => (routine.id === id ? { ...routine, completed: !routine.completed } : routine)),
    )
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
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        tabIndex={0}
      >
        <CardHeader className={`flex justify-center items-center ${isExpanded ? "" : "h-16"}`}>
          {isExpanded ? (
            <CardTitle>Add New Routine</CardTitle>
          ) : (
            <CardTitle className="text-2xl font-bold">ROUTINES</CardTitle>
          )}
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <form onSubmit={addRoutine} className="space-y-4">
              <div>
                <Label htmlFor="name">Routine Name</Label>
                <Input
                  id="name"
                  value={newRoutine.name}
                  onChange={(e) => setNewRoutine({ ...newRoutine, name: e.target.value })}
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
                aria-label={`${routine.name}${routine.completed ? " (completed)" : ""}`}
              >
                <Checkbox
                  checked={routine.completed}
                  onCheckedChange={() => toggleRoutineCompletion(routine.id)}
                  className={`mr-2 transition-all duration-200 border-2 ${
                    routine.completed ? "border-transparent opacity-10" : "border-white"
                  }`}
                  style={{ backgroundColor: routine.completed ? "white" : "transparent" }}
                />
                {editingId === routine.id ? (
                  <>
                    <Input
                      value={editedRoutine?.name || ""}
                      onChange={(e) => setEditedRoutine({ ...editedRoutine!, name: e.target.value })}
                      className="bg-[#2A2A2B] border-gray-700 text-white mr-2"
                    />
                    <Button onClick={handleSave} size="sm" className="p-1">
                      <Save className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className={`flex-grow ${routine.completed ? "opacity-10" : ""}`}>
                      <strong>{routine.name}</strong>
                    </span>
                    <Button
                      onClick={() => handleEdit(routine)}
                      size="sm"
                      className="p-1 text-gray-600 hover:text-white transition-colors duration-200"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
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

