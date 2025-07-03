"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Utensils, Plus, Pencil, Trash2, Save, X, ArrowLeft } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"

type MealPlan = {
  id: number
  day: string
  breakfast: string
  lunch: string
  dinner: string
  snacks: string[]
}

const sampleMealPlans: MealPlan[] = [
  {
    id: 1,
    day: "Monday",
    breakfast: "Oatmeal with fruits",
    lunch: "Chicken salad",
    dinner: "Grilled salmon with vegetables",
    snacks: ["Apple", "Yogurt"]
  },
  {
    id: 2,
    day: "Tuesday",
    breakfast: "Smoothie bowl",
    lunch: "Quinoa bowl",
    dinner: "Vegetable stir-fry",
    snacks: ["Nuts", "Banana"]
  }
]

export default function MealPlanning() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>(sampleMealPlans)
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null)
  const [newPlan, setNewPlan] = useState<Omit<MealPlan, 'id'>>({
    day: "",
    breakfast: "",
    lunch: "",
    dinner: "",
    snacks: []
  })
  const [newSnack, setNewSnack] = useState("")

  useEffect(() => {
    const storedPlans = localStorage.getItem("mealPlans")
    if (storedPlans) {
      setMealPlans(JSON.parse(storedPlans))
    } else {
      localStorage.setItem("mealPlans", JSON.stringify(sampleMealPlans))
    }
  }, [])

  const handleSave = () => {
    if (editingPlan) {
      const updatedPlans = mealPlans.map(plan => 
        plan.id === editingPlan.id ? editingPlan : plan
      )
      setMealPlans(updatedPlans)
      localStorage.setItem("mealPlans", JSON.stringify(updatedPlans))
      setEditingPlan(null)
    }
  }

  const handleDelete = (id: number) => {
    const updatedPlans = mealPlans.filter(plan => plan.id !== id)
    setMealPlans(updatedPlans)
    localStorage.setItem("mealPlans", JSON.stringify(updatedPlans))
  }

  const handleAddPlan = () => {
    const newPlanWithId = {
      ...newPlan,
      id: Date.now()
    }
    const updatedPlans = [...mealPlans, newPlanWithId]
    setMealPlans(updatedPlans)
    localStorage.setItem("mealPlans", JSON.stringify(updatedPlans))
    setNewPlan({
      day: "",
      breakfast: "",
      lunch: "",
      dinner: "",
      snacks: []
    })
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