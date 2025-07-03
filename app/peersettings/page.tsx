"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, CalendarDays, Clock, DollarSign, Sun, Dumbbell, Cake, Repeat, Rss, CheckSquare, Target, Lightbulb, Plane, ClockIcon, StickyNote, BookOpen, Utensils } from "lucide-react"
import Link from "next/link"

type SyncPreference = {
  id: string
  name: string
  icon: JSX.Element
  enabled: boolean
  description: string
}

const defaultPreferences: SyncPreference[] = [
  {
    id: "calendar",
    name: "Calendar",
    icon: <CalendarDays className="h-5 w-5 text-blue-400" />,
    enabled: true,
    description: "Sync your calendar events with peers"
  },
  {
    id: "appointments",
    name: "Appointments",
    icon: <Clock className="h-5 w-5 text-blue-400" />,
    enabled: true,
    description: "Share your appointments with peers"
  },
  {
    id: "expenses",
    name: "Expenses",
    icon: <DollarSign className="h-5 w-5 text-green-400" />,
    enabled: false,
    description: "Sync expense tracking with peers"
  },
  {
    id: "leisure",
    name: "Leisure",
    icon: <Sun className="h-5 w-5 text-yellow-400" />,
    enabled: true,
    description: "Share leisure activities with peers"
  },
  {
    id: "fitness",
    name: "Fitness",
    icon: <Dumbbell className="h-5 w-5 text-green-400" />,
    enabled: true,
    description: "Sync fitness activities with peers"
  },
  {
    id: "birthdays",
    name: "Birthdays",
    icon: <Cake className="h-5 w-5 text-pink-400" />,
    enabled: true,
    description: "Share birthday reminders with peers"
  },
  {
    id: "routines",
    name: "Routines",
    icon: <Repeat className="h-5 w-5 text-purple-400" />,
    enabled: false,
    description: "Sync daily routines with peers"
  },
  {
    id: "feed",
    name: "Feed",
    icon: <Rss className="h-5 w-5 text-orange-400" />,
    enabled: true,
    description: "Share activity feed with peers"
  },
  {
    id: "todo",
    name: "Todo",
    icon: <CheckSquare className="h-5 w-5 text-indigo-400" />,
    enabled: false,
    description: "Sync todo lists with peers"
  },
  {
    id: "goals",
    name: "Goals",
    icon: <Target className="h-5 w-5 text-red-400" />,
    enabled: true,
    description: "Share goals with peers"
  },
  {
    id: "brainstorming",
    name: "Brainstorming",
    icon: <Lightbulb className="h-5 w-5 text-yellow-400" />,
    enabled: false,
    description: "Sync brainstorming sessions with peers"
  },
  {
    id: "travel",
    name: "Travel",
    icon: <Plane className="h-5 w-5 text-purple-400" />,
    enabled: true,
    description: "Share travel plans with peers"
  },
  {
    id: "work-clock",
    name: "Work Clock",
    icon: <ClockIcon className="h-5 w-5 text-blue-400" />,
    enabled: false,
    description: "Sync work hours with peers"
  },
  {
    id: "notes",
    name: "Notes",
    icon: <StickyNote className="h-5 w-5 text-yellow-400" />,
    enabled: false,
    description: "Share notes with peers"
  },
  {
    id: "journal",
    name: "Journal",
    icon: <BookOpen className="h-5 w-5 text-green-400" />,
    enabled: false,
    description: "Sync journal entries with peers"
  },
  {
    id: "meal-planning",
    name: "Meal Planning",
    icon: <Utensils className="h-5 w-5 text-orange-400" />,
    enabled: true,
    description: "Share meal plans with peers"
  }
]

export default function PeerSettingsPage() {
  const [preferences, setPreferences] = useState<SyncPreference[]>(defaultPreferences)

  const togglePreference = (id: string) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
      )
    )
  }

  const handleSave = () => {
    localStorage.setItem("peerSyncPreferences", JSON.stringify(preferences))
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/peersync" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to PeerSync
      </Link>
      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Peer Sync Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {preferences.map((preference) => (
              <Card key={preference.id} className="bg-[#1a1a1b] border border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div>
                        {preference.icon}
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{preference.name}</h3>
                        <p className="text-gray-400 text-sm">{preference.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={preference.enabled}
                      onCheckedChange={() => togglePreference(preference.id)}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSave}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 