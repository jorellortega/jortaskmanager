"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SyncSettingsPage() {
  const [shareDates, setShareDates] = useState(true)
  const [shareActivities, setShareActivities] = useState(true)
  const [shareOpenSlots, setShareOpenSlots] = useState(true)

  const handleSaveSettings = () => {
    // In a real application, you would save these settings to a backend or local storage
    console.log("Settings saved:", { shareDates, shareActivities, shareOpenSlots })
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/peersync" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to PeerSync
      </Link>
      <h1 className="text-2xl font-bold mb-4">Sync Settings</h1>
      <Card className="bg-[#141415] border border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">PeerSync Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="share-dates" className="text-white">
              Share Dates
            </Label>
            <Switch id="share-dates" checked={shareDates} onCheckedChange={setShareDates} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="share-activities" className="text-white">
              Share Activities
            </Label>
            <Switch id="share-activities" checked={shareActivities} onCheckedChange={setShareActivities} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="share-open-slots" className="text-white">
              Share Open Slots
            </Label>
            <Switch id="share-open-slots" checked={shareOpenSlots} onCheckedChange={setShareOpenSlots} />
          </div>
          <Button onClick={handleSaveSettings} className="w-full">
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

