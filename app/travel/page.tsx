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
import { supabase } from "@/lib/supabaseClient"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type TravelPlan = {
  id: string
  user_id: string
  destination: string
  start_date: string
  end_date: string
  start_time?: string | null
  end_time?: string | null
  notes: string | null
  created_at: string
}

export default function TravelPage() {
  const [travelPlans, setTravelPlans] = useState<TravelPlan[]>([])
  const [newPlan, setNewPlan] = useState<{ destination: string; start_date: string; end_date: string; notes: string }>({
    destination: "",
    start_date: "",
    end_date: "",
    notes: "",
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedPlan, setEditedPlan] = useState<{ destination: string; start_date: string; end_date: string; notes: string }>({ destination: "", start_date: "", end_date: "", notes: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [editedStartTime, setEditedStartTime] = useState("");
  const [editedEndTime, setEditedEndTime] = useState("");

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view travel plans.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      const { data, error: fetchError } = await supabase
        .from("travel_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: true })
      if (fetchError) {
        setError("Failed to fetch travel plans.")
      } else {
        setTravelPlans(data || [])
      }
      setLoading(false)
    }
    fetchPlans()
  }, [])

  const addPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!userId) {
      setError("You must be logged in to add travel plans.")
      return
    }
    if (newPlan.destination && newPlan.start_date && newPlan.end_date) {
      setLoading(true)
      const { data, error: insertError } = await supabase
        .from("travel_plans")
        .insert([
          {
            user_id: userId,
            destination: newPlan.destination,
            start_date: newPlan.start_date,
            end_date: newPlan.end_date,
            start_time: newStartTime || null,
            end_time: newEndTime || null,
            notes: newPlan.notes || null,
          },
        ])
        .select()
      if (insertError) {
        setError(insertError.message || "Failed to add travel plan.")
      } else if (data && data.length > 0) {
        setTravelPlans((prev) => [...prev, data[0]])
        setNewPlan({ destination: "", start_date: "", end_date: "", notes: "" })
        setNewStartTime("")
        setNewEndTime("")
      }
      setLoading(false)
    }
  }

  const startEdit = (plan: TravelPlan) => {
    setEditingId(plan.id)
    setEditedPlan({
      destination: plan.destination,
      start_date: plan.start_date,
      end_date: plan.end_date,
      notes: plan.notes || "",
    })
    setEditedStartTime(plan.start_time || "");
    setEditedEndTime(plan.end_time || "");
  }

  const updatePlan = async (id: string, updatedPlan: { destination: string; start_date: string; end_date: string; notes: string }) => {
    setError(null)
    setLoading(true)
    const { data, error: updateError } = await supabase
      .from("travel_plans")
      .update({
        destination: updatedPlan.destination,
        start_date: updatedPlan.start_date,
        end_date: updatedPlan.end_date,
        start_time: editedStartTime || null,
        end_time: editedEndTime || null,
        notes: updatedPlan.notes || null,
      })
      .eq("id", id)
      .select()
    if (updateError) {
      setError(updateError.message || "Failed to update travel plan.")
    } else if (data && data.length > 0) {
      setTravelPlans((prev) => prev.map((plan) => plan.id === id ? data[0] : plan))
      setEditingId(null)
    }
    setLoading(false)
  }

  const deletePlan = async (id: string) => {
    setError(null)
    setLoading(true)
    const { error: deleteError } = await supabase
      .from("travel_plans")
      .delete()
      .eq("id", id)
    if (deleteError) {
      setError(deleteError.message || "Failed to delete travel plan.")
    } else {
      setTravelPlans((prev) => prev.filter((plan) => plan.id !== id))
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4 flex items-center text-white">
        <Plane className="mr-2" /> Travel & Vacation Plans
      </h1>
      {error && <div className="bg-red-900 text-red-200 p-2 mb-4 rounded">{error}</div>}
      {loading && <div className="text-blue-300 mb-2">Loading...</div>}
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
                required
              />
            </div>
            <div className="flex space-x-4">
              <div className="flex-1">
                <Label htmlFor="start_date" className="text-white">
                  Start Date
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={newPlan.start_date}
                  onChange={(e) => setNewPlan({ ...newPlan, start_date: e.target.value })}
                  className="bg-[#1A1A1B] border-gray-700 text-white"
                  required
                />
                <Select
                  value={newStartTime}
                  onValueChange={setNewStartTime}
                >
                  <SelectTrigger id="start_time" className="bg-[#1A1A1B] border-gray-700 text-white w-full rounded px-3 py-2 mt-1">
                    <SelectValue placeholder="Select a start time (optional)" className="!text-white !placeholder:text-gray-400" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#18181b] dark:text-white bg-[#18181b] text-white">
                    {Array.from({ length: 24 * 2 }, (_, i) => {
                      const hour24 = Math.floor(i / 2);
                      const min = i % 2 === 0 ? '00' : '30';
                      const hour12 = ((hour24 + 11) % 12) + 1;
                      const ampm = hour24 < 12 ? 'AM' : 'PM';
                      const display = `${hour12.toString().padStart(2, '0')}:${min} ${ampm}`;
                      const value = `${hour24.toString().padStart(2, '0')}:${min}`;
                      return (
                        <SelectItem key={value} value={value} className="dark:bg-[#18181b] dark:text-white bg-[#18181b] text-white">
                          {display}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="end_date" className="text-white">
                  End Date
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={newPlan.end_date}
                  onChange={(e) => setNewPlan({ ...newPlan, end_date: e.target.value })}
                  className="bg-[#1A1A1B] border-gray-700 text-white"
                  required
                />
                <Select
                  value={newEndTime}
                  onValueChange={setNewEndTime}
                >
                  <SelectTrigger id="end_time" className="bg-[#1A1A1B] border-gray-700 text-white w-full rounded px-3 py-2 mt-1">
                    <SelectValue placeholder="Select an end time (optional)" className="!text-white !placeholder:text-gray-400" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#18181b] dark:text-white bg-[#18181b] text-white">
                    {Array.from({ length: 24 * 2 }, (_, i) => {
                      const hour24 = Math.floor(i / 2);
                      const min = i % 2 === 0 ? '00' : '30';
                      const hour12 = ((hour24 + 11) % 12) + 1;
                      const ampm = hour24 < 12 ? 'AM' : 'PM';
                      const display = `${hour12.toString().padStart(2, '0')}:${min} ${ampm}`;
                      const value = `${hour24.toString().padStart(2, '0')}:${min}`;
                      return (
                        <SelectItem key={value} value={value} className="dark:bg-[#18181b] dark:text-white bg-[#18181b] text-white">
                          {display}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Adding..." : "Add Travel Plan"}
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
                    updatePlan(plan.id, editedPlan)
                  }}
                  className="space-y-4"
                >
                  <Input
                    name="destination"
                    value={editedPlan.destination}
                    onChange={(e) => setEditedPlan({ ...editedPlan, destination: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                  />
                  <div className="flex space-x-4">
                    <Input
                      name="start_date"
                      type="date"
                      value={editedPlan.start_date}
                      onChange={(e) => setEditedPlan({ ...editedPlan, start_date: e.target.value })}
                      className="bg-[#1A1A1B] border-gray-700 text-white"
                    />
                    <Select
                      value={editedStartTime}
                      onValueChange={setEditedStartTime}
                    >
                      <SelectTrigger id="edit-start-time" className="bg-[#1A1A1B] border-gray-700 text-white w-full rounded px-3 py-2 mt-1">
                        <SelectValue placeholder="Select a start time (optional)" className="!text-white !placeholder:text-gray-400" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-[#18181b] dark:text-white bg-[#18181b] text-white">
                        {Array.from({ length: 24 * 2 }, (_, i) => {
                          const hour24 = Math.floor(i / 2);
                          const min = i % 2 === 0 ? '00' : '30';
                          const hour12 = ((hour24 + 11) % 12) + 1;
                          const ampm = hour24 < 12 ? 'AM' : 'PM';
                          const display = `${hour12.toString().padStart(2, '0')}:${min} ${ampm}`;
                          const value = `${hour24.toString().padStart(2, '0')}:${min}`;
                          return (
                            <SelectItem key={value} value={value} className="dark:bg-[#18181b] dark:text-white bg-[#18181b] text-white">
                              {display}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <Input
                      name="end_date"
                      type="date"
                      value={editedPlan.end_date}
                      onChange={(e) => setEditedPlan({ ...editedPlan, end_date: e.target.value })}
                      className="bg-[#1A1A1B] border-gray-700 text-white"
                    />
                    <Select
                      value={editedEndTime}
                      onValueChange={setEditedEndTime}
                    >
                      <SelectTrigger id="edit-end-time" className="bg-[#1A1A1B] border-gray-700 text-white w-full rounded px-3 py-2 mt-1">
                        <SelectValue placeholder="Select an end time (optional)" className="!text-white !placeholder:text-gray-400" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-[#18181b] dark:text-white bg-[#18181b] text-white">
                        {Array.from({ length: 24 * 2 }, (_, i) => {
                          const hour24 = Math.floor(i / 2);
                          const min = i % 2 === 0 ? '00' : '30';
                          const hour12 = ((hour24 + 11) % 12) + 1;
                          const ampm = hour24 < 12 ? 'AM' : 'PM';
                          const display = `${hour12.toString().padStart(2, '0')}:${min} ${ampm}`;
                          const value = `${hour24.toString().padStart(2, '0')}:${min}`;
                          return (
                            <SelectItem key={value} value={value} className="dark:bg-[#18181b] dark:text-white bg-[#18181b] text-white">
                              {display}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    name="notes"
                    value={editedPlan.notes}
                    onChange={(e) => setEditedPlan({ ...editedPlan, notes: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="submit" disabled={loading}>Save</Button>
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
                    {format(new Date(plan.start_date), "MMM d, yyyy")}
                    {plan.start_time && <span className="ml-2">at {plan.start_time}</span>}
                    {" - "}
                    {format(new Date(plan.end_date), "MMM d, yyyy")}
                    {plan.end_time && <span className="ml-2">at {plan.end_time}</span>}
                  </p>
                  <p className="text-white mb-4">{plan.notes}</p>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(plan)}>
                      <Edit2 className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deletePlan(plan.id)} disabled={loading}>
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

