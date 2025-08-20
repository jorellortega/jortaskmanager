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
import { format } from "date-fns"

type MealPlan = {
  id: string
  user_id: string
  day: string
  breakfast: string
  lunch: string
  dinner: string
  snacks: string[]
  breakfast_time?: string
  lunch_time?: string
  dinner_time?: string
  created_at?: string
}

type GroceryItem = {
  id: string
  user_id: string
  name: string
  category: string
  quantity: string
  status: 'need_to_buy' | 'already_have'
  created_at?: string
}

export default function MealPlanning() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null)
  const [newPlan, setNewPlan] = useState<Omit<MealPlan, 'id' | 'user_id' | 'created_at'>>({
    day: format(new Date(), "yyyy-MM-dd"),
    breakfast: "",
    lunch: "",
    dinner: "",
    snacks: [],
    breakfast_time: "",
    lunch_time: "",
    dinner_time: ""
  })
  const [newSnack, setNewSnack] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Groceries state
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([])
  const [newGroceryItem, setNewGroceryItem] = useState<Omit<GroceryItem, 'id' | 'user_id' | 'created_at'>>({
    name: "",
    category: "",
    quantity: "",
    status: 'need_to_buy'
  })
  const [groceryTab, setGroceryTab] = useState<'need_to_buy' | 'already_have'>('need_to_buy')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view meal plans.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      
      // Fetch meal plans
      const { data: mealData, error: mealError } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
      
      // Fetch grocery items
      const { data: groceryData, error: groceryError } = await supabase
        .from("grocery_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
      
      if (mealError) {
        setError("Failed to fetch meal plans.")
      } else {
        setMealPlans(mealData || [])
      }
      
      if (groceryError) {
        console.error("Failed to fetch grocery items:", groceryError)
      } else {
        setGroceryItems(groceryData || [])
      }
      
      setLoading(false)
    }
    fetchData()
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
        breakfast_time: newPlan.breakfast_time,
        lunch_time: newPlan.lunch_time,
        dinner_time: newPlan.dinner_time,
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
            breakfast_time: newPlan.breakfast_time,
            lunch_time: newPlan.lunch_time,
            dinner_time: newPlan.dinner_time,
          },
        ])
        .select()
      if (insertError) {
        setError(insertError.message || "Failed to add meal plan. Please try again.")
        console.error('Supabase insert error:', insertError)
      } else if (data && data.length > 0) {
        setMealPlans((prev) => [...prev, data[0]])
        setNewPlan({ 
          day: format(new Date(), "yyyy-MM-dd"), 
          breakfast: "", 
          lunch: "", 
          dinner: "", 
          snacks: [],
          breakfast_time: "",
          lunch_time: "",
          dinner_time: ""
        })
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
        breakfast_time: editingPlan.breakfast_time,
        lunch_time: editingPlan.lunch_time,
        dinner_time: editingPlan.dinner_time,
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

  // Grocery item functions
  const handleAddGroceryItem = async () => {
    if (!userId || !newGroceryItem.name.trim()) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from("grocery_items")
      .insert([{
        user_id: userId,
        name: newGroceryItem.name.trim(),
        category: newGroceryItem.category.trim(),
        quantity: newGroceryItem.quantity.trim(),
        status: newGroceryItem.status
      }])
      .select()
    
    if (error) {
      setError("Failed to add grocery item.")
    } else if (data && data.length > 0) {
      setGroceryItems(prev => [...prev, data[0]])
      setNewGroceryItem({
        name: "",
        category: "",
        quantity: "",
        status: 'need_to_buy'
      })
    }
    setLoading(false)
  }

  const handleDeleteGroceryItem = async (id: string) => {
    setLoading(true)
    const { error } = await supabase
      .from("grocery_items")
      .delete()
      .eq("id", id)
    
    if (error) {
      setError("Failed to delete grocery item.")
    } else {
      setGroceryItems(prev => prev.filter(item => item.id !== id))
    }
    setLoading(false)
  }

  const handleToggleGroceryStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'need_to_buy' ? 'already_have' : 'need_to_buy'
    setLoading(true)
    
    const { error } = await supabase
      .from("grocery_items")
      .update({ status: newStatus })
      .eq("id", id)
    
    if (error) {
      setError("Failed to update grocery item.")
    } else {
      setGroceryItems(prev => prev.map(item => 
        item.id === id ? { ...item, status: newStatus } : item
      ))
    }
    setLoading(false)
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
                      type="date"
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
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-gray-300">Breakfast Time (Optional)</label>
                      <Input
                        type="time"
                        value={newPlan.breakfast_time}
                        onChange={(e) => setNewPlan(prev => ({ ...prev, breakfast_time: e.target.value }))}
                        className="bg-[#1a1a1b] border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-300">Lunch Time (Optional)</label>
                      <Input
                        type="time"
                        value={newPlan.lunch_time}
                        onChange={(e) => setNewPlan(prev => ({ ...prev, lunch_time: e.target.value }))}
                        className="bg-[#1a1a1b] border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-300">Dinner Time (Optional)</label>
                      <Input
                        type="time"
                        value={newPlan.dinner_time}
                        onChange={(e) => setNewPlan(prev => ({ ...prev, dinner_time: e.target.value }))}
                        className="bg-[#1a1a1b] border-gray-700 text-white"
                      />
                    </div>
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
                        type="date"
                        value={editingPlan.day}
                        onChange={(e) => setEditingPlan(prev => prev ? { ...prev, day: e.target.value } : null)}
                        className="bg-[#141415] border-gray-700 text-white w-40"
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
                    {plan.breakfast_time && (
                      <div className="text-sm text-gray-400 ml-4">
                        Time: {plan.breakfast_time}
                      </div>
                    )}
                    {editingPlan?.id === plan.id && (
                      <div className="mt-2">
                        <Input
                          type="time"
                          value={editingPlan.breakfast_time || ""}
                          onChange={(e) => setEditingPlan(prev => prev ? { ...prev, breakfast_time: e.target.value } : null)}
                          className="bg-[#141415] border-gray-700 text-white w-32"
                          placeholder="Time"
                        />
                      </div>
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
                    {plan.lunch_time && (
                      <div className="text-sm text-gray-400 ml-4">
                        Time: {plan.lunch_time}
                      </div>
                    )}
                    {editingPlan?.id === plan.id && (
                      <div className="mt-2">
                        <Input
                          type="time"
                          value={editingPlan.lunch_time || ""}
                          onChange={(e) => setEditingPlan(prev => prev ? { ...prev, lunch_time: e.target.value } : null)}
                          className="bg-[#141415] border-gray-700 text-white w-32"
                          placeholder="Time"
                        />
                      </div>
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
                    {plan.dinner_time && (
                      <div className="text-sm text-gray-400 ml-4">
                        Time: {plan.dinner_time}
                      </div>
                    )}
                    {editingPlan?.id === plan.id && (
                      <div className="mt-2">
                        <Input
                          type="time"
                          value={editingPlan.dinner_time || ""}
                          onChange={(e) => setEditingPlan(prev => prev ? { ...prev, dinner_time: e.target.value } : null)}
                          className="bg-[#141415] border-gray-700 text-white w-32"
                          placeholder="Time"
                        />
                      </div>
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

      {/* Groceries Card */}
      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Groceries
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-[#1a1a1b] text-white border-gray-700 hover:bg-[#2a2a2b]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#141415] border-gray-700 text-white">
                <DialogHeader>
                  <DialogTitle>Add New Grocery Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-300">Item Name</label>
                    <Input
                      value={newGroceryItem.name}
                      onChange={(e) => setNewGroceryItem(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-[#1a1a1b] border-gray-700 text-white"
                      placeholder="e.g., Milk, Bread, Apples"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Category</label>
                    <Input
                      value={newGroceryItem.category}
                      onChange={(e) => setNewGroceryItem(prev => ({ ...prev, category: e.target.value }))}
                      className="bg-[#1a1a1b] border-gray-700 text-white"
                      placeholder="e.g., Dairy, Produce, Pantry"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Quantity</label>
                    <Input
                      value={newGroceryItem.quantity}
                      onChange={(e) => setNewGroceryItem(prev => ({ ...prev, quantity: e.target.value }))}
                      className="bg-[#1a1a1b] border-gray-700 text-white"
                      placeholder="e.g., 1 gallon, 2 loaves, 5 pieces"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Status</label>
                    <select
                      value={newGroceryItem.status}
                      onChange={(e) => setNewGroceryItem(prev => ({ ...prev, status: e.target.value as 'need_to_buy' | 'already_have' }))}
                      className="w-full bg-[#1a1a1b] border border-gray-700 text-white rounded-md px-3 py-2"
                    >
                      <option value="need_to_buy">Need to Buy</option>
                      <option value="already_have">Already Have</option>
                    </select>
                  </div>
                  <Button onClick={handleAddGroceryItem} className="w-full bg-[#1a1a1b] text-white border-gray-700 hover:bg-[#2a2a2b]">
                    Add Item
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Tabs */}
          <div className="flex space-x-1 mb-4 bg-[#1a1a1b] rounded-lg p-1">
            <button
              onClick={() => setGroceryTab('need_to_buy')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                groceryTab === 'need_to_buy'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Need to Buy ({groceryItems.filter(item => item.status === 'need_to_buy').length})
            </button>
            <button
              onClick={() => setGroceryTab('already_have')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                groceryTab === 'already_have'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Already Have ({groceryItems.filter(item => item.status === 'already_have').length})
            </button>
          </div>

          {/* Grocery Items List */}
          <div className="space-y-2">
            {groceryItems
              .filter(item => item.status === groceryTab)
              .map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-[#1a1a1b] p-3 rounded-lg border border-gray-700">
                  <div className="flex-1">
                    <div className="font-medium text-white">{item.name}</div>
                    <div className="text-sm text-gray-400">
                      {item.category} • {item.quantity}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleGroceryStatus(item.id, item.status)}
                      className={`text-xs ${
                        item.status === 'need_to_buy' 
                          ? 'text-green-400 hover:text-green-300' 
                          : 'text-blue-400 hover:text-blue-300'
                      }`}
                    >
                      {item.status === 'need_to_buy' ? 'Mark as Have' : 'Mark as Need'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteGroceryItem(item.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            {groceryItems.filter(item => item.status === groceryTab).length === 0 && (
              <div className="text-center text-gray-400 py-8">
                {groceryTab === 'need_to_buy' 
                  ? 'No items to buy yet. Add some groceries!' 
                  : 'No items marked as already having. Move items here when you buy them!'
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 