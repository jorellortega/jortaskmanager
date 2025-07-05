"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import Link from "next/link"
import { Home, Trash2, Edit2, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

type JournalEntry = {
  id: string
  user_id: string
  entry_date: string
  content: string
  created_at: string
}

export default function JournalPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [entry, setEntry] = useState("")
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view journal entries.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      const { data, error: fetchError } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false })
      if (fetchError) {
        setError("Failed to fetch journal entries.")
      } else {
        setEntries(data || [])
      }
      setLoading(false)
    }
    fetchEntries()
  }, [])

  const handleSave = async () => {
    if (entry.trim() && date && userId) {
      setLoading(true)
      setError(null)
      const entryDate = date.toISOString().slice(0, 10)
      const { data, error: insertError } = await supabase
        .from("journal_entries")
        .insert([
          {
            user_id: userId,
            entry_date: entryDate,
            content: entry,
          },
        ])
        .select()
      if (insertError) {
        setError(insertError.message || "Failed to save entry.")
      } else if (data && data.length > 0) {
        setEntries((prev) => [data[0], ...prev])
        setEntry("")
      }
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setLoading(true)
    setError(null)
    const { error: deleteError } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", id)
    if (deleteError) {
      setError(deleteError.message || "Failed to delete entry.")
    } else {
      setEntries((prev) => prev.filter((entry) => entry.id !== id))
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      {error && <div className="bg-red-900 text-red-200 p-2 mb-4 rounded">{error}</div>}
      {loading && <div className="text-blue-300 mb-2">Loading...</div>}
      <Card className="bg-[#141415] border border-gray-700">
        <CardHeader className="bg-black flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="hover:bg-gray-800">
                <Home className="h-5 w-5 text-white" />
              </Button>
            </Link>
            <CardTitle className="text-white">Journal</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border border-gray-700 bg-[#141415] text-white"
              />
            </div>
            <div className="w-full md:w-2/3">
              <Textarea
                placeholder="Write your thoughts here..."
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                className="min-h-[300px] bg-[#141415] text-white border-gray-700 focus:border-gray-600"
              />
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={handleSave}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Save Entry
                </Button>
              </div>
            </div>
          </div>

          {/* Journal Entries List */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Entries</h2>
            <div className="space-y-4">
              {entries.map((entry) => (
                <Card key={entry.id} className="bg-[#141415] border border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-400">
                          {format(new Date(entry.entry_date), "MMMM d, yyyy")}
                        </p>
                        <p className="text-white mt-2">{entry.content}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-gray-800"
                          onClick={() => handleDelete(entry.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 