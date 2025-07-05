"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Utensils, Plus, Pencil, Trash2, Save, X, ArrowLeft } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

type MealPlan = {
  id: string
  user_id: string
  day: string
  breakfast: string
  lunch: string
  dinner: string
  snacks: string[]
  created_at?: string
}

export default function MealPlanning() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null)
  const [newPlan, setNewPlan] = useState<Omit<MealPlan, 'id' | 'user_id' | 'created_at'>>({
    day: "",
    breakfast: "",
    lunch: "",
    dinner: "",
    snacks: []
  })
  const [newSnack, setNewSnack] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view meal plans.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      const { data, error: fetchError } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
      if (fetchError) {
        setError("Failed to fetch meal plans.")
      } else {
        setMealPlans(data || [])
      }
      setLoading(false)
    }
    fetchPlans()
  }, [])

  const handleAddPlan = async () => {
    setError(null)
    if (!userId) {
      setError("You must be logged in to add meal plans.")
      return
    }
    if (newPlan.day.trim()) {
      setLoading(true)
      const snacksArray = Array.isArray(newPlan.snacks)
        ? newPlan.snacks.filter(s => typeof s === 'string' && s.trim() !== '')
        : [];
      console.log('Inserting meal plan:', {
        user_id: userId,
        day: newPlan.day.trim(),
        breakfast: newPlan.breakfast,
        lunch: newPlan.lunch,
        dinner: newPlan.dinner,
        snacks: snacksArray,
      });
      const { data, error: insertError } = await supabase
        .from("meal_plans")
        .insert([
          {
            user_id: userId,
            day: newPlan.day.trim(),
            breakfast: newPlan.breakfast,
            lunch: newPlan.lunch,
            dinner: newPlan.dinner,
            snacks: snacksArray,
          },
        ])
        .select()
      if (insertError) {
        setError(insertError.message || "Failed to add meal plan. Please try again.")
        console.error('Supabase insert error:', insertError)
      } else if (data && data.length > 0) {
        setMealPlans((prev) => [...prev, data[0]])
        setNewPlan({ day: "", breakfast: "", lunch: "", dinner: "", snacks: [] })
      }
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setError(null)
    setLoading(true)
    const { error: deleteError } = await supabase
      .from("meal_plans")
      .delete()
      .eq("id", id)
    if (deleteError) {
      setError(deleteError.message || "Failed to delete meal plan.")
    } else {
      setMealPlans((prev) => prev.filter((plan) => plan.id !== id))
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!editingPlan) return
    setError(null)
    setLoading(true)
    const { data, error: updateError } = await supabase
      .from("meal_plans")
      .update({
        day: editingPlan.day,
        breakfast: editingPlan.breakfast,
        lunch: editingPlan.lunch,
        dinner: editingPlan.dinner,
        snacks: editingPlan.snacks,
      })
      .eq("id", editingPlan.id)
      .select()
    if (updateError) {
      setError(updateError.message || "Failed to update meal plan.")
    } else if (data && data.length > 0) {
      setMealPlans((prev) => prev.map((plan) => plan.id === editingPlan.id ? data[0] : plan))
      setEditingPlan(null)
    }
    setLoading(false)
  }

  const handleAddSnack = () => {
    if (newSnack.trim()) {
      setNewPlan(prev => ({
        ...prev,
        snacks: [...prev.snacks, newSnack.trim()]
      }))
      setNewSnack("")
    }
  }

  const handleRemoveSnack = (index: number) => {
    setNewPlan(prev => ({
      ...prev,
      snacks: prev.snacks.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="container mx-auto p-4">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Meal Planning
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-[#1a1a1b] text-white border-gray-700 hover:bg-[#2a2a2b]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#141415] border-gray-700 text-white">
                <DialogHeader>
                  <DialogTitle>Add New Meal Plan</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-300">Day</label>
                    <Input
                      value={newPlan.day}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, day: e.target.value }))}
                      className="bg-[#1a1a1b] border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Breakfast</label>
                    <Input
                      value={newPlan.breakfast}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, breakfast: e.target.value }))}
                      className="bg-[#1a1a1b] border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Lunch</label>
                    <Input
                      value={newPlan.lunch}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, lunch: e.target.value }))}
                      className="bg-[#1a1a1b] border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Dinner</label>
                    <Input
                      value={newPlan.dinner}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, dinner: e.target.value }))}
                      className="bg-[#1a1a1b] border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Snacks</label>
                    <div className="flex gap-2">
                      <Input
                        value={newSnack}
                        onChange={(e) => setNewSnack(e.target.value)}
                        className="bg-[#1a1a1b] border-gray-700 text-white"
                        placeholder="Add snack"
                      />
                      <Button onClick={handleAddSnack} className="bg-[#1a1a1b] text-white border-gray-700">
                        Add
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {newPlan.snacks.map((snack, index) => (
                        <div key={index} className="flex items-center gap-1 bg-[#1a1a1b] px-2 py-1 rounded">
                          <span className="text-sm">{snack}</span>
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-red-400"
                            onClick={() => handleRemoveSnack(index)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleAddPlan} className="w-full bg-[#1a1a1b] text-white border-gray-700 hover:bg-[#2a2a2b]">
                    Save Plan
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mealPlans.map((plan) => (
              <Card key={plan.id} className="bg-[#1a1a1b] border border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex justify-between items-center">
                    {editingPlan?.id === plan.id ? (
                      <Input
                        value={editingPlan.day}
                        onChange={(e) => setEditingPlan(prev => prev ? { ...prev, day: e.target.value } : null)}
                        className="bg-[#141415] border-gray-700 text-white w-32"
                      />
                    ) : (
                      plan.day
                    )}
                    <div className="flex gap-2">
                      {editingPlan?.id === plan.id ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleSave}
                          className="text-green-400 hover:text-green-300"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingPlan(plan)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(plan.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-2">
                  <div>
                    <strong>Breakfast:</strong>{" "}
                    {editingPlan?.id === plan.id ? (
                      <Input
                        value={editingPlan.breakfast}
                        onChange={(e) => setEditingPlan(prev => prev ? { ...prev, breakfast: e.target.value } : null)}
                        className="bg-[#141415] border-gray-700 text-white mt-1"
                      />
                    ) : (
                      plan.breakfast
                    )}
                  </div>
                  <div>
                    <strong>Lunch:</strong>{" "}
                    {editingPlan?.id === plan.id ? (
                      <Input
                        value={editingPlan.lunch}
                        onChange={(e) => setEditingPlan(prev => prev ? { ...prev, lunch: e.target.value } : null)}
                        className="bg-[#141415] border-gray-700 text-white mt-1"
                      />
                    ) : (
                      plan.lunch
                    )}
                  </div>
                  <div>
                    <strong>Dinner:</strong>{" "}
                    {editingPlan?.id === plan.id ? (
                      <Input
                        value={editingPlan.dinner}
                        onChange={(e) => setEditingPlan(prev => prev ? { ...prev, dinner: e.target.value } : null)}
                        className="bg-[#141415] border-gray-700 text-white mt-1"
                      />
                    ) : (
                      plan.dinner
                    )}
                  </div>
                  <div>
                    <strong>Snacks:</strong>{" "}
                    {editingPlan?.id === plan.id ? (
                      <div className="mt-1">
                        <div className="flex gap-2">
                          <Input
                            value={newSnack}
                            onChange={(e) => setNewSnack(e.target.value)}
                            className="bg-[#141415] border-gray-700 text-white"
                            placeholder="Add snack"
                          />
                          <Button
                            onClick={() => {
                              if (newSnack.trim()) {
                                setEditingPlan(prev => prev ? {
                                  ...prev,
                                  snacks: [...prev.snacks, newSnack.trim()]
                                } : null)
                                setNewSnack("")
                              }
                            }}
                            className="bg-[#141415] text-white border-gray-700"
                          >
                            Add
                          </Button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {editingPlan.snacks.map((snack, index) => (
                            <div key={index} className="flex items-center gap-1 bg-[#141415] px-2 py-1 rounded">
                              <span className="text-sm">{snack}</span>
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-red-400"
                                onClick={() => {
                                  setEditingPlan(prev => prev ? {
                                    ...prev,
                                    snacks: prev.snacks.filter((_, i) => i !== index)
                                  } : null)
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      plan.snacks.join(", ")
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 