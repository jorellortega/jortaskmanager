"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, CalendarDays, Clock, DollarSign, Sun, Dumbbell, Cake, Repeat, Rss, CheckSquare, Target, Lightbulb, Plane, ClockIcon, StickyNote, BookOpen, Utensils } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

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
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserAndPreferences = async () => {
      console.log('🔍 fetchUserAndPreferences called')
      setLoading(true)
      setError(null)
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('👤 User auth result:', { user: user?.id, error: userError })
      
      if (userError || !user) {
        console.log('❌ No user found')
        setError("You must be logged in to view sync preferences.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      console.log('✅ User ID set:', user.id)
      
      // Fetch user's sync preferences from database
      console.log('🔍 Fetching preferences from database...')
      const { data: prefsData, error: prefsError } = await supabase
        .from("peer_sync_preferences")
        .select("*")
        .eq("user_id", user.id)
      
      console.log('📊 Database query result:', { prefsData, prefsError })
      
      if (prefsError) {
        console.log('❌ Database error:', prefsError)
        setError("Failed to fetch sync preferences.")
      } else if (prefsData && prefsData.length > 0) {
        console.log('✅ Found preferences:', prefsData.length, 'records')
        // Update preferences with database values
        setPreferences(prev => prev.map(pref => {
          const dbPref = prefsData.find(p => p.preference_key === pref.id)
          console.log(`🔍 Checking preference ${pref.id}:`, { dbPref, enabled: dbPref?.enabled })
          return dbPref ? { ...pref, enabled: dbPref.enabled } : pref
        }))
      } else {
        console.log('⚠️ No preferences found in database')
      }
      
      setLoading(false)
    }
    
    fetchUserAndPreferences()
  }, [])

  const togglePreference = (id: string) => {
    console.log('🔄 Toggling preference:', id)
    setPreferences(prev =>
      prev.map(pref => {
        if (pref.id === id) {
          console.log(`✅ Toggled ${id} from ${pref.enabled} to ${!pref.enabled}`)
          return { ...pref, enabled: !pref.enabled }
        }
        return pref
      })
    )
  }

  const handleSave = async () => {
    console.log('💾 handleSave called')
    if (!userId) {
      console.log('❌ No userId, cannot save')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Update all preferences in database
      const updates = preferences.map(pref => ({
        user_id: userId,
        preference_key: pref.id,
        enabled: pref.enabled
      }))
      
      console.log('📤 Saving updates to database:', updates)
      
      const { error } = await supabase
        .from("peer_sync_preferences")
        .upsert(updates, { onConflict: 'user_id,preference_key' })
      
      console.log('📊 Save result:', { error })
      
      if (error) {
        console.log('❌ Save error:', error)
        setError("Failed to save preferences.")
      } else {
        console.log('✅ Save successful!')
        setSuccessMessage("Preferences saved successfully!")
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err) {
      console.log('❌ Save exception:', err)
      setError("An error occurred while saving preferences.")
    }
    
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/peersync" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to PeerSync
      </Link>
      {/* Success and Error Messages */}
      {successMessage && (
        <div className="bg-green-900 text-green-200 p-3 mb-4 rounded border border-green-500">
          ✅ {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-900 text-red-200 p-3 mb-4 rounded border border-red-500">
          ❌ {error}
        </div>
      )}

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
              disabled={loading}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 