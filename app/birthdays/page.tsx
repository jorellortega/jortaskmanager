"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Cake } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

type Birthday = {
  id: number
  name: string
  date: string
}

export default function BirthdaysPage() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([])
  const [newBirthday, setNewBirthday] = useState({ name: "", date: "" })

  useEffect(() => {
    const storedBirthdays = localStorage.getItem("birthdays")
    if (storedBirthdays) {
      setBirthdays(JSON.parse(storedBirthdays))
    }
  }, [])

  const addBirthday = (e: React.FormEvent) => {
    e.preventDefault()
    if (newBirthday.name && newBirthday.date) {
      const updatedBirthdays = [...birthdays, { id: Date.now(), ...newBirthday }]
      setBirthdays(updatedBirthdays)
      localStorage.setItem("birthdays", JSON.stringify(updatedBirthdays))
      setNewBirthday({ name: "", date: "" })
    }
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4">Birthdays</h1>
      <Card className="bg-[#141415] border border-gray-700 mb-4 p-4">
        <CardHeader>
          <CardTitle className="text-white">Add New Birthday</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addBirthday} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white">
                Name
              </Label>
              <Input
                id="name"
                value={newBirthday.name}
                onChange={(e) => setNewBirthday({ ...newBirthday, name: e.target.value })}
                className="bg-[#1A1A1B] border-gray-700 text-white placeholder-gray-400"
                placeholder="Enter name"
              />
            </div>
            <div>
              <Label htmlFor="date" className="text-white">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={newBirthday.date}
                onChange={(e) => setNewBirthday({ ...newBirthday, date: e.target.value })}
                className="bg-[#1A1A1B] border-gray-700 text-white"
              />
            </div>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Add Birthday
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="bg-[#141415] border border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Upcoming Birthdays</CardTitle>
        </CardHeader>
        <CardContent>
          {birthdays.length === 0 ? (
            <p className="text-white">No birthdays added yet.</p>
          ) : (
            <ul className="space-y-2">
              {birthdays.map((birthday) => (
                <li key={birthday.id} className="bg-[#1A1A1B] p-2 rounded flex items-center text-white">
                  <Cake className="h-5 w-5 text-pink-400 mr-2" />
                  <span>
                    <strong>{birthday.name}</strong> - {format(new Date(birthday.date), "MMMM d")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

