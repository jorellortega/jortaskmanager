"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Trash2, Edit2, Save } from "lucide-react"
import Link from "next/link"

type Note = {
  id: number
  title: string
  content: string
  createdAt: string
}

const mockNotes: Note[] = [
  {
    id: 1,
    title: "Project Requirements",
    content: "1. User authentication\n2. Task management\n3. Calendar integration\n4. Team collaboration\n5. Analytics dashboard",
    createdAt: "2024-03-15T10:00:00.000Z",
  },
  {
    id: 2,
    title: "Meeting Notes",
    content: "Team discussed:\n- Sprint planning for next week\n- UI/UX improvements needed\n- Database optimization required\n- New feature requests from clients",
    createdAt: "2024-03-16T14:30:00.000Z",
  },
  {
    id: 3,
    title: "Code Review Checklist",
    content: "Before submitting PR:\n1. Run all tests\n2. Check for linting errors\n3. Update documentation\n4. Review performance impact\n5. Test edge cases",
    createdAt: "2024-03-17T09:15:00.000Z",
  },
  {
    id: 4,
    title: "Ideas for Next Sprint",
    content: "Potential features:\n- Dark mode toggle\n- Export functionality\n- Mobile app version\n- Integration with Slack\n- Advanced search filters",
    createdAt: "2024-03-18T16:45:00.000Z",
  },
  {
    id: 5,
    title: "Bug Fixes Needed",
    content: "High priority:\n1. Login page timeout issue\n2. Calendar sync problems\n3. Data persistence errors\n4. Mobile responsiveness bugs\n5. Performance optimization",
    createdAt: "2024-03-19T11:20:00.000Z",
  },
]

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState({ title: "", content: "" })
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  useEffect(() => {
    const storedNotes = localStorage.getItem("notes")
    if (storedNotes) {
      setNotes(JSON.parse(storedNotes))
    } else {
      setNotes(mockNotes)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes))
  }, [notes])

  const addNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (newNote.title.trim() && newNote.content.trim()) {
      const newNoteItem: Note = {
        id: Date.now(),
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        createdAt: new Date().toISOString(),
      }
      setNotes([newNoteItem, ...notes])
      setNewNote({ title: "", content: "" })
    }
  }

  const deleteNote = (id: number) => {
    setNotes(notes.filter((note) => note.id !== id))
  }

  const startEditing = (note: Note) => {
    setEditingNote(note)
  }

  const saveEdit = () => {
    if (editingNote) {
      setNotes(notes.map((note) => (note.id === editingNote.id ? editingNote : note)))
      setEditingNote(null)
    }
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4">Notes</h1>
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
                    value={editingNote.title}
                    onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                  />
                  <Textarea
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    rows={4}
                  />
                  <Button onClick={saveEdit} className="w-full">
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-2">{note.title}</h2>
                  <p className="text-gray-300 mb-4">{note.content}</p>
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>Created: {new Date(note.createdAt).toLocaleString()}</span>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => startEditing(note)}>
                        <Edit2 className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteNote(note.id)}>
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

