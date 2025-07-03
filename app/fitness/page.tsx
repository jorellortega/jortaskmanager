"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Trash2, Dumbbell, Calendar } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

type FitnessActivity = {
  id: number
  activity: string
  date: string
  completed: boolean
}

export default function FitnessPage() {
  const [activities, setActivities] = useState<FitnessActivity[]>([])
  const [newActivity, setNewActivity] = useState("")
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"))

  useEffect(() => {
    const storedActivities = localStorage.getItem("fitnessActivities")
    if (storedActivities) {
      setActivities(JSON.parse(storedActivities))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("fitnessActivities", JSON.stringify(activities))
  }, [activities])

  const addActivity = (e: React.FormEvent) => {
    e.preventDefault()
    if (newActivity.trim()) {
      const newActivityItem: FitnessActivity = {
        id: Date.now(),
        activity: newActivity.trim(),
        date: newDate,
        completed: false,
      }
      setActivities((prevActivities) => [...prevActivities, newActivityItem])
      setNewActivity("")
      setNewDate(format(new Date(), "yyyy-MM-dd"))
    }
  }

  const toggleActivity = (id: number) => {
    setActivities((prevActivities) =>
      prevActivities.map((activity) =>
        activity.id === id ? { ...activity, completed: !activity.completed } : activity,
      ),
    )
  }

  const deleteActivity = (id: number) => {
    setActivities((prevActivities) => prevActivities.filter((activity) => activity.id !== id))
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4">Fitness Activities</h1>
      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="text-white">Add New Fitness Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addActivity} className="flex flex-col space-y-2">
            <Input
              type="text"
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              placeholder="Enter a new fitness activity"
              className="bg-[#1A1A1B] border-gray-700 text-white placeholder-gray-400"
            />
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="bg-[#1A1A1B] border-gray-700 text-white"
            />
            <Button
              type="submit"
              className="text-black font-semibold bg-gradient-to-r from-green-400 to-green-200 hover:from-green-500 hover:to-green-300 transition-all duration-200"
            >
              Add Activity
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="bg-[#141415] border border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Your Fitness Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-white">No fitness activities planned yet. Add some above!</p>
          ) : (
            <ul className="space-y-2">
              {activities.map((activity) => (
                <li key={activity.id} className="flex items-center justify-between bg-[#1A1A1B] p-2 rounded">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={activity.completed}
                      onCheckedChange={() => toggleActivity(activity.id)}
                      className="border-gray-400"
                    />
                    <span
                      className={`flex items-center ${activity.completed ? "line-through text-gray-500" : "text-white"}`}
                    >
                      <Dumbbell className="h-4 w-4 text-green-400 mr-2" />
                      {activity.activity}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {activity.date}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteActivity(activity.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

