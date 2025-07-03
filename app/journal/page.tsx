"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import Link from "next/link"
import { Home, Trash2, Edit2 } from "lucide-react"

type JournalEntry = {
  id: number
  date: Date
  content: string
}

const mockEntries: JournalEntry[] = [
  {
    id: 1,
    date: new Date(2024, 3, 1),
    content: "Started working on the new project today. Feeling excited about the possibilities and the team's energy. Need to focus on setting up the initial architecture properly.",
  },
  {
    id: 2,
    date: new Date(2024, 3, 3),
    content: "Had a great brainstorming session with the team. Came up with some innovative solutions to the scalability challenges we were facing. Need to document these ideas properly.",
  },
  {
    id: 3,
    date: new Date(2024, 3, 5),
    content: "Today was a bit challenging with some unexpected bugs in the system. However, managed to resolve them by the end of the day. Learned a lot about error handling in the process.",
  },
  {
    id: 4,
    date: new Date(2024, 3, 7),
    content: "Personal reflection: Need to improve my time management skills. Spent too much time on minor details today. Will try the Pomodoro technique tomorrow to stay more focused.",
  },
  {
    id: 5,
    date: new Date(2024, 3, 8),
    content: "Team meeting went well. Everyone seems aligned on the project goals. Need to follow up with the design team about the new UI components. Also, scheduled a code review for next week.",
  },
  {
    id: 6,
    date: new Date(2024, 3, 10),
    content: "Learning: Started exploring the new React features. The new hooks are really powerful. Need to create a proof of concept to demonstrate their benefits to the team.",
  },
  {
    id: 7,
    date: new Date(2024, 3, 12),
    content: "Project milestone achieved! The core functionality is now working as expected. Team celebration tomorrow. Need to prepare the demo for stakeholders.",
  },
  {
    id: 8,
    date: new Date(2024, 3, 15),
    content: "Personal: Took a mental health day. Went for a long walk and cleared my mind. Sometimes stepping back helps you see the bigger picture more clearly.",
  },
  {
    id: 9,
    date: new Date(2024, 3, 17),
    content: "Technical deep dive: Spent the day optimizing database queries. Managed to reduce response time by 40%. Documentation updated with the new patterns.",
  },
  {
    id: 10,
    date: new Date(2024, 3, 20),
    content: "Team building: Organized a virtual game night. It was great to see everyone in a more relaxed setting. Planning to make this a monthly event.",
  }
]

export default function JournalPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [entry, setEntry] = useState("")
  const [entries, setEntries] = useState<JournalEntry[]>([])

  useEffect(() => {
    const storedEntries = localStorage.getItem("journalEntries")
    if (storedEntries) {
      setEntries(JSON.parse(storedEntries))
    } else {
      setEntries(mockEntries)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("journalEntries", JSON.stringify(entries))
  }, [entries])

  const handleSave = () => {
    if (entry.trim() && date) {
      const newEntry: JournalEntry = {
        id: Date.now(),
        date,
        content: entry,
      }
      setEntries([newEntry, ...entries])
      setEntry("")
    }
  }

  const handleDelete = (id: number) => {
    setEntries(entries.filter(entry => entry.id !== id))
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen">
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
                          {format(entry.date, "MMMM d, yyyy")}
                        </p>
                        <p className="text-white mt-2">{entry.content}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-gray-800"
                          onClick={() => handleDelete(entry.id)}
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