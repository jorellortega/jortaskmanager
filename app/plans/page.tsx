"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Trash2, Edit2, Check } from "lucide-react"
import Link from "next/link"

type Plan = {
  id: number
  title: string
  description: string
  date: string
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [newPlan, setNewPlan] = useState({ title: "", description: "", date: "" })
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)

  const addPlan = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPlan.title && newPlan.date) {
      setPlans([...plans, { ...newPlan, id: Date.now() }])
      setNewPlan({ title: "", description: "", date: "" })
    }
  }

  const deletePlan = (id: number) => {
    setPlans(plans.filter((plan) => plan.id !== id))
  }

  const startEditing = (plan: Plan) => {
    setEditingPlan(plan)
  }

  const saveEdit = () => {
    if (editingPlan) {
      setPlans(plans.map((plan) => (plan.id === editingPlan.id ? editingPlan : plan)))
      setEditingPlan(null)
    }
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4">Plans</h1>
      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Plus className="mr-2" />
            Create New Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addPlan} className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-white">
                Title
              </Label>
              <Input
                id="title"
                value={newPlan.title}
                onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
                className="bg-[#1A1A1B] border-gray-700 text-white"
                placeholder="Enter plan title"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-white">
                Description
              </Label>
              <Textarea
                id="description"
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                className="bg-[#1A1A1B] border-gray-700 text-white"
                placeholder="Enter plan description"
              />
            </div>
            <div>
              <Label htmlFor="date" className="text-white">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={newPlan.date}
                onChange={(e) => setNewPlan({ ...newPlan, date: e.target.value })}
                className="bg-[#1A1A1B] border-gray-700 text-white"
              />
            </div>
            <Button type="submit" className="w-full">
              Add Plan
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="bg-[#141415] border border-gray-700">
            <CardContent className="p-4">
              {editingPlan && editingPlan.id === plan.id ? (
                <div className="space-y-4">
                  <Input
                    value={editingPlan.title}
                    onChange={(e) => setEditingPlan({ ...editingPlan, title: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                  />
                  <Textarea
                    value={editingPlan.description}
                    onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                  />
                  <Input
                    type="date"
                    value={editingPlan.date}
                    onChange={(e) => setEditingPlan({ ...editingPlan, date: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                  />
                  <Button onClick={saveEdit} className="mr-2">
                    <Check className="mr-2 h-4 w-4" /> Save
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-2">{plan.title}</h2>
                  <p className="text-gray-400 mb-2">{plan.description}</p>
                  <p className="text-sm text-gray-500 mb-4">{plan.date}</p>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => startEditing(plan)}>
                      <Edit2 className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deletePlan(plan.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

