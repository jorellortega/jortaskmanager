"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Trash2, Target } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

type Goal = {
  id: string
  user_id: string
  title: string
  description: string | null
  target_date: string | null
  achieved: boolean
  created_at: string
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [newGoal, setNewGoal] = useState({ title: "", description: "", target_date: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchGoals = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view goals.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      const { data, error: fetchError } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
      if (fetchError) {
        setError("Failed to fetch goals.")
      } else {
        setGoals(data || [])
      }
      setLoading(false)
    }
    fetchGoals()
  }, [])

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!userId) {
      setError("You must be logged in to add goals.")
      return
    }
    if (newGoal.title.trim()) {
      setLoading(true)
      const { data, error: insertError } = await supabase
        .from("goals")
        .insert([
          {
            user_id: userId,
            title: newGoal.title.trim(),
            description: newGoal.description || null,
            target_date: newGoal.target_date || null,
            achieved: false,
          },
        ])
        .select()
      if (insertError) {
        setError(insertError.message || "Failed to add goal. Please try again.")
      } else if (data && data.length > 0) {
        setGoals((prev) => [...prev, data[0]])
        setNewGoal({ title: "", description: "", target_date: "" })
      }
      setLoading(false)
    }
  }

  const toggleGoal = async (id: string, achieved: boolean) => {
    setError(null)
    setLoading(true)
    const { data, error: updateError } = await supabase
      .from("goals")
      .update({ achieved: !achieved })
      .eq("id", id)
      .select()
    if (updateError) {
      setError(updateError.message || "Failed to update goal.")
    } else if (data && data.length > 0) {
      setGoals((prev) => prev.map((g) => g.id === id ? data[0] : g))
    }
    setLoading(false)
  }

  const deleteGoal = async (id: string) => {
    setError(null)
    setLoading(true)
    const { error: deleteError } = await supabase
      .from("goals")
      .delete()
      .eq("id", id)
    if (deleteError) {
      setError(deleteError.message || "Failed to delete goal.")
    } else {
      setGoals((prev) => prev.filter((g) => g.id !== id))
    }
    setLoading(false)
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
          <form onSubmit={addGoal} className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
            <Input
              type="text"
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              placeholder="Goal title (required)"
              className="flex-grow bg-[#1A1A1B] border-gray-700 text-white placeholder-gray-400"
              required
            />
            <Input
              type="text"
              value={newGoal.description}
              onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              placeholder="Description (optional)"
              className="flex-grow bg-[#1A1A1B] border-gray-700 text-white placeholder-gray-400"
            />
            <Input
              type="date"
              value={newGoal.target_date}
              onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
              className="flex-grow bg-[#1A1A1B] border-gray-700 text-white placeholder-gray-400"
            />
            <Button type="submit" className="text-white" disabled={loading}>
              {loading ? "Adding..." : "Add"}
            </Button>
          </form>
          {error && <p className="text-red-400 mt-2">{error}</p>}
        </CardContent>
      </Card>
      <Card className="bg-[#141415] border border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Your Goals</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-white">Loading...</p>
          ) : goals.length === 0 ? (
            <p className="text-white">No goals yet. Add some above!</p>
          ) : (
            <ul className="space-y-2">
              {goals.map((goal) => (
                <li key={goal.id} className="flex items-center justify-between bg-[#1A1A1B] p-2 rounded">
                  <div className="flex flex-col md:flex-row md:items-center md:space-x-4 w-full">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={goal.achieved}
                        onCheckedChange={() => toggleGoal(goal.id, goal.achieved)}
                        className="border-gray-400"
                      />
                      <span
                        className={`flex items-center ${goal.achieved ? "line-through text-gray-500" : "text-white"}`}
                      >
                        <Target className="h-4 w-4 text-red-400 mr-2" />
                        {goal.title}
                      </span>
                    </div>
                    {goal.description && (
                      <span className="text-gray-400 text-sm mt-1 md:mt-0">{goal.description}</span>
                    )}
                    {goal.target_date && (
                      <span className="text-blue-300 text-xs mt-1 md:mt-0">Target: {goal.target_date}</span>
                    )}
                    <span className="text-gray-500 text-xs mt-1 md:mt-0">Created: {goal.created_at?.slice(0, 10)}</span>
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

