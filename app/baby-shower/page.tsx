"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Trash2, Gift, Users, Cake, Calendar, Baby, Check, X } from "lucide-react"
import Link from "next/link"
import { format, parseISO, differenceInDays } from "date-fns"
import { supabase } from "@/lib/supabaseClient"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

type BabyShowerInfo = {
  id: string
  user_id: string
  event_date: string
  venue: string
  theme: string
  budget: number
  guest_count: number
  notes?: string
  created_at?: string
}

type BabyShowerGuest = {
  id: string
  user_id: string
  name: string
  email?: string
  phone?: string
  rsvp_status: "pending" | "confirmed" | "declined"
  dietary_restrictions?: string
  plus_one: boolean
  plus_one_name?: string
  notes?: string
  created_at?: string
}

type GiftItem = {
  id: string
  user_id: string
  name: string
  category: string
  price: number
  purchased: boolean
  purchased_by?: string
  notes?: string
  created_at?: string
}

type FoodItem = {
  id: string
  user_id: string
  name: string
  category: string
  quantity: string
  assigned_to?: string
  notes?: string
  created_at?: string
}

type DecorationItem = {
  id: string
  user_id: string
  name: string
  category: string
  cost: number
  purchased: boolean
  notes?: string
  created_at?: string
}

const giftCategories = [
  "Clothing", "Toys", "Books", "Nursery", "Bath & Care", "Feeding", "Safety", "Transport", "Other"
]

const foodCategories = [
  "Appetizers", "Main Course", "Desserts", "Beverages", "Snacks", "Other"
]

const decorationCategories = [
  "Balloons", "Banners", "Centerpieces", "Tableware", "Lighting", "Other"
]

