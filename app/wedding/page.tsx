"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, Calendar, Heart, Users, DollarSign, Clock, MapPin, Phone, Mail, Star } from "lucide-react"
import Link from "next/link"
import { format, parseISO, addDays, differenceInDays } from "date-fns"
import { supabase } from "@/lib/supabaseClient"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

type WeddingInfo = {
  id: string
  user_id: string
  wedding_date: string
  venue: string
  budget: number
  guest_count: number
  notes?: string
  created_at?: string
}

type Vendor = {
  id: string
  user_id: string
  name: string
  category: string
  contact: string
  email?: string
  phone?: string
  cost: number
  deposit_paid: number
  balance_due: number
  status: "contacted" | "quoted" | "booked" | "paid"
  notes?: string
  created_at?: string
}

type WeddingTask = {
  id: string
  user_id: string
  title: string
  due_date: string
  category: string
  priority: "low" | "medium" | "high"
  completed: boolean
  notes?: string
  created_at?: string
}

type Guest = {
  id: string
  user_id: string
  name: string
  email?: string
  phone?: string
  plus_one: boolean
  plus_one_name?: string
  rsvp_status: "pending" | "confirmed" | "declined"
  dietary_restrictions?: string
  notes?: string
  created_at?: string
}

const vendorCategories = [
  "Venue", "Catering", "Photography", "Videography", "Music/DJ", "Flowers", 
  "Cake", "Transportation", "Attire", "Beauty", "Decor", "Officiant", "Other"
]

const taskCategories = [
  "Planning", "Vendors", "Attire", "Beauty", "Ceremony", "Reception", 
  "Travel", "Legal", "Honeymoon", "Other"
]

const priorities = ["low", "medium", "high"]

