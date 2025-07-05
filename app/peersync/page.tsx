"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Calendar, Users, QrCode, Scan, Settings } from "lucide-react"
import Link from "next/link"
import { format, addDays, isSameDay } from "date-fns"
import QRCode from "react-qr-code"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabaseClient"

type Peer = {
  id: string
  user_id: string
  peer_user_id: string
  status: string
  created_at: string
}

export default function PeerSyncPage() {
  const [syncKey, setSyncKey] = useState("")
  const [scannedCode, setScannedCode] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [userCode, setUserCode] = useState<string>("")
  const [peers, setPeers] = useState<Peer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserAndPeers = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view peers.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      setUserCode(user.id)
      const { data, error: fetchError } = await supabase
        .from("peers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (fetchError) {
        setError("Failed to fetch peers.")
      } else {
        setPeers(data || [])
      }
      setLoading(false)
    }
    fetchUserAndPeers()
    // eslint-disable-next-line
  }, [])

  const handleSync = async (code: string) => {
    setError(null)
    if (!userId) {
      setError("You must be logged in to sync with a peer.")
      return
    }
    if (!code || code === userId) {
      setError("Please enter a valid peer sync code (not your own).")
      return
    }
    setLoading(true)
    const { data, error: insertError } = await supabase
      .from("peers")
      .insert([
        {
          user_id: userId,
          peer_user_id: code,
          status: "pending",
        },
      ])
      .select()
    if (insertError) {
      setError(insertError.message || "Failed to sync with peer.")
    } else if (data && data.length > 0) {
      setPeers((prev) => [data[0], ...prev])
      setSyncKey("")
      setScannedCode("")
    }
    setLoading(false)
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
                  Peer Sync Code
                </Label>
                <Input
                  id="syncKey"
                  value={syncKey}
                  onChange={(e) => setSyncKey(e.target.value)}
                  placeholder="Enter peer's sync code (user id)"
                  className="bg-[#1A1A1B] border-gray-700 text-white"
                />
              </div>
              <Button type="submit" className="w-full">
                Add Peer
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
            {userCode && <QRCode value={userCode} size={150} />}
            <p className="mt-4 text-lg font-semibold text-white break-all">{userCode}</p>
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
      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Users className="mr-2" />
            Your Peers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-blue-300 mb-2">Loading...</div>
          ) : peers.length === 0 ? (
            <p>No peers added yet.</p>
          ) : (
            <ul className="space-y-2">
              {peers.map((peer) => (
                <li key={peer.id} className="flex flex-col md:flex-row md:justify-between md:items-center bg-[#1A1A1B] p-2 rounded">
                  <div>
                    <span className="font-semibold">Peer ID:</span> <span className="break-all">{peer.peer_user_id}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 md:mt-0">
                    <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300">{peer.status}</span>
                    <span className="text-xs text-gray-500">{format(new Date(peer.created_at), "MMM d, yyyy HH:mm")}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      {error && <div className="bg-red-900 text-red-200 p-2 mb-4 rounded">{error}</div>}
      {/* Under Development Card */}
      <div className="container mx-auto mt-4 flex justify-center">
        <Card className="bg-yellow-100 border-yellow-400 text-yellow-900 w-full max-w-md">
          <CardContent className="flex flex-col items-center">
            <span className="font-bold text-lg">🚧 Under Development 🚧</span>
            <span className="text-sm">Peer calendar sync is coming soon.</span>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

