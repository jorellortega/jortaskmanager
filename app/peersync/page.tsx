"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Calendar, Users, QrCode, Scan, Settings } from "lucide-react"
import Link from "next/link"
import { format, addDays, isSameDay } from "date-fns"
import QRCode from "react-qr-code"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type CalendarEvent = {
  id: number
  title: string
  date: Date
}

// Mock user data
const currentUserCalendar: CalendarEvent[] = [
  { id: 1, title: "Team Meeting", date: new Date(2023, 5, 15, 10, 0) },
  { id: 2, title: "Project Deadline", date: new Date(2023, 5, 20, 18, 0) },
  { id: 3, title: "Lunch with Client", date: new Date(2023, 5, 18, 12, 30) },
]

const peerUserCalendar: CalendarEvent[] = [
  { id: 1, title: "Conference Call", date: new Date(2023, 5, 16, 14, 0) },
  { id: 2, title: "Team Building", date: new Date(2023, 5, 20, 9, 0) },
  { id: 3, title: "Project Review", date: new Date(2023, 5, 19, 11, 0) },
]

export default function PeerSyncPage() {
  const [syncKey, setSyncKey] = useState("")
  const [syncedCalendar, setSyncedCalendar] = useState<CalendarEvent[]>([])
  const [openDates, setOpenDates] = useState<Date[]>([])
  const [userCode] = useState(() => Math.random().toString(36).substr(2, 9))
  const [scannedCode, setScannedCode] = useState("")

  const handleSync = (code: string) => {
    // In a real application, you would validate the sync key and fetch the peer's calendar
    // For this example, we'll use the mock peer calendar
    const mergedCalendar = [...currentUserCalendar, ...peerUserCalendar]
    setSyncedCalendar(mergedCalendar)

    // Find open dates (dates without events) for the next 7 days
    const today = new Date()
    const openDatesList = []
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i)
      if (!mergedCalendar.some((event) => isSameDay(event.date, date))) {
        openDatesList.push(date)
      }
    }
    setOpenDates(openDatesList)
  }

  const handleScan = (result: string) => {
    setScannedCode(result)
    handleSync(result)
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">PeerSync</h1>
        <div className="flex items-center gap-4">
          <Link href="/syncedpeers" className="text-blue-500 hover:text-blue-400">
            <Users className="h-6 w-6" />
          </Link>
          <Link href="/peersettings" className="text-blue-500 hover:text-blue-400">
            <Settings className="h-6 w-6" />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card className="bg-[#141415] border border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="mr-2" />
              Sync with a Peer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSync(syncKey)
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="syncKey" className="text-white">
                  Sync Key
                </Label>
                <Input
                  id="syncKey"
                  value={syncKey}
                  onChange={(e) => setSyncKey(e.target.value)}
                  placeholder="Enter peer's sync key"
                  className="bg-[#1A1A1B] border-gray-700 text-white"
                />
              </div>
              <Button type="submit" className="w-full">
                Sync Calendars
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="bg-[#141415] border border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <QrCode className="mr-2" />
              Your Sync Code
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <QRCode value={userCode} size={150} />
            <p className="mt-4 text-lg font-semibold text-white">{userCode}</p>
          </CardContent>
        </Card>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full mb-4">
            <Scan className="mr-2" />
            Scan Peer's Code
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-[#141415] text-white">
          <DialogHeader>
            <DialogTitle>Scan Peer's Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center">
            <p className="mb-4">Use your device's camera to scan the peer's QR code.</p>
            {/* In a real application, you would implement a QR code scanner here */}
            <Input
              placeholder="Enter scanned code manually"
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value)}
              className="bg-[#1A1A1B] border-gray-700 text-white mb-4"
            />
            <Button onClick={() => handleScan(scannedCode)}>Sync with Scanned Code</Button>
          </div>
        </DialogContent>
      </Dialog>
      {syncedCalendar.length > 0 && (
        <Card className="bg-[#141415] border border-gray-700 mb-4">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Calendar className="mr-2" />
              Synced Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {syncedCalendar.map((event) => (
                <li key={event.id} className="flex justify-between items-center">
                  <span>{event.title}</span>
                  <span className="text-gray-400">{format(event.date, "MMM d, yyyy HH:mm")}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      {openDates.length > 0 && (
        <Card className="bg-[#141415] border border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Calendar className="mr-2" />
              Open Dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {openDates.map((date, index) => (
                <li key={index} className="flex justify-between items-center">
                  <span>{format(date, "EEEE")}</span>
                  <span className="text-gray-400">{format(date, "MMM d, yyyy")}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

