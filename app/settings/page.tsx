"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Bell, Moon, User, CreditCard, DollarSign, Settings as SettingsIcon, Sparkles } from "lucide-react"
import Link from "next/link"
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/use-auth'

export default function Settings() {
  const { isAdmin } = useAuth()
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

      {/* Navigation Customization */}
      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="flex items-center text-green-400">
            <span className="text-green-400">Navigation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm mb-4">Customize which pages appear in your navigation bar</p>
          <Link href="/nav-customization">
            <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg">
              Customize Navigation
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Billing & Subscription Management */}
      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="flex items-center text-green-400">
            <DollarSign className="mr-2 text-green-400" />
            <span className="text-green-400">Billing & Subscription</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-400 text-sm mb-4">Manage your subscription and billing information</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/billing">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing Dashboard
              </Button>
            </Link>
            <Link href="/credits">
              <Button variant="outline" className="w-full border-green-500 text-green-400 hover:bg-green-900/20 font-semibold px-6 py-3 rounded-lg">
                <DollarSign className="mr-2 h-4 w-4" />
                Manage Credits
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Admin AI Settings - Only visible to admins */}
      {isAdmin && (
        <Card className="bg-[#141415] border border-gray-700 mb-4">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-400">
              <Sparkles className="mr-2 text-blue-400" />
              <span className="text-blue-400">AI Administration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-400 text-sm mb-4">Configure AI provider settings and system prompts</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/ai-settings">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  AI Settings
                </Button>
              </Link>
              <Link href="/ai-info">
                <Button variant="outline" className="w-full border-blue-500 text-blue-400 hover:bg-blue-900/20 font-semibold px-6 py-3 rounded-lg">
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI System Prompt
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Sync Button */}
      <div className="flex justify-center mt-8">
        <Link href="/time-sync">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg text-lg shadow">
            Time Settings
          </Button>
        </Link>
      </div>
    </div>
  )
}

