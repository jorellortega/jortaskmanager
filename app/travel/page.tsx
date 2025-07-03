"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plane, Calendar, MapPin, Trash2, Edit2, Plus } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

type TravelPlan = {
  id: number
  destination: string
  startDate: string
  endDate: string
  notes: string
}

const mockTravelPlans: TravelPlan[] = [
  {
    id: 1,
    destination: "Tokyo, Japan",
    startDate: "2024-05-15",
    endDate: "2024-05-25",
    notes: "Visit Shibuya Crossing, try authentic ramen, explore Akihabara district",
  },
  {
    id: 2,
    destination: "Paris, France",
    startDate: "2024-06-10",
    endDate: "2024-06-20",
    notes: "Eiffel Tower, Louvre Museum, Seine River cruise, try French pastries",
  },
  {
    id: 3,
    destination: "New York City, USA",
    startDate: "2024-07-05",
    endDate: "2024-07-12",
    notes: "Times Square, Central Park, Broadway show, visit museums",
  },
  {
    id: 4,
    destination: "Bali, Indonesia",
    startDate: "2024-08-20",
    endDate: "2024-09-05",
    notes: "Beach resorts, temple visits, surfing lessons, local cuisine",
  },
  {
    id: 5,
    destination: "Rome, Italy",
    startDate: "2024-09-15",
    endDate: "2024-09-25",
    notes: "Colosseum, Vatican City, Trevi Fountain, authentic Italian food",
  }
]

export default function TravelPage() {
  const [travelPlans, setTravelPlans] = useState<TravelPlan[]>([])
  const [newPlan, setNewPlan] = useState<Omit<TravelPlan, "id">>({
    destination: "",
    startDate: "",
    endDate: "",
    notes: "",
  })
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    const storedPlans = localStorage.getItem("travelPlans")
    if (storedPlans) {
      setTravelPlans(JSON.parse(storedPlans))
    } else {
      setTravelPlans(mockTravelPlans)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("travelPlans", JSON.stringify(travelPlans))
  }, [travelPlans])

  const addPlan = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPlan.destination && newPlan.startDate && newPlan.endDate) {
      setTravelPlans([...travelPlans, { ...newPlan, id: Date.now() }])
      setNewPlan({ destination: "", startDate: "", endDate: "", notes: "" })
    }
  }

  const updatePlan = (id: number, updatedPlan: Omit<TravelPlan, "id">) => {
    setTravelPlans(travelPlans.map((plan) => (plan.id === id ? { ...plan, ...updatedPlan } : plan)))
    setEditingId(null)
  }

  const deletePlan = (id: number) => {
    setTravelPlans(travelPlans.filter((plan) => plan.id !== id))
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4 flex items-center text-white">
        <Plane className="mr-2" /> Travel & Vacation Plans
      </h1>
      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Plus className="mr-2" /> Add New Travel Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addPlan} className="space-y-4">
            <div>
              <Label htmlFor="destination" className="text-white">
                Destination
              </Label>
              <Input
                id="destination"
                value={newPlan.destination}
                onChange={(e) => setNewPlan({ ...newPlan, destination: e.target.value })}
                className="bg-[#1A1A1B] border-gray-700 text-white"
                placeholder="Enter destination"
              />
            </div>
            <div className="flex space-x-4">
              <div className="flex-1">
                <Label htmlFor="startDate" className="text-white">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newPlan.startDate}
                  onChange={(e) => setNewPlan({ ...newPlan, startDate: e.target.value })}
                  className="bg-[#1A1A1B] border-gray-700 text-white"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="endDate" className="text-white">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newPlan.endDate}
                  onChange={(e) => setNewPlan({ ...newPlan, endDate: e.target.value })}
                  className="bg-[#1A1A1B] border-gray-700 text-white"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes" className="text-white">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={newPlan.notes}
                onChange={(e) => setNewPlan({ ...newPlan, notes: e.target.value })}
                className="bg-[#1A1A1B] border-gray-700 text-white"
                placeholder="Enter any additional notes"
              />
            </div>
            <Button type="submit" className="w-full">
              Add Travel Plan
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {travelPlans.map((plan) => (
          <Card key={plan.id} className="bg-[#141415] border border-gray-700">
            <CardContent className="p-4">
              {editingId === plan.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    updatePlan(plan.id, {
                      destination: e.currentTarget.destination.value,
                      startDate: e.currentTarget.startDate.value,
                      endDate: e.currentTarget.endDate.value,
                      notes: e.currentTarget.notes.value,
                    })
                  }}
                  className="space-y-4"
                >
                  <Input
                    name="destination"
                    defaultValue={plan.destination}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                  />
                  <div className="flex space-x-4">
                    <Input
                      name="startDate"
                      type="date"
                      defaultValue={plan.startDate}
                      className="bg-[#1A1A1B] border-gray-700 text-white"
                    />
                    <Input
                      name="endDate"
                      type="date"
                      defaultValue={plan.endDate}
                      className="bg-[#1A1A1B] border-gray-700 text-white"
                    />
                  </div>
                  <Textarea
                    name="notes"
                    defaultValue={plan.notes}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="submit">Save</Button>
                    <Button variant="outline" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-2 flex items-center text-white">
                    <MapPin className="mr-2" /> {plan.destination}
                  </h2>
                  <p className="text-sm text-white mb-2 flex items-center">
                    <Calendar className="mr-2" />
                    {format(new Date(plan.startDate), "MMM d, yyyy")} - {format(new Date(plan.endDate), "MMM d, yyyy")}
                  </p>
                  <p className="text-white mb-4">{plan.notes}</p>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingId(plan.id)}>
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

