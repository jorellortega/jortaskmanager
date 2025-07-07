"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Bell, Moon, User } from "lucide-react"
import Link from "next/link"
import { supabase } from '@/lib/supabaseClient'

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError(null)
      setSuccess(null)
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) {
        setError("Failed to fetch user profile.")
        setLoading(false)
        return
      }
      setEmail(data.user.email || "")
      setUsername(data.user.user_metadata?.name || "")
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    // Update user metadata (username) and email if changed
    const updates: any = {}
    if (username) updates.data = { name: username }
    if (email) updates.email = email
    const { data, error } = await supabase.auth.updateUser(updates)
    if (error) {
      setError(error.message || "Failed to update profile.")
    } else {
      setSuccess("Profile updated successfully.")
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400">
          <ArrowLeft className="mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-400">
            <User className="mr-2 text-blue-400" />
            <span className="text-blue-400">User Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="text-red-400 text-sm">{error}</div>}
          {success && <div className="text-green-400 text-sm">{success}</div>}
          <div>
            <Label htmlFor="username" className="text-gray-200">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-[#1A1A1B] border-gray-700 text-white"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-gray-200">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#1A1A1B] border-gray-700 text-white"
              disabled={loading}
            />
          </div>
          <Button onClick={handleSave} className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-400">
            <Moon className="mr-2 text-purple-400" />
            <span className="text-purple-400">Appearance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Label htmlFor="dark-mode" className="text-gray-200">Dark Mode</Label>
          <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
        </CardContent>
      </Card>

      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-400">
            <Bell className="mr-2 text-yellow-400" />
            <span className="text-yellow-400">Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Label htmlFor="notifications" className="text-gray-200">Enable Notifications</Label>
          <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
        </CardContent>
      </Card>
    </div>
  )
}

