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
  status: 'pending' | 'accepted' | 'rejected' | 'blocked'
  created_at: string
  updated_at: string
}

type PeerRequest = {
  id: string
  user_id: string
  peer_user_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'blocked'
  created_at: string
  updated_at: string
  requester_email?: string
  requester_name?: string
}

export default function PeerSyncPage() {
  const [syncKey, setSyncKey] = useState("")
  const [peerName, setPeerName] = useState("")
  const [scannedCode, setScannedCode] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [userCode, setUserCode] = useState<string>("")
  const [peers, setPeers] = useState<Peer[]>([])
  const [peerRequests, setPeerRequests] = useState<PeerRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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
      // Fetch user's peer connections
      const { data: peersData, error: peersError } = await supabase
        .from("peers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      
      if (peersError) {
        setError("Failed to fetch peers.")
      } else {
        setPeers(peersData || [])
      }

      // Fetch incoming peer requests
      const { data: requestsData, error: requestsError } = await supabase
        .from("peers")
        .select("*")
        .eq("peer_user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
      
      if (requestsError) {
        setError("Failed to fetch peer requests.")
      } else {
        // Fetch requester info for each incoming request
        const requestsWithInfo = await Promise.all(
          (requestsData || []).map(async (request) => {
            try {
              const { data: userData, error: userError } = await supabase
                .rpc('get_user_info', { user_id_param: request.user_id })
              
              if (!userError && userData && userData.length > 0) {
                return {
                  ...request,
                  requester_name: userData[0].name,
                  requester_email: userData[0].email
                }
              }
              return request
            } catch (err) {
              console.log("Error fetching requester info:", err)
              return request
            }
          })
        )
        setPeerRequests(requestsWithInfo)
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
    
    // First, try to get the peer's user info
    let peerInfo = null
    try {
      console.log("🔍 Fetching peer info for:", code)
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_info', { user_id_param: code })
      
      console.log("🔍 Peer info result:", { userData, userError })
      
      if (!userError && userData && userData.length > 0) {
        peerInfo = userData[0]
        console.log("✅ Got peer info:", peerInfo)
      } else {
        console.log("❌ No peer info found or error:", userError)
      }
    } catch (err) {
      console.log("❌ Error fetching peer info:", err)
    }
    
    const { data, error: insertError } = await supabase
      .from("peers")
      .insert([
        {
          user_id: userId,
          peer_user_id: code,
          status: "pending",
          peer_name: peerInfo?.name || peerName || null,
          peer_email: peerInfo?.email || null,
        },
      ])
      .select()
    if (insertError) {
      setError(insertError.message || "Failed to sync with peer.")
    } else if (data && data.length > 0) {
      setPeers((prev) => [data[0], ...prev])
      setSyncKey("")
      setPeerName("")
      setScannedCode("")
    }
    setLoading(false)
  }

  const handleScan = (result: string) => {
    setScannedCode(result)
    handleSync(result)
  }

  const handlePeerRequest = async (requestId: string, action: 'accept' | 'reject') => {
    if (!userId) return
    
    setLoading(true)
    setError(null)
    
    const newStatus = action === 'accept' ? 'accepted' : 'rejected'
    
    // Update the peer request status
    const { data, error } = await supabase
      .from("peers")
      .update({ status: newStatus })
      .eq("id", requestId)
      .select()
    
    if (error) {
      setError(`Failed to ${action} peer request.`)
    } else if (data && data.length > 0) {
      // If accepted, create a reciprocal connection
      if (action === 'accept') {
        const { error: reciprocalError } = await supabase
          .from("peers")
          .insert([{
            user_id: userId,
            peer_user_id: data[0].user_id,
            status: 'accepted'
          }])
        
        if (reciprocalError) {
          console.error('Failed to create reciprocal connection:', reciprocalError)
        }
      }
      
      // Update local state
      setPeerRequests(prev => prev.filter(req => req.id !== requestId))
      if (action === 'accept') {
        setPeers(prev => [...prev, data[0]])
      }
      
      setSuccessMessage(`Peer request ${action}ed successfully!`)
      setTimeout(() => setSuccessMessage(null), 3000)
    }
    setLoading(false)
  }

  const removePeer = async (peerId: string) => {
    if (!userId) return
    
    setLoading(true)
    setError(null)
    
    const { error } = await supabase
      .from("peers")
      .delete()
      .eq("id", peerId)
    
    if (error) {
      setError("Failed to remove peer.")
    } else {
      setPeers(prev => prev.filter(peer => peer.id !== peerId))
      setSuccessMessage("Peer removed successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    }
    setLoading(false)
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
              <div>
                <Label htmlFor="peerName" className="text-white">
                  Peer Name (Optional)
                </Label>
                <Input
                  id="peerName"
                  value={peerName}
                  onChange={(e) => setPeerName(e.target.value)}
                  placeholder="Enter peer's name for easier identification"
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
      {/* Peer Requests Section */}
      {peerRequests.length > 0 && (
        <Card className="bg-[#141415] border border-gray-700 mb-4">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="mr-2" />
              Pending Peer Requests ({peerRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {peerRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between bg-[#1A1A1B] p-3 rounded border border-gray-700">
                  <div>
                    <div className="text-white font-medium">New Peer Request</div>
                    <div className="text-sm text-gray-400">
                      {request.requester_name || request.requester_email || `User ID: ${request.user_id.substring(0, 8)}...`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(request.created_at), "MMM d, yyyy HH:mm")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handlePeerRequest(request.id, 'accept')}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={loading}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handlePeerRequest(request.id, 'reject')}
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      disabled={loading}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
              className="bg-[#1A1B] border-gray-700 text-white mb-4"
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
            <div className="space-y-3">
              {peers.map((peer) => (
                <div key={peer.id} className="flex flex-col md:flex-row md:justify-between md:items-center bg-[#1A1A1B] p-3 rounded border border-gray-700">
                  <div>
                    <div className="text-white font-medium">
                      {peer.peer_name || peer.peer_email || `Peer ID: ${peer.peer_user_id.substring(0, 8)}...`}
                    </div>
                    <div className="text-sm text-gray-400">
                      Status: <span className={`px-2 py-1 rounded text-xs ${
                        peer.status === 'accepted' ? 'bg-green-900 text-green-300' :
                        peer.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                        peer.status === 'rejected' ? 'bg-red-900 text-red-300' :
                        'bg-gray-900 text-gray-300'
                      }`}>
                        {peer.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Connected: {format(new Date(peer.created_at), "MMM d, yyyy HH:mm")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 md:mt-0">
                    {peer.status === 'accepted' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removePeer(peer.id)}
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        disabled={loading}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
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

      {/* Peer Sync Status */}
      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Users className="mr-2" />
            Peer Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-[#1A1A1B] rounded border border-gray-700">
              <div className="text-2xl font-bold text-blue-400">{peers.filter(p => p.status === 'accepted').length}</div>
              <div className="text-sm text-gray-400">Connected Peers</div>
            </div>
            <div className="p-3 bg-[#1A1A1B] rounded border border-gray-700">
              <div className="text-2xl font-bold text-yellow-400">{peerRequests.length}</div>
              <div className="text-sm text-gray-400">Pending Requests</div>
            </div>
            <div className="p-3 bg-[#1A1A1B] rounded border border-gray-700">
              <div className="text-2xl font-bold text-green-400">{peers.filter(p => p.status === 'pending').length}</div>
              <div className="text-sm text-gray-400">Outgoing Requests</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