export default function BabyShowerPage() {
  const [showerInfo, setShowerInfo] = useState<BabyShowerInfo | null>(null)
  const [guests, setGuests] = useState<BabyShowerGuest[]>([])
  const [gifts, setGifts] = useState<GiftItem[]>([])
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [decorations, setDecorations] = useState<DecorationItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Form states
  const [showShowerForm, setShowShowerForm] = useState(false)
  const [newShower, setNewShower] = useState({ event_date: "", venue: "", theme: "", budget: "", guest_count: "", notes: "" })
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [newGuest, setNewGuest] = useState({ name: "", email: "", phone: "", dietary_restrictions: "", plus_one: false, plus_one_name: "", notes: "" })
  const [showGiftForm, setShowGiftForm] = useState(false)
  const [newGift, setNewGift] = useState({ name: "", category: "", price: "", notes: "" })
  const [showFoodForm, setShowFoodForm] = useState(false)
  const [newFood, setNewFood] = useState({ name: "", category: "", quantity: "", assigned_to: "", notes: "" })
  const [showDecorationForm, setShowDecorationForm] = useState(false)
  const [newDecoration, setNewDecoration] = useState({ name: "", category: "", cost: "", notes: "" })

  useEffect(() => {
    const getUserAndData = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view baby shower data.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      
      await Promise.all([
        fetchShowerInfo(user.id),
        fetchGuests(user.id),
        fetchGifts(user.id),
        fetchFood(user.id),
        fetchDecorations(user.id)
      ])
      
      setLoading(false)
    }
    getUserAndData()
  }, [])

  const fetchShowerInfo = async (uid: string) => {
    const { data, error } = await supabase
      .from("baby_shower_info")
      .select("*")
      .eq("user_id", uid)
      .single()
    if (!error && data) {
      setShowerInfo(data)
    }
  }

  const fetchGuests = async (uid: string) => {
    const { data, error } = await supabase
      .from("baby_shower_guests")
      .select("*")
      .eq("user_id", uid)
      .order("name", { ascending: true })
    if (!error) {
      setGuests(data || [])
    }
  }

  const fetchGifts = async (uid: string) => {
    const { data, error } = await supabase
      .from("baby_shower_gifts")
      .select("*")
      .eq("user_id", uid)
      .order("category", { ascending: true })
    if (!error) {
      setGifts(data || [])
    }
  }

  const fetchFood = async (uid: string) => {
    const { data, error } = await supabase
      .from("baby_shower_food")
      .select("*")
      .eq("user_id", uid)
      .order("category", { ascending: true })
    if (!error) {
      setFoodItems(data || [])
    }
  }

  const fetchDecorations = async (uid: string) => {
    const { data, error } = await supabase
      .from("baby_shower_decorations")
      .select("*")
      .eq("user_id", uid)
      .order("category", { ascending: true })
    if (!error) {
      setDecorations(data || [])
    }
  }

  const addShowerInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !newShower.event_date || !newShower.venue) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from("baby_shower_info")
      .insert([{
        user_id: userId,
        event_date: newShower.event_date,
        venue: newShower.venue,
        theme: newShower.theme || null,
        budget: parseFloat(newShower.budget) || 0,
        guest_count: parseInt(newShower.guest_count) || 0,
        notes: newShower.notes || null
      }])
      .select()
      .single()
    
    if (error) {
      setError("Failed to add baby shower info.")
    } else {
      setShowerInfo(data)
      setShowShowerForm(false)
      setNewShower({ event_date: "", venue: "", theme: "", budget: "", guest_count: "", notes: "" })
    }
    setLoading(false)
  }

  const addGuest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !newGuest.name) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from("baby_shower_guests")
      .insert([{
        user_id: userId,
        name: newGuest.name,
        email: newGuest.email || null,
        phone: newGuest.phone || null,
        rsvp_status: "pending",
        dietary_restrictions: newGuest.dietary_restrictions || null,
        plus_one: newGuest.plus_one,
        plus_one_name: newGuest.plus_one_name || null,
        notes: newGuest.notes || null
      }])
      .select()
    
    if (error) {
      setError("Failed to add guest.")
    } else {
      setGuests(prev => [...prev, ...(data || [])])
      setShowGuestForm(false)
      setNewGuest({ name: "", email: "", phone: "", dietary_restrictions: "", plus_one: false, plus_one_name: "", notes: "" })
    }
    setLoading(false)
  }

  const addGift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !newGift.name || !newGift.category) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from("baby_shower_gifts")
      .insert([{
        user_id: userId,
        name: newGift.name,
        category: newGift.category,
        price: parseFloat(newGift.price) || 0,
        purchased: false,
        notes: newGift.notes || null
      }])
      .select()
    
    if (error) {
      setError("Failed to add gift.")
    } else {
      setGifts(prev => [...prev, ...(data || [])])
      setShowGiftForm(false)
      setNewGift({ name: "", category: "", price: "", notes: "" })
    }
    setLoading(false)
  }

  const addFood = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !newFood.name || !newFood.category) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from("baby_shower_food")
      .insert([{
        user_id: userId,
        name: newFood.name,
        category: newFood.category,
        quantity: newFood.quantity || null,
        assigned_to: newFood.assigned_to || null,
        notes: newFood.notes || null
      }])
      .select()
    
    if (error) {
      setError("Failed to add food item.")
    } else {
      setFoodItems(prev => [...prev, ...(data || [])])
      setShowFoodForm(false)
      setNewFood({ name: "", category: "", quantity: "", assigned_to: "", notes: "" })
    }
    setLoading(false)
  }

  const addDecoration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !newDecoration.name || !newDecoration.category) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from("baby_shower_decorations")
      .insert([{
        user_id: userId,
        name: newDecoration.name,
        category: newDecoration.category,
        cost: parseFloat(newDecoration.cost) || 0,
        purchased: false,
        notes: newDecoration.notes || null
      }])
      .select()
    
    if (error) {
      setError("Failed to add decoration.")
    } else {
      setDecorations(prev => [...prev, ...(data || [])])
      setShowDecorationForm(false)
      setNewDecoration({ name: "", category: "", cost: "", notes: "" })
    }
    setLoading(false)
  }

  const toggleGiftPurchased = async (id: string, purchased: boolean) => {
    const { data, error } = await supabase
      .from("baby_shower_gifts")
      .update({ purchased: !purchased })
      .eq("id", id)
      .select()
    
    if (!error && data) {
      setGifts(prev => prev.map(gift => gift.id === id ? data[0] : gift))
    }
  }

  const toggleDecorationPurchased = async (id: string, purchased: boolean) => {
    const { data, error } = await supabase
      .from("baby_shower_decorations")
      .update({ purchased: !purchased })
      .eq("id", id)
      .select()
    
    if (!error && data) {
      setDecorations(prev => prev.map(dec => dec.id === id ? data[0] : dec))
    }
  }

  const updateGuestRSVP = async (id: string, status: "confirmed" | "declined") => {
    const { data, error } = await supabase
      .from("baby_shower_guests")
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
      case "guest":
        error = (await supabase.from("baby_shower_guests").delete().eq("id", id)).error
        if (!error) setGuests(prev => prev.filter(g => g.id !== id))
        break
      case "gift":
        error = (await supabase.from("baby_shower_gifts").delete().eq("id", id)).error
        if (!error) setGifts(prev => prev.filter(g => g.id !== id))
        break
      case "food":
        error = (await supabase.from("baby_shower_food").delete().eq("id", id)).error
        if (!error) setFoodItems(prev => prev.filter(f => f.id !== id))
        break
      case "decoration":
        error = (await supabase.from("baby_shower_decorations").delete().eq("id", id)).error
        if (!error) setDecorations(prev => prev.filter(d => d.id !== id))
        break
    }
    
    if (error) {
      setError("Failed to delete item.")
    }
    setLoading(false)
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
        <Baby className="mr-3 text-blue-400" /> Baby Shower Planning
      </h1>
      
      {/* Baby Shower Overview */}
      {!showerInfo ? (
        <Card className="bg-[#141415] border border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Baby className="mr-2 h-5 w-5" /> Start Planning Your Baby Shower
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowShowerForm(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Add Baby Shower Information
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-[#141415] border border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Baby className="mr-2 h-5 w-5" /> Baby Shower Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-[#1A1A1B] rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {format(parseISO(showerInfo.event_date), "MMM d")}
                </div>
                <div className="text-sm text-gray-400">Event Date</div>
              </div>
              <div className="text-center p-3 bg-[#1A1A1B] rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {differenceInDays(parseISO(showerInfo.event_date), new Date())}
                </div>
                <div className="text-sm text-gray-400">Days Until</div>
              </div>
              <div className="text-center p-3 bg-[#1A1A1B] rounded-lg">
                <div className="text-2xl font-bold text-purple-400">
                  ${showerInfo.budget.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Budget</div>
              </div>
              <div className="text-center p-3 bg-[#1A1A1B] rounded-lg">
                <div className="text-2xl font-bold text-pink-400">
                  {showerInfo.guest_count}
                </div>
                <div className="text-sm text-gray-400">Guests</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-white mb-2">Venue</div>
              <div className="text-xl text-blue-400 font-bold">{showerInfo.venue}</div>
              {showerInfo.theme && (
                <div className="mt-2">
                  <div className="text-sm text-gray-400">Theme</div>
                  <div className="text-lg text-pink-400 font-semibold">{showerInfo.theme}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Baby Shower Info Form */}
      {showShowerForm && (
        <Card className="bg-[#141415] border border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Add Baby Shower Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addShowerInfo} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event_date" className="text-white">Event Date *</Label>
                  <Input
                    id="event_date"
                    type="date"
                    value={newShower.event_date}
                    onChange={(e) => setNewShower({ ...newShower, event_date: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="venue" className="text-white">Venue *</Label>
                  <Input
                    id="venue"
                    value={newShower.venue}
                    onChange={(e) => setNewShower({ ...newShower, venue: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Event venue"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="theme" className="text-white">Theme</Label>
                  <Input
                    id="theme"
                    value={newShower.theme}
                    onChange={(e) => setNewShower({ ...newShower, theme: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Baby shower theme"
                  />
                </div>
                <div>
                  <Label htmlFor="budget" className="text-white">Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={newShower.budget}
                    onChange={(e) => setNewShower({ ...newShower, budget: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Total budget"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="guest_count" className="text-white">Expected Guest Count</Label>
                  <Input
                    id="guest_count"
                    type="number"
                    value={newShower.guest_count}
                    onChange={(e) => setNewShower({ ...newShower, guest_count: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Number of guests"
                  />
                </div>
                <div>
                  <Label htmlFor="notes" className="text-white">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={newShower.notes}
                    onChange={(e) => setNewShower({ ...newShower, notes: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Baby Shower Info"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowShowerForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Guests */}
        <Card className="bg-[#141415] border border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Users className="mr-2 h-5 w-5 text-purple-400" /> Guests
            </CardTitle>
            <Button size="sm" onClick={() => setShowGuestForm(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {guests.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No guests added yet</p>
            ) : (
              guests.map((guest) => (
                <div key={guest.id} className="p-2 bg-[#1A1A1B] rounded border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-medium">{guest.name}</div>
                      <div className="text-sm text-gray-400">
                        {guest.email && `${guest.email} • `}
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
          </CardContent>
        </Card>

        {/* Gifts */}
        <Card className="bg-[#141415] border border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Gift className="mr-2 h-5 w-5 text-pink-400" /> Gift Registry
            </CardTitle>
            <Button size="sm" onClick={() => setShowGiftForm(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {gifts.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No gifts added yet</p>
            ) : (
              gifts.map((gift) => (
                <div key={gift.id} className="p-2 bg-[#1A1A1B] rounded border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-medium">{gift.name}</div>
                      <div className="text-sm text-gray-400">
                        {gift.category} • ${gift.price.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={gift.purchased}
                        onCheckedChange={() => toggleGiftPurchased(gift.id, gift.purchased)}
                      />
                      <Button size="sm" variant="ghost" onClick={() => deleteItem("gift", gift.id)}>
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

      {/* Food and Decorations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Food */}
        <Card className="bg-[#141415] border border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Cake className="mr-2 h-5 w-5 text-yellow-400" /> Food & Drinks
            </CardTitle>
            <Button size="sm" onClick={() => setShowFoodForm(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {foodItems.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No food items added yet</p>
            ) : (
              foodItems.map((food) => (
                <div key={food.id} className="p-2 bg-[#1A1A1B] rounded border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-medium">{food.name}</div>
                      <div className="text-sm text-gray-400">
                        {food.category} • {food.quantity}
                        {food.assigned_to && ` • Assigned to: ${food.assigned_to}`}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => deleteItem("food", food.id)}>
                      <Trash2 className="h-3 w-3 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Decorations */}
        <Card className="bg-[#141415] border border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Baby className="mr-2 h-5 w-5 text-blue-400" /> Decorations
            </CardTitle>
            <Button size="sm" onClick={() => setShowDecorationForm(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {decorations.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No decorations added yet</p>
            ) : (
              decorations.map((decoration) => (
                <div key={decoration.id} className="p-2 bg-[#1A1A1B] rounded border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-medium">{decoration.name}</div>
                      <div className="text-sm text-gray-400">
                        {decoration.category} • ${decoration.cost.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={decoration.purchased}
                        onCheckedChange={() => toggleDecorationPurchased(decoration.id, decoration.purchased)}
                      />
                      <Button size="sm" variant="ghost" onClick={() => deleteItem("decoration", decoration.id)}>
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
                    className="bg-[#1A1B] border-gray-700 text-white"
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

      {/* Gift Form */}
      {showGiftForm && (
        <Card className="bg-[#141415] border border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Add Gift</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addGift} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gift_name" className="text-white">Gift Name *</Label>
                  <Input
                    id="gift_name"
                    value={newGift.name}
                    onChange={(e) => setNewGift({ ...newGift, name: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Gift name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="gift_category" className="text-white">Category *</Label>
                  <Select value={newGift.category} onValueChange={(value) => setNewGift({ ...newGift, category: value })}>
                    <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#18181b] text-white">
                      {giftCategories.map((category) => (
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
                  <Label htmlFor="gift_price" className="text-white">Price</Label>
                  <Input
                    id="gift_price"
                    type="number"
                    value={newGift.price}
                    onChange={(e) => setNewGift({ ...newGift, price: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Gift price"
                  />
                </div>
                <div>
                  <Label htmlFor="gift_notes" className="text-white">Notes</Label>
                  <Input
                    id="gift_notes"
                    value={newGift.notes}
                    onChange={(e) => setNewGift({ ...newGift, notes: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Additional notes"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Gift"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowGiftForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Food Form */}
      {showFoodForm && (
        <Card className="bg-[#141415] border border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Add Food Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addFood} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="food_name" className="text-white">Food Name *</Label>
                  <Input
                    id="food_name"
                    value={newFood.name}
                    onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Food item name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="food_category" className="text-white">Category *</Label>
                  <Select value={newFood.category} onValueChange={(value) => setNewFood({ ...newFood, category: value })}>
                    <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#18181b] text-white">
                      {foodCategories.map((category) => (
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
                  <Label htmlFor="food_quantity" className="text-white">Quantity</Label>
                  <Input
                    id="food_quantity"
                    value={newFood.quantity}
                    onChange={(e) => setNewFood({ ...newFood, quantity: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Amount needed"
                  />
                </div>
                <div>
                  <Label htmlFor="food_assigned" className="text-white">Assigned To</Label>
                  <Input
                    id="food_assigned"
                    value={newFood.assigned_to}
                    onChange={(e) => setNewFood({ ...newFood, assigned_to: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Who's bringing this?"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="food_notes" className="text-white">Notes</Label>
                <Textarea
                  id="food_notes"
                  value={newFood.notes}
                  onChange={(e) => setNewFood({ ...newFood, notes: e.target.value })}
                  className="bg-[#1A1A1B] border-gray-700 text-white"
                  placeholder="Special instructions..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Food Item"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowFoodForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Decoration Form */}
      {showDecorationForm && (
        <Card className="bg-[#141415] border border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Add Decoration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addDecoration} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="decoration_name" className="text-white">Decoration Name *</Label>
                  <Input
                    id="decoration_name"
                    value={newDecoration.name}
                    onChange={(e) => setNewDecoration({ ...newDecoration, name: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Decoration name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="decoration_category" className="text-white">Category *</Label>
                  <Select value={newDecoration.category} onValueChange={(value) => setNewDecoration({ ...newDecoration, category: value })}>
                    <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#18181b] text-white">
                      {decorationCategories.map((category) => (
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
                  <Label htmlFor="decoration_cost" className="text-white">Cost</Label>
                  <Input
                    id="decoration_cost"
                    type="number"
                    value={newDecoration.cost}
                    onChange={(e) => setNewDecoration({ ...newDecoration, cost: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Decoration cost"
                  />
                </div>
                <div>
                  <Label htmlFor="decoration_notes" className="text-white">Notes</Label>
                  <Input
                    id="decoration_notes"
                    value={newDecoration.notes}
                    onChange={(e) => setNewDecoration({ ...newDecoration, notes: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Additional notes"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Decoration"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowDecorationForm(false)}>
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
