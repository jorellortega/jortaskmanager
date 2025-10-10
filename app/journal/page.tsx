"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { parseISO } from "date-fns";
import Link from "next/link"
import { Home, Trash2, Edit2, ArrowLeft, Check, X } from "lucide-react"
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    const fetchEntries = async () => {
      console.log("🔄 Fetching journal entries...")
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error("❌ User not authenticated:", userError)
        setError("You must be logged in to view journal entries.")
        setLoading(false)
        return
      }
      console.log("✅ User authenticated:", user.id)
      setUserId(user.id)
      const { data, error: fetchError } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false })
      if (fetchError) {
        console.error("❌ Error fetching journal entries:", fetchError)
        setError("Failed to fetch journal entries.")
      } else {
        console.log("✅ Journal entries loaded:", data?.length || 0, "items")
        setEntries(data || [])
      }
      setLoading(false)
    }
    fetchEntries()
  }, [])

  const handleSave = async () => {
    console.log("🚀 handleSave called")
    console.log("📌 userId:", userId)
    console.log("📝 entry:", entry)
    console.log("📅 date:", date)
    
    if (!userId) {
      console.error("❌ No userId found - user not authenticated")
      setError("Error: User not authenticated. Please log in.")
      return
    }
    
    if (!entry.trim()) {
      console.error("❌ Validation failed: Entry content is empty")
      setError("Please write something before saving.")
      return
    }
    
    if (!date) {
      console.error("❌ Validation failed: No date selected")
      setError("Please select a date.")
      return
    }
    
    console.log("✅ Validation passed, inserting journal entry...")
    
    setLoading(true)
    setError(null)
    const entryDate = date.toISOString().slice(0, 10)
    
    const journalData = {
      user_id: userId,
      entry_date: entryDate,
      content: entry,
    }
    console.log("📤 Inserting data:", journalData)
    
    const { data, error: insertError } = await supabase
      .from("journal_entries")
      .insert([journalData])
      .select()
      
    if (insertError) {
      console.error("❌ Supabase error:", insertError)
      console.error("Error details:", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      setError(insertError.message || "Failed to save entry.")
    } else if (data && data.length > 0) {
      console.log("✅ Journal entry added successfully:", data)
      setEntries((prev) => [data[0], ...prev])
      setEntry("")
      setError(null)
    } else {
      console.error("⚠️ No data returned from insert")
      setError("Entry saved but no data returned.")
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    console.log("🗑️ handleDelete called for id:", id)
    setLoading(true)
    setError(null)
    const { error: deleteError } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", id)
    if (deleteError) {
      console.error("❌ Delete error:", deleteError)
      setError(deleteError.message || "Failed to delete entry.")
    } else {
      console.log("✅ Entry deleted successfully")
      setEntries((prev) => prev.filter((entry) => entry.id !== id))
    }
    setLoading(false)
  }

  const startEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setEditDate(entry.entry_date);
    setEditContent(entry.content);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditDate("");
    setEditContent("");
  };
  const saveEdit = async (id: string) => {
    console.log("💾 saveEdit called for id:", id)
    console.log("📝 editDate:", editDate)
    console.log("📝 editContent:", editContent)
    
    setLoading(true);
    setError(null);
    
    const updateData = { entry_date: editDate, content: editContent }
    console.log("📤 Updating with data:", updateData)
    
    const { data, error: updateError } = await supabase
      .from("journal_entries")
      .update(updateData)
      .eq("id", id)
      .select();
      
    if (updateError) {
      console.error("❌ Update error:", updateError)
      setError(updateError.message || "Failed to update entry.");
    } else if (data && data.length > 0) {
      console.log("✅ Entry updated successfully:", data)
      setEntries((prev) => prev.map((e) => (e.id === id ? data[0] : e)));
      cancelEdit();
    } else {
      console.error("⚠️ No data returned from update")
    }
    setLoading(false);
  };

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
                style={{
                  '--rdp-day_selected-background-color': '#000000',
                  '--rdp-day_selected-color': '#ffffff',
                  '--rdp-day_selected-border': '2px solid white'
                } as React.CSSProperties}
              />
              {date && (
                <div className="mt-3 p-3 bg-blue-900/30 border border-blue-700 rounded-md">
                  <p className="text-sm text-blue-300">
                    <span className="font-semibold">Selected Date:</span>
                    <br />
                    {format(date, "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
              )}
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
                      <div className="flex-1">
                        {editingId === entry.id ? (
                          <>
                            <input
                              type="date"
                              value={editDate}
                              onChange={e => setEditDate(e.target.value)}
                              className="bg-[#232325] !text-white mb-2 block"
                            />
                            <Textarea
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              className="min-h-[100px] bg-[#232325] text-white border-gray-700 focus:border-gray-600 mb-2"
                            />
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-gray-400">
                              {format(parseISO(entry.entry_date), "MMMM d, yyyy")}
                            </p>
                            <p className="text-white mt-2">{entry.content}</p>
                          </>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 items-end ml-4">
                        {editingId === entry.id ? (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => saveEdit(entry.id)} title="Save" className="text-green-500 hover:text-green-700"><Check className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={cancelEdit} title="Cancel" className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-gray-800"
                              onClick={() => startEdit(entry)}
                              disabled={loading}
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4 text-blue-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-gray-800"
                              onClick={() => handleDelete(entry.id)}
                              disabled={loading}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </>
                        )}
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