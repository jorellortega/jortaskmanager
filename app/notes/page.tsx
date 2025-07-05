"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Trash2, Edit2, Save } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

type Note = {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState({ title: "", content: "" })
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [editingFields, setEditingFields] = useState({ title: "", content: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view notes.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      const { data, error: fetchError } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (fetchError) {
        setError("Failed to fetch notes.")
      } else {
        setNotes(data || [])
      }
      setLoading(false)
    }
    fetchNotes()
  }, [])

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!userId) {
      setError("You must be logged in to add notes.")
      return
    }
    if (newNote.title.trim() && newNote.content.trim()) {
      setLoading(true)
      const { data, error: insertError } = await supabase
        .from("notes")
        .insert([
          {
            user_id: userId,
            title: newNote.title.trim(),
            content: newNote.content.trim(),
          },
        ])
        .select()
      if (insertError) {
        setError(insertError.message || "Failed to add note.")
      } else if (data && data.length > 0) {
        setNotes((prev) => [data[0], ...prev])
        setNewNote({ title: "", content: "" })
      }
      setLoading(false)
    }
  }

  const deleteNote = async (id: string) => {
    setError(null)
    setLoading(true)
    const { error: deleteError } = await supabase
      .from("notes")
      .delete()
      .eq("id", id)
    if (deleteError) {
      setError(deleteError.message || "Failed to delete note.")
    } else {
      setNotes((prev) => prev.filter((note) => note.id !== id))
    }
    setLoading(false)
  }

  const startEditing = (note: Note) => {
    setEditingNote(note)
    setEditingFields({ title: note.title, content: note.content })
  }

  const saveEdit = async () => {
    if (editingNote) {
      setError(null)
      setLoading(true)
      const { data, error: updateError } = await supabase
        .from("notes")
        .update({
          title: editingFields.title,
          content: editingFields.content,
        })
        .eq("id", editingNote.id)
        .select()
      if (updateError) {
        setError(updateError.message || "Failed to update note.")
      } else if (data && data.length > 0) {
        setNotes((prev) => prev.map((note) => note.id === editingNote.id ? data[0] : note))
        setEditingNote(null)
      }
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4">Notes</h1>
      {error && <div className="bg-red-900 text-red-200 p-2 mb-4 rounded">{error}</div>}
      {loading && <div className="text-blue-300 mb-2">Loading...</div>}
      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="text-white">Add New Note</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addNote} className="space-y-4">
            <Input
              placeholder="Note Title"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              className="bg-[#1A1A1B] border-gray-700 text-white"
            />
            <Textarea
              placeholder="Note Content"
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              className="bg-[#1A1A1B] border-gray-700 text-white"
              rows={4}
            />
            <Button type="submit" className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Add Note
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {notes.map((note) => (
          <Card key={note.id} className="bg-[#141415] border border-gray-700">
            <CardContent className="p-4">
              {editingNote && editingNote.id === note.id ? (
                <div className="space-y-4">
                  <Input
                    value={editingFields.title}
                    onChange={(e) => setEditingFields({ ...editingFields, title: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                  />
                  <Textarea
                    value={editingFields.content}
                    onChange={(e) => setEditingFields({ ...editingFields, content: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    rows={4}
                  />
                  <Button onClick={saveEdit} className="w-full" disabled={loading}>
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-2">{note.title}</h2>
                  <p className="text-gray-300 mb-4">{note.content}</p>
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>Created: {new Date(note.created_at).toLocaleString()}</span>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => startEditing(note)}>
                        <Edit2 className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteNote(note.id)} disabled={loading}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </div>
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