export default function WeddingPlanningPage() {
  const [weddingInfo, setWeddingInfo] = useState<WeddingInfo | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [tasks, setTasks] = useState<WeddingTask[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Form states
  const [showWeddingForm, setShowWeddingForm] = useState(false)
  const [newWedding, setNewWedding] = useState({ wedding_date: "", venue: "", budget: "", guest_count: "", notes: "" })
  const [showVendorForm, setShowVendorForm] = useState(false)
  const [newVendor, setNewVendor] = useState({ name: "", category: "", contact: "", email: "", phone: "", cost: "", deposit_paid: "", balance_due: "", status: "contacted" as const, notes: "" })
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [newTask, setNewTask] = useState({ title: "", due_date: "", category: "", priority: "medium" as const, notes: "" })
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [newGuest, setNewGuest] = useState({ name: "", email: "", phone: "", plus_one: false, plus_one_name: "", dietary_restrictions: "", notes: "" })

  // Edit states
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  const [editVendorData, setEditVendorData] = useState<any>({})
  const [editTaskData, setEditTaskData] = useState<any>({})
  const [editGuestData, setEditGuestData] = useState<any>({})

  useEffect(() => {
    const getUserAndData = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view wedding planning data.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      
      // Fetch all wedding-related data
      await Promise.all([
        fetchWeddingInfo(user.id),
        fetchVendors(user.id),
        fetchTasks(user.id),
        fetchGuests(user.id)
      ])
      
      setLoading(false)
    }
    getUserAndData()
  }, [])

  const fetchWeddingInfo = async (uid: string) => {
    const { data, error } = await supabase
      .from("wedding_info")
      .select("*")
      .eq("user_id", uid)
      .single()
    if (!error && data) {
      setWeddingInfo(data)
    }
  }

  const fetchVendors = async (uid: string) => {
    const { data, error } = await supabase
      .from("wedding_vendors")
      .select("*")
      .eq("user_id", uid)
      .order("category", { ascending: true })
    if (!error) {
      setVendors(data || [])
    }
  }

  const fetchTasks = async (uid: string) => {
    const { data, error } = await supabase
      .from("wedding_tasks")
      .select("*")
      .eq("user_id", uid)
      .order("due_date", { ascending: true })
    if (!error) {
      setTasks(data || [])
    }
  }

  const fetchGuests = async (uid: string) => {
    const { data, error } = await supabase
      .from("wedding_guests")
      .select("*")
      .eq("user_id", uid)
      .order("name", { ascending: true })
    if (!error) {
      setGuests(data || [])
    }
  }

  const addWeddingInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !newWedding.wedding_date || !newWedding.venue) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from("wedding_info")
      .insert([{
        user_id: userId,
        wedding_date: newWedding.wedding_date,
        venue: newWedding.venue,
        budget: parseFloat(newWedding.budget) || 0,
        guest_count: parseInt(newWedding.guest_count) || 0,
        notes: newWedding.notes || null
      }])
      .select()
      .single()
    
    if (error) {
      setError("Failed to add wedding info.")
    } else {
      setWeddingInfo(data)
      setShowWeddingForm(false)
      setNewWedding({ wedding_date: "", venue: "", budget: "", guest_count: "", notes: "" })
    }
    setLoading(false)
  }

  const addVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !newVendor.name || !newVendor.category) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from("wedding_vendors")
      .insert([{
        user_id: userId,
        name: newVendor.name,
        category: newVendor.category,
        contact: newVendor.contact,
        email: newVendor.email || null,
        phone: newVendor.phone || null,
        cost: parseFloat(newVendor.cost) || 0,
        deposit_paid: parseFloat(newVendor.deposit_paid) || 0,
        balance_due: parseFloat(newVendor.balance_due) || 0,
        status: newVendor.status,
        notes: newVendor.notes || null
      }])
      .select()
    
    if (error) {
      setError("Failed to add vendor.")
    } else {
      setVendors(prev => [...prev, ...(data || [])])
      setShowVendorForm(false)
      setNewVendor({ name: "", category: "", contact: "", email: "", phone: "", cost: "", deposit_paid: "", balance_due: "", status: "contacted", notes: "" })
    }
    setLoading(false)
  }

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !newTask.title || !newTask.due_date) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from("wedding_tasks")
      .insert([{
        user_id: userId,
        title: newTask.title,
        due_date: newTask.due_date,
        category: newTask.category || null,
        priority: newTask.priority,
        completed: false,
        notes: newTask.notes || null
      }])
      .select()
    
    if (error) {
      setError("Failed to add task.")
    } else {
      setTasks(prev => [...prev, ...(data || [])])
      setShowTaskForm(false)
      setNewTask({ title: "", due_date: "", category: "", priority: "medium", notes: "" })
    }
    setLoading(false)
  }

  const addGuest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !newGuest.name) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from("wedding_guests")
      .insert([{
        user_id: userId,
        name: newGuest.name,
        email: newGuest.email || null,
        phone: newGuest.phone || null,
        plus_one: newGuest.plus_one,
        plus_one_name: newGuest.plus_one_name || null,
        rsvp_status: "pending",
        dietary_restrictions: newGuest.dietary_restrictions || null,
        notes: newGuest.notes || null
      }])
      .select()
    
    if (error) {
      setError("Failed to add guest.")
    } else {
      setGuests(prev => [...prev, ...(data || [])])
      setShowGuestForm(false)
      setNewGuest({ name: "", email: "", phone: "", plus_one: false, plus_one_name: "", dietary_restrictions: "", notes: "" })
    }
    setLoading(false)
  }

  const toggleTask = async (id: string, completed: boolean) => {
    const { data, error } = await supabase
      .from("wedding_tasks")
      .update({ completed: !completed })
      .eq("id", id)
      .select()
    
    if (!error && data) {
      setTasks(prev => prev.map(task => task.id === id ? data[0] : task))
    }
  }

  const updateGuestRSVP = async (id: string, status: "confirmed" | "declined") => {
    const { data, error } = await supabase
      .from("wedding_guests")
      .update({ rsvp_status: status })
      .eq("id", id)
      .select()
    
    if (!error && data) {
      setGuests(prev => prev.map(guest => guest.id === id ? data[0] : guest))
    }
  }

  const deleteItem = async (type: string, id: string) => {
    setLoading(true)
    let error
    switch (type) {
      case "vendor":
        error = (await supabase.from("wedding_vendors").delete().eq("id", id)).error
        if (!error) setVendors(prev => prev.filter(v => v.id !== id))
        break
      case "task":
        error = (await supabase.from("wedding_tasks").delete().eq("id", id)).error
        if (!error) setTasks(prev => prev.filter(t => t.id !== id))
        break
      case "guest":
        error = (await supabase.from("wedding_guests").delete().eq("id", id)).error
        if (!error) setGuests(prev => prev.filter(g => g.id !== id))
        break
    }
    
    if (error) {
      setError("Failed to delete item.")
    }
    setLoading(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-400 bg-red-900/20 border-red-500"
      case "medium": return "text-yellow-400 bg-yellow-900/20 border-yellow-500"
      case "low": return "text-green-400 bg-green-900/20 border-green-500"
      default: return "text-gray-400 bg-gray-900/20 border-gray-500"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "booked": return "text-green-400 bg-green-900/20 border-green-500"
      case "quoted": return "text-blue-400 bg-blue-900/20 border-blue-500"
      case "contacted": return "text-yellow-400 bg-yellow-900/20 border-yellow-500"
      case "paid": return "text-purple-400 bg-purple-900/20 border-purple-500"
      default: return "text-gray-400 bg-gray-900/20 border-gray-500"
    }
  }

  const getRSVPColor = (status: string) => {
    switch (status) {
      case "confirmed": return "text-green-400 bg-green-900/20 border-green-500"
      case "declined": return "text-red-400 bg-red-900/20 border-red-500"
      case "pending": return "text-yellow-400 bg-yellow-900/20 border-yellow-500"
      default: return "text-gray-400 bg-gray-900/20 border-gray-500"
    }
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }

  return (
    <div className="container mx-auto p-4 text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Heart className="mr-3 text-pink-400" /> Wedding Planning
      </h1>
      
      {/* Wedding Overview */}
      {!weddingInfo ? (
        <Card className="bg-[#141415] border border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Heart className="mr-2 h-5 w-5" /> Start Planning Your Wedding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowWeddingForm(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Add Wedding Information
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-[#141415] border border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Heart className="mr-2 h-5 w-5" /> Wedding Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-[#1A1A1B] rounded-lg">
                <div className="text-2xl font-bold text-pink-400">
                  {format(parseISO(weddingInfo.wedding_date), "MMM d")}
                </div>
                <div className="text-sm text-gray-400">Wedding Date</div>
              </div>
              <div className="text-center p-3 bg-[#1A1A1B] rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {differenceInDays(parseISO(weddingInfo.wedding_date), new Date())}
                </div>
                <div className="text-sm text-gray-400">Days Until</div>
              </div>
              <div className="text-center p-3 bg-[#1A1A1B] rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  ${weddingInfo.budget.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Budget</div>
              </div>
              <div className="text-center p-3 bg-[#1A1A1B] rounded-lg">
                <div className="text-2xl font-bold text-purple-400">
                  {weddingInfo.guest_count}
                </div>
                <div className="text-sm text-gray-400">Guests</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-white mb-2">Venue</div>
              <div className="text-xl text-pink-400 font-bold">{weddingInfo.venue}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wedding Info Form */}
      {showWeddingForm && (
        <Card className="bg-[#141415] border border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Add Wedding Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addWeddingInfo} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="wedding_date" className="text-white">Wedding Date *</Label>
                  <Input
                    id="wedding_date"
                    type="date"
                    value={newWedding.wedding_date}
                    onChange={(e) => setNewWedding({ ...newWedding, wedding_date: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="venue" className="text-white">Venue *</Label>
                  <Input
                    id="venue"
                    value={newWedding.venue}
                    onChange={(e) => setNewWedding({ ...newWedding, venue: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Wedding venue"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget" className="text-white">Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={newWedding.budget}
                    onChange={(e) => setNewWedding({ ...newWedding, budget: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Total budget"
                  />
                </div>
                <div>
                  <Label htmlFor="guest_count" className="text-white">Expected Guest Count</Label>
                  <Input
                    id="guest_count"
                    type="number"
                    value={newWedding.guest_count}
                    onChange={(e) => setNewWedding({ ...newWedding, guest_count: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Number of guests"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes" className="text-white">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={newWedding.notes}
                  onChange={(e) => setNewWedding({ ...newWedding, notes: e.target.value })}
                  className="bg-[#1A1A1B] border-gray-700 text-white"
                  placeholder="Any additional notes..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Wedding Info"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowWeddingForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Vendors and Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Vendors */}
        <Card className="bg-[#141415] border border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Users className="mr-2 h-5 w-5 text-blue-400" /> Vendors
            </CardTitle>
            <Button size="sm" onClick={() => setShowVendorForm(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {vendors.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No vendors added yet</p>
            ) : (
              vendors.map((vendor) => (
                <div key={vendor.id} className="p-2 bg-[#1A1A1B] rounded border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-medium">{vendor.name}</div>
                      <div className="text-sm text-gray-400">
                        {vendor.category} • ${vendor.cost.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(vendor.status)}`}>
                        {vendor.status}
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => deleteItem("vendor", vendor.id)}>
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="bg-[#141415] border border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Check className="mr-2 h-5 w-5 text-green-400" /> Tasks
            </CardTitle>
            <Button size="sm" onClick={() => setShowTaskForm(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {tasks.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No tasks added yet</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="p-2 bg-[#1A1A1B] rounded border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-medium">{task.title}</div>
                      <div className="text-sm text-gray-400">
                        {task.category} • {format(parseISO(task.due_date), "MMM d, yyyy")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task.id, task.completed)}
                      />
                      <Button size="sm" variant="ghost" onClick={() => deleteItem("task", task.id)}>
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Guest List */}
      <Card className="bg-[#141415] border border-gray-700 mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Users className="mr-2 h-5 w-5 text-purple-400" /> Guest List
          </CardTitle>
          <Button size="sm" onClick={() => setShowGuestForm(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {guests.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No guests added yet</p>
            ) : (
              guests.map((guest) => (
                <div key={guest.id} className="p-3 bg-[#1A1A1B] rounded border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-medium">{guest.name}</div>
                      <div className="text-sm text-gray-400">
                        {guest.email && `${guest.email} • `}
                        {guest.phone && `${guest.phone} • `}
                        {guest.plus_one && `+1: ${guest.plus_one_name}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded border ${getRSVPColor(guest.rsvp_status)}`}>
                        {guest.rsvp_status}
                      </span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => updateGuestRSVP(guest.id, "confirmed")}
                        className="text-green-400 hover:text-green-600"
                      >
                        ✓
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => updateGuestRSVP(guest.id, "declined")}
                        className="text-red-400 hover:text-red-600"
                      >
                        ✗
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteItem("guest", guest.id)}>
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vendor Form */}
      {showVendorForm && (
        <Card className="bg-[#141415] border border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Add Vendor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addVendor} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendor_name" className="text-white">Vendor Name *</Label>
                  <Input
                    id="vendor_name"
                    value={newVendor.name}
                    onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Vendor name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vendor_category" className="text-white">Category *</Label>
                  <Select value={newVendor.category} onValueChange={(value) => setNewVendor({ ...newVendor, category: value })}>
                    <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#18181b] text-white">
                      {vendorCategories.map((category) => (
                        <SelectItem key={category} value={category} className="text-white">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendor_contact" className="text-white">Contact Person *</Label>
                  <Input
                    id="vendor_contact"
                    value={newVendor.contact}
                    onChange={(e) => setNewVendor({ ...newVendor, contact: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Contact person name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vendor_status" className="text-white">Status</Label>
                  <Select value={newVendor.status} onValueChange={(value: "contacted" | "quoted" | "booked" | "paid") => setNewVendor({ ...newVendor, status: value })}>
                    <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#18181b] text-white">
                      <SelectItem value="contacted" className="text-white">Contacted</SelectItem>
                      <SelectItem value="quoted" className="text-white">Quoted</SelectItem>
                      <SelectItem value="booked" className="text-white">Booked</SelectItem>
                      <SelectItem value="paid" className="text-white">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="vendor_cost" className="text-white">Total Cost</Label>
                  <Input
                    id="vendor_cost"
                    type="number"
                    value={newVendor.cost}
                    onChange={(e) => setNewVendor({ ...newVendor, cost: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Total cost"
                  />
                </div>
                <div>
                  <Label htmlFor="vendor_deposit" className="text-white">Deposit Paid</Label>
                  <Input
                    id="vendor_deposit"
                    type="number"
                    value={newVendor.deposit_paid}
                    onChange={(e) => setNewVendor({ ...newVendor, deposit_paid: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Deposit amount"
                  />
                </div>
                <div>
                  <Label htmlFor="vendor_balance" className="text-white">Balance Due</Label>
                  <Input
                    id="vendor_balance"
                    type="number"
                    value={newVendor.balance_due}
                    onChange={(e) => setNewVendor({ ...newVendor, balance_due: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Remaining balance"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendor_email" className="text-white">Email</Label>
                  <Input
                    id="vendor_email"
                    type="email"
                    value={newVendor.email}
                    onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Vendor email"
                  />
                </div>
                <div>
                  <Label htmlFor="vendor_phone" className="text-white">Phone</Label>
                  <Input
                    id="vendor_phone"
                    value={newVendor.phone}
                    onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Vendor phone"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="vendor_notes" className="text-white">Notes</Label>
                <Textarea
                  id="vendor_notes"
                  value={newVendor.notes}
                  onChange={(e) => setNewVendor({ ...newVendor, notes: e.target.value })}
                  className="bg-[#1A1A1B] border-gray-700 text-white"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Vendor"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowVendorForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Task Form */}
      {showTaskForm && (
        <Card className="bg-[#141415] border border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Add Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addTask} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="task_title" className="text-white">Task Title *</Label>
                  <Input
                    id="task_title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Task title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="task_due_date" className="text-white">Due Date *</Label>
                  <Input
                    id="task_due_date"
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="task_category" className="text-white">Category</Label>
                  <Select value={newTask.category} onValueChange={(value) => setNewTask({ ...newTask, category: value })}>
                    <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#18181b] text-white">
                      {taskCategories.map((category) => (
                        <SelectItem key={category} value={category} className="text-white">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="task_priority" className="text-white">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(value: "low" | "medium" | "high") => setNewTask({ ...newTask, priority: value })}>
                    <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#18181b] text-white">
                      {priorities.map((priority) => (
                        <SelectItem key={priority} value={priority} className="text-white">
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="task_notes" className="text-white">Notes</Label>
                <Textarea
                  id="task_notes"
                  value={newTask.notes}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  className="bg-[#1A1A1B] border-gray-700 text-white"
                  placeholder="Task details..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Task"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowTaskForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Guest Form */}
      {showGuestForm && (
        <Card className="bg-[#141415] border border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Add Guest</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addGuest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="guest_name" className="text-white">Guest Name *</Label>
                  <Input
                    id="guest_name"
                    value={newGuest.name}
                    onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Guest name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="guest_email" className="text-white">Email</Label>
                  <Input
                    id="guest_email"
                    type="email"
                    value={newGuest.email}
                    onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Guest email"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="guest_phone" className="text-white">Phone</Label>
                  <Input
                    id="guest_phone"
                    value={newGuest.phone}
                    onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Guest phone"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="guest_plus_one"
                    checked={newGuest.plus_one}
                    onCheckedChange={(checked) => setNewGuest({ ...newGuest, plus_one: checked as boolean })}
                  />
                  <Label htmlFor="guest_plus_one" className="text-white">Plus One</Label>
                </div>
              </div>
              {newGuest.plus_one && (
                <div>
                  <Label htmlFor="plus_one_name" className="text-white">Plus One Name</Label>
                  <Input
                    id="plus_one_name"
                    value={newGuest.plus_one_name}
                    onChange={(e) => setNewGuest({ ...newGuest, plus_one_name: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Plus one name"
                  />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="guest_dietary" className="text-white">Dietary Restrictions</Label>
                  <Input
                    id="guest_dietary"
                    value={newGuest.dietary_restrictions}
                    onChange={(e) => setNewGuest({ ...newGuest, dietary_restrictions: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Dietary restrictions"
                  />
                </div>
                <div>
                  <Label htmlFor="guest_notes" className="text-white">Notes</Label>
                  <Input
                    id="guest_notes"
                    value={newGuest.notes}
                    onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Additional notes"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Guest"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowGuestForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
