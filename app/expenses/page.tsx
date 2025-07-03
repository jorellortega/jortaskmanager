"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Plus, Trash2, Repeat } from "lucide-react"
import Link from "next/link"

type Expense = {
  id: number
  description: string
  amount: number
  category: string
  date: string
  isRecurring: boolean
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
  const [newExpense, setNewExpense] = useState<Omit<Expense, "id">>({
    description: "",
    amount: 0,
    category: "",
    date: new Date().toISOString().split("T")[0],
    isRecurring: false,
  })

  useEffect(() => {
    const storedExpenses = localStorage.getItem("expenses")
    if (storedExpenses) {
      setExpenses(JSON.parse(storedExpenses))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses))
  }, [expenses])

  const addExpense = (e: React.FormEvent) => {
    e.preventDefault()
    if (newExpense.description && newExpense.amount && newExpense.category) {
      setExpenses([...expenses, { ...newExpense, id: Date.now() }])
      setNewExpense({
        description: "",
        amount: 0,
        category: "",
        date: new Date().toISOString().split("T")[0],
        isRecurring: false,
      })
    }
  }

  const deleteExpense = (id: number) => {
    setExpenses(expenses.filter((expense) => expense.id !== id))
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

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
              <Label htmlFor="date" className="text-white">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                className="bg-[#1A1A1B] border-gray-700 text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="recurring"
                checked={newExpense.isRecurring}
                onCheckedChange={(checked) => setNewExpense({ ...newExpense, isRecurring: checked })}
              />
              <Label htmlFor="recurring" className="text-white">
                Recurring Expense
              </Label>
            </div>
            <Button type="submit" className="w-full">
              Add Expense
            </Button>
          </form>
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
                  <div>
                    <p className="font-semibold">{expense.description}</p>
                    <p className="text-sm text-gray-400">
                      {expense.category} - {expense.date}
                      {expense.isRecurring && (
                        <span className="ml-2 text-blue-400">
                          <Repeat className="h-4 w-4 inline mr-1" />
                          Recurring
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold">${expense.amount.toFixed(2)}</span>
                    <Button variant="destructive" size="icon" onClick={() => deleteExpense(expense.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

