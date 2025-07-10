"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Cake, Edit2, Check, X, Trash2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { supabase } from "@/lib/supabaseClient"
import { parseISO } from "date-fns";

type Birthday = {
  id: string
  user_id: string
  name: string
  birthdate: string
  created_at?: string
}

export default function BirthdaysPage() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([])
  const [newBirthday, setNewBirthday] = useState({ name: "", birthdate: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");

  useEffect(() => {
    const fetchBirthdays = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view birthdays.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      const { data, error: fetchError } = await supabase
        .from("birthdays")
        .select("*")
        .eq("user_id", user.id)
        .order("birthdate", { ascending: true })
      if (fetchError) {
        setError("Failed to fetch birthdays.")
      } else {
        setBirthdays(data || [])
      }
      setLoading(false)
    }
    fetchBirthdays()
  }, [])

  const addBirthday = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!userId) {
      setError("You must be logged in to add birthdays.")
      return
    }
    if (newBirthday.name && newBirthday.birthdate) {
      setLoading(true)
      const { data, error: insertError } = await supabase
        .from("birthdays")
        .insert([
          {
            user_id: userId,
            name: newBirthday.name,
            birthdate: newBirthday.birthdate,
          },
        ])
        .select()
      if (insertError) {
        setError(insertError.message || "Failed to add birthday. Please try again.")
      } else if (data && data.length > 0) {
        setBirthdays((prev) => [...prev, data[0]])
        setNewBirthday({ name: "", birthdate: "" })
      }
      setLoading(false)
    }
  }

  const startEdit = (birthday: Birthday) => {
    setEditingId(birthday.id);
    setEditName(birthday.name);
    setEditDate(birthday.birthdate);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDate("");
  };
  const saveEdit = async (id: string) => {
    setError(null);
    setLoading(true);
    const { data, error: updateError } = await supabase
      .from("birthdays")
      .update({ name: editName, birthdate: editDate })
      .eq("id", id)
      .select();
    if (updateError) {
      setError(updateError.message || "Failed to update birthday.");
    } else if (data && data.length > 0) {
      setBirthdays((prev) => prev.map((b) => (b.id === id ? data[0] : b)));
      cancelEdit();
    }
    setLoading(false);
  };
  const deleteBirthday = async (id: string) => {
    setError(null);
    setLoading(true);
    const { error: deleteError } = await supabase
      .from("birthdays")
      .delete()
      .eq("id", id);
    if (deleteError) {
      setError(deleteError.message || "Failed to delete birthday.");
    } else {
      setBirthdays((prev) => prev.filter((b) => b.id !== id));
      if (editingId === id) cancelEdit();
    }
    setLoading(false);
  };

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
                value={newBirthday.birthdate}
                onChange={(e) => setNewBirthday({ ...newBirthday, birthdate: e.target.value })}
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
                <li key={birthday.id} className="bg-[#1A1A1B] p-2 rounded flex items-center text-white gap-2">
                  <Cake className="h-5 w-5 text-pink-400 mr-2" />
                  {editingId === birthday.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="bg-[#232325] !text-white mr-2"
                        placeholder="Name"
                      />
                      <Input
                        type="date"
                        value={editDate}
                        onChange={e => setEditDate(e.target.value)}
                        className="bg-[#232325] !text-white mr-2"
                      />
                      <Button size="icon" variant="ghost" onClick={() => saveEdit(birthday.id)} title="Save" className="text-green-500 hover:text-green-700"><Check className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={cancelEdit} title="Cancel" className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteBirthday(birthday.id)} title="Delete" className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1">
                        <strong>{birthday.name}</strong> - {format(parseISO(birthday.birthdate), "MMMM d")}
                      </span>
                      <Button size="icon" variant="ghost" onClick={() => startEdit(birthday)} title="Edit" className="text-blue-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteBirthday(birthday.id)} title="Delete" className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
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

