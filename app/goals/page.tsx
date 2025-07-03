"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Trash2, Target } from "lucide-react"
import Link from "next/link"

type Goal = {
  id: number
  text: string
  completed: boolean
}

const mockGoals: Goal[] = [
  {
    id: 1,
    text: "Complete the weekly task manager project",
    completed: false,
  },
  {
    id: 2,
    text: "Learn and implement TypeScript in all components",
    completed: false,
  },
  {
    id: 3,
    text: "Improve code documentation and add comments",
    completed: true,
  },
  {
    id: 4,
    text: "Set up automated testing for the application",
    completed: false,
  },
  {
    id: 5,
    text: "Optimize application performance",
    completed: false,
  },
  {
    id: 6,
    text: "Implement user authentication system",
    completed: false,
  },
  {
    id: 7,
    text: "Add dark/light theme toggle",
    completed: true,
  },
  {
    id: 8,
    text: "Create comprehensive user documentation",
    completed: false,
  },
  {
    id: 9,
    text: "Set up CI/CD pipeline",
    completed: false,
  },
  {
    id: 10,
    text: "Conduct user testing and gather feedback",
    completed: false,
  }
]

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [newGoal, setNewGoal] = useState("")

  useEffect(() => {
    // Clear local storage for testing
    localStorage.removeItem("goals")
    
    const storedGoals = localStorage.getItem("goals")
    if (storedGoals) {
      const parsedGoals = JSON.parse(storedGoals)
      if (Array.isArray(parsedGoals) && parsedGoals.length > 0) {
        setGoals(parsedGoals)
      } else {
        setGoals(mockGoals)
      }
    } else {
      setGoals(mockGoals)
    }
  }, [])

  useEffect(() => {
    if (goals.length > 0) {
      localStorage.setItem("goals", JSON.stringify(goals))
    }
  }, [goals])

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault()
    if (newGoal.trim()) {
      const newGoalItem: Goal = {
        id: Date.now(),
        text: newGoal.trim(),
        completed: false,
      }
      setGoals((prevGoals) => [...prevGoals, newGoalItem])
      setNewGoal("")
    }
  }

  const toggleGoal = (id: number) => {
    setGoals((prevGoals) => prevGoals.map((goal) => (goal.id === id ? { ...goal, completed: !goal.completed } : goal)))
  }

  const deleteGoal = (id: number) => {
    setGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== id))
  }

  return (
    <div className="container mx-auto p-4 text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4">Goals</h1>
      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="text-white">Add New Goal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addGoal} className="flex space-x-2">
            <Input
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="Enter a new goal"
              className="flex-grow bg-[#1A1A1B] border-gray-700 text-white placeholder-gray-400"
            />
            <Button type="submit" className="text-white">
              Add
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="bg-[#141415] border border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Your Goals</CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <p className="text-white">No goals yet. Add some above!</p>
          ) : (
            <ul className="space-y-2">
              {goals.map((goal) => (
                <li key={goal.id} className="flex items-center justify-between bg-[#1A1A1B] p-2 rounded">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={goal.completed}
                      onCheckedChange={() => toggleGoal(goal.id)}
                      className="border-gray-400"
                    />
                    <span
                      className={`flex items-center ${goal.completed ? "line-through text-gray-500" : "text-white"}`}
                    >
                      <Target className="h-4 w-4 text-red-400 mr-2" />
                      {goal.text}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteGoal(goal.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

