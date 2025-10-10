"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2, Repeat, Edit2, Check, X } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

type Expense = {
  id: string
  user_id: string
  description: string
  amount: number
  category: string
  expense_date: string
  created_at?: string
}

type Subscription = {
  id: string
  user_id: string
  name: string
  amount: number
  billing_cycle: string
  next_billing_date: string
  category: string
  is_active: boolean
  notes?: string
  created_at?: string
  updated_at?: string
}

const categories = [
  "Food",
  "Transportation",
  "Housing",
  "Utilities",
  "Entertainment",
  "Healthcare",
  "Education",
  "Other",
]

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [newExpense, setNewExpense] = useState<Omit<Expense, "id" | "user_id" | "created_at">>({
    description: "",
    amount: 0,
    category: "",
    expense_date: new Date().toISOString().split("T")[0],
  })
  const [newSubscription, setNewSubscription] = useState<Omit<Subscription, "id" | "user_id" | "created_at" | "updated_at">>({
    name: "",
    amount: 0,
    billing_cycle: "monthly",
    next_billing_date: new Date().toISOString().split("T")[0],
    category: "",
    is_active: true,
    notes: "",
  })
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editExpense, setEditExpense] = useState<Omit<Expense, "id" | "user_id" | "created_at"> | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSubscription, setEditSubscription] = useState<Omit<Subscription, "id" | "user_id" | "created_at" | "updated_at"> | null>(null);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);

  useEffect(() => {
    const getUserAndData = async () => {
      console.log("🔄 Fetching user and data...")
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error("❌ User not authenticated:", userError)
        return
      }
      console.log("✅ User authenticated:", user.id)
      setUserId(user.id)
      
      // Fetch expenses
      console.log("📥 Fetching expenses...")
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (expensesError) {
        console.error("❌ Error fetching expenses:", expensesError)
      } else if (expensesData) {
        console.log("✅ Expenses loaded:", expensesData.length, "items")
        setExpenses(expensesData)
      }
      
      // Fetch subscriptions
      console.log("📥 Fetching subscriptions...")
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (subscriptionsError) {
        console.error("❌ Error fetching subscriptions:", subscriptionsError)
      } else if (subscriptionsData) {
        console.log("✅ Subscriptions loaded:", subscriptionsData.length, "items")
        setSubscriptions(subscriptionsData)
      }
    }
    getUserAndData()
  }, [])

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🚀 addExpense called")
    console.log("📌 userId:", userId)
    console.log("📝 newExpense:", newExpense)
    
    if (!userId) {
      console.error("❌ No userId found - user not authenticated")
      alert("Error: User not authenticated. Please log in.")
      return
    }
    
    if (!newExpense.description || !newExpense.amount || !newExpense.category) {
      console.error("❌ Validation failed:")
      console.log("  - Description:", newExpense.description || "MISSING")
      console.log("  - Amount:", newExpense.amount || "MISSING")
      console.log("  - Category:", newExpense.category || "MISSING")
      alert("Please fill in all required fields (description, amount, and category)")
      return
    }
    
    console.log("✅ Validation passed, inserting expense...")
    
    const expenseData = {
      user_id: userId,
      description: newExpense.description,
      amount: newExpense.amount,
      category: newExpense.category,
      expense_date: newExpense.expense_date,
    }
    console.log("📤 Inserting data:", expenseData)
    
    const { data, error } = await supabase
      .from("expenses")
      .insert([expenseData])
      .select()
    
    if (error) {
      console.error("❌ Supabase error:", error)
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      alert(`Error adding expense: ${error.message}\n\nDetails: ${error.details || 'No details'}\n\nHint: ${error.hint || 'No hint'}`)
      return
    }
    
    if (data) {
      console.log("✅ Expense added successfully:", data)
      setExpenses([data[0], ...expenses])
      setNewExpense({
        description: "",
        amount: 0,
        category: "",
        expense_date: new Date().toISOString().split("T")[0],
      })
      alert("Expense added successfully!")
    } else {
      console.error("⚠️ No data returned from insert")
    }
  }

  const deleteExpense = async (id: string) => {
    if (!userId) return
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
    
    if (!error) {
      setExpenses(expenses.filter((expense) => expense.id !== id))
    }
  }

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setEditExpense({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      expense_date: expense.expense_date,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditExpense(null);
  };

  const saveEdit = async (id: string) => {
    if (!editExpense || !userId) return;
    const { error } = await supabase
      .from("expenses")
      .update({
        description: editExpense.description,
        amount: editExpense.amount,
        category: editExpense.category,
        expense_date: editExpense.expense_date,
      })
      .eq("id", id)
      .eq("user_id", userId)
    
    if (!error) {
      setExpenses((prev) =>
        prev.map((exp) =>
          exp.id === id ? { ...exp, ...editExpense } : exp
        )
      );
      setEditingId(null);
      setEditExpense(null);
    }
  };

  const addSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    if (newSubscription.name && newSubscription.amount && newSubscription.category) {
      const { data, error } = await supabase
        .from("subscriptions")
        .insert([{
          user_id: userId,
          name: newSubscription.name,
          amount: newSubscription.amount,
          billing_cycle: newSubscription.billing_cycle,
          next_billing_date: newSubscription.next_billing_date,
          category: newSubscription.category,
          is_active: newSubscription.is_active,
          notes: newSubscription.notes,
        }])
        .select()
      
      if (!error && data) {
        setSubscriptions([...subscriptions, data[0]])
        setNewSubscription({
          name: "",
          amount: 0,
          billing_cycle: "monthly",
          next_billing_date: new Date().toISOString().split("T")[0],
          category: "",
          is_active: true,
          notes: "",
        })
        setShowSubscriptionForm(false)
      }
    }
  }

  const deleteSubscription = async (id: string) => {
    if (!userId) return
    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
    
    if (!error) {
      setSubscriptions(subscriptions.filter((subscription) => subscription.id !== id))
    }
  }

  const startEditSubscription = (subscription: Subscription) => {
    setEditingSubId(subscription.id);
    setEditSubscription({
      name: subscription.name,
      amount: subscription.amount,
      billing_cycle: subscription.billing_cycle,
      next_billing_date: subscription.next_billing_date,
      category: subscription.category,
      is_active: subscription.is_active,
      notes: subscription.notes || "",
    });
  };

  const cancelEditSubscription = () => {
    setEditingSubId(null);
    setEditSubscription(null);
  };

  const saveEditSubscription = async (id: string) => {
    if (!editSubscription || !userId) return;
    const { error } = await supabase
      .from("subscriptions")
      .update({
        name: editSubscription.name,
        amount: editSubscription.amount,
        billing_cycle: editSubscription.billing_cycle,
        next_billing_date: editSubscription.next_billing_date,
        category: editSubscription.category,
        is_active: editSubscription.is_active,
        notes: editSubscription.notes,
      })
      .eq("id", id)
      .eq("user_id", userId)
    
    if (!error) {
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.id === id ? { ...sub, ...editSubscription } : sub
        )
      );
      setEditingSubId(null);
      setEditSubscription(null);
    }
  };

  const toggleSubscriptionStatus = async (id: string) => {
    if (!userId) return
    const subscription = subscriptions.find(sub => sub.id === id)
    if (!subscription) return
    
    const { error } = await supabase
      .from("subscriptions")
      .update({ is_active: !subscription.is_active })
      .eq("id", id)
      .eq("user_id", userId)
    
    if (!error) {
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.id === id ? { ...sub, is_active: !sub.is_active } : sub
        )
      );
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalMonthlySubscriptions = subscriptions
    .filter(sub => sub.is_active)
    .reduce((sum, sub) => {
      if (sub.billing_cycle === 'monthly') return sum + sub.amount;
      if (sub.billing_cycle === 'yearly') return sum + (sub.amount / 12);
      if (sub.billing_cycle === 'weekly') return sum + (sub.amount * 4.33);
      return sum + sub.amount;
    }, 0)

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4">Expenses</h1>
      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Plus className="mr-2" />
            Add New Expense
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addExpense} className="space-y-4">
            <div>
              <Label htmlFor="description" className="text-white">
                Description
              </Label>
              <Input
                id="description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                className="bg-[#1A1A1B] border-gray-700 text-white"
                placeholder="Enter expense description"
              />
            </div>
            <div>
              <Label htmlFor="amount" className="text-white">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: Number.parseFloat(e.target.value) })}
                className="bg-[#1A1A1B] border-gray-700 text-white"
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label htmlFor="category" className="text-white">
                Category
              </Label>
              <Select
                value={newExpense.category}
                onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
              >
                <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expense_date" className="text-white">
                Date
              </Label>
              <Input
                id="expense_date"
                type="date"
                value={newExpense.expense_date}
                onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                className="bg-[#1A1A1B] border-gray-700 text-white"
              />
            </div>
            <Button type="submit" className="w-full">
              Add Expense
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Subscriptions Section */}
      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center">
              <Repeat className="mr-2" />
              Subscriptions & Bills
            </span>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                Monthly Total: ${totalMonthlySubscriptions.toFixed(2)}
              </span>
              <Button
                onClick={() => setShowSubscriptionForm(!showSubscriptionForm)}
                className="bg-gradient-to-r from-green-500 to-white hover:from-green-600 hover:to-gray-100 text-gray-800 font-semibold"
              >
                <Plus className="mr-2 h-4 w-4" />
                {showSubscriptionForm ? 'Cancel' : 'Add Subscription'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showSubscriptionForm && (
            <form onSubmit={addSubscription} className="space-y-4 mb-6 p-4 bg-[#1A1A1B] rounded-lg border border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subName" className="text-white">
                    Subscription Name
                  </Label>
                  <Input
                    id="subName"
                    value={newSubscription.name}
                    onChange={(e) => setNewSubscription({ ...newSubscription, name: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="e.g., Netflix, Gym Membership"
                  />
                </div>
                <div>
                  <Label htmlFor="subAmount" className="text-white">
                    Amount
                  </Label>
                  <Input
                    id="subAmount"
                    type="number"
                    step="0.01"
                    value={newSubscription.amount}
                    onChange={(e) => setNewSubscription({ ...newSubscription, amount: Number.parseFloat(e.target.value) })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="subBillingCycle" className="text-white">
                    Billing Cycle
                  </Label>
                  <Select
                    value={newSubscription.billing_cycle}
                    onValueChange={(value) => setNewSubscription({ ...newSubscription, billing_cycle: value })}
                  >
                    <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                      <SelectValue placeholder="Select billing cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subNextBilling" className="text-white">
                    Next Billing Date
                  </Label>
                  <Input
                    id="subNextBilling"
                    type="date"
                    value={newSubscription.next_billing_date}
                    onChange={(e) => setNewSubscription({ ...newSubscription, next_billing_date: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="subCategory" className="text-white">
                    Category
                  </Label>
                  <Select
                    value={newSubscription.category}
                    onValueChange={(value) => setNewSubscription({ ...newSubscription, category: value })}
                  >
                    <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subNotes" className="text-white">
                    Notes (Optional)
                  </Label>
                  <Input
                    id="subNotes"
                    value={newSubscription.notes}
                    onChange={(e) => setNewSubscription({ ...newSubscription, notes: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Additional details..."
                  />
                </div>
              </div>
              <Button type="submit" className="bg-gradient-to-r from-green-500 to-white hover:from-green-600 hover:to-gray-100 text-gray-800 font-semibold">
                Add Subscription
              </Button>
            </form>
          )}

          {subscriptions.length === 0 ? (
            <p className="text-gray-400">No subscriptions added yet.</p>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="bg-[#1A1A1B] p-3 rounded-lg border border-gray-700">
                  {editingSubId === subscription.id && editSubscription ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          value={editSubscription.name}
                          onChange={e => setEditSubscription({ ...editSubscription, name: e.target.value })}
                          className="bg-[#232325] !text-white"
                          placeholder="Name"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          value={editSubscription.amount}
                          onChange={e => setEditSubscription({ ...editSubscription, amount: Number.parseFloat(e.target.value) })}
                          className="bg-[#232325] !text-white"
                          placeholder="Amount"
                        />
                        <Select
                          value={editSubscription.billing_cycle}
                          onValueChange={value => setEditSubscription({ ...editSubscription, billing_cycle: value })}
                        >
                          <SelectTrigger className="bg-[#232325] border-gray-700 !text-white">
                            <SelectValue placeholder="Billing Cycle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={editSubscription.next_billing_date}
                          onChange={e => setEditSubscription({ ...editSubscription, next_billing_date: e.target.value })}
                          className="bg-[#232325] !text-white"
                        />
                        <Select
                          value={editSubscription.category}
                          onValueChange={value => setEditSubscription({ ...editSubscription, category: value })}
                        >
                          <SelectTrigger className="bg-[#232325] border-gray-700 !text-white">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={editSubscription.notes || ""}
                          onChange={e => setEditSubscription({ ...editSubscription, notes: e.target.value })}
                          className="bg-[#232325] !text-white"
                          placeholder="Notes"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEditSubscription(subscription.id)} className="bg-green-600 hover:bg-green-700">
                          <Check className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditSubscription}>
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{subscription.name}</h3>
                                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          subscription.is_active 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-600 text-gray-300'
                        }`}>
                          {subscription.is_active ? 'Active' : 'Inactive'}
                        </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          ${subscription.amount.toFixed(2)} • {subscription.billing_cycle} • {subscription.category}
                        </p>
                        <p className="text-sm text-gray-400">
                          Next billing: {subscription.next_billing_date}
                          {subscription.notes && (
                            <span className="ml-2">• {subscription.notes}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleSubscriptionStatus(subscription.id)}
                          className={subscription.is_active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}
                        >
                          {subscription.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditSubscription(subscription)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteSubscription(subscription.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Expense List</span>
            <span>Total: ${totalExpenses.toFixed(2)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-gray-400">No expenses recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {expenses.map((expense) => (
                <li key={expense.id} className="flex items-center justify-between bg-[#1A1A1B] p-2 rounded">
                  {editingId === expense.id && editExpense ? (
                    <>
                      <div className="flex flex-col gap-1 flex-1">
                        <Input
                          value={editExpense.description}
                          onChange={e => setEditExpense({ ...editExpense, description: e.target.value })}
                          className="mb-1 bg-[#232325] !text-white"
                          placeholder="Description"
                        />
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={editExpense.amount}
                            onChange={e => setEditExpense({ ...editExpense, amount: Number.parseFloat(e.target.value) })}
                            className="bg-[#232325] !text-white"
                            placeholder="Amount"
                          />
                          <Select
                            value={editExpense.category}
                            onValueChange={value => setEditExpense({ ...editExpense, category: value })}
                          >
                            <SelectTrigger className="bg-[#232325] border-gray-700 !text-white w-full rounded px-3 py-2">
                              <SelectValue placeholder="Category" className="!text-white !placeholder:text-gray-400" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-[#18181b] dark:text-white bg-[#18181b] text-white">
                              {categories.map((category) => (
                                <SelectItem key={category} value={category} className="dark:bg-[#18181b] dark:text-white bg-[#18181b] text-white">
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="date"
                            value={editExpense.expense_date}
                            onChange={e => setEditExpense({ ...editExpense, expense_date: e.target.value })}
                            className="bg-[#232325] !text-white"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <Button size="icon" variant="ghost" onClick={() => saveEdit(expense.id)} title="Save" className="text-green-500 hover:text-green-700"><Check className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={cancelEdit} title="Cancel" className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="font-semibold text-white">{expense.description}</p>
                        <p className="text-sm text-gray-400">
                          {expense.category} - {expense.expense_date}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">${expense.amount.toFixed(2)}</span>
                        <Button size="icon" variant="ghost" onClick={() => startEdit(expense)} title="Edit" className="text-blue-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="destructive" size="icon" onClick={() => deleteExpense(expense.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

