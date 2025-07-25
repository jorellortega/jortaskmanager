"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, X, Check, Clock, Calendar, Pause, Play, Ban, Link2Off } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabaseClient"

type Peer = {
  id: string
  user_id: string
  peer_user_id: string
  status: string
  sync_state: string
  last_synced: string | null
  active_features: string[] | null
  created_at: string
}

export default function SyncedPeersPage() {
  const [peers, setPeers] = useState<Peer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedPeer, setSelectedPeer] = useState<Peer | null>(null)
  const [showBlockDialog, setShowBlockDialog] = useState(false)

  useEffect(() => {
    const fetchPeers = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view peers.")
        setLoading(false)
        return
      }
      setUserId(user.id)
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
    fetchPeers()
    // eslint-disable-next-line
  }, [])

  const updatePeer = async (id: string, updates: Partial<Peer>) => {
    setLoading(true)
    setError(null)
    const { data, error: updateError } = await supabase
      .from("peers")
      .update(updates)
      .eq("id", id)
      .select()
    if (updateError) {
      setError(updateError.message || "Failed to update peer.")
    } else if (data && data.length > 0) {
      setPeers((prev) => prev.map((peer) => peer.id === id ? data[0] : peer))
    }
    setLoading(false)
  }

  const removePeer = async (id: string) => {
    setLoading(true)
    setError(null)
    const { error: deleteError } = await supabase
      .from("peers")
      .delete()
      .eq("id", id)
    if (deleteError) {
      setError(deleteError.message || "Failed to remove peer.")
    } else {
      setPeers((prev) => prev.filter((peer) => peer.id !== id))
    }
    setLoading(false)
  }

  const syncWithPeer = async (id: string) => {
    await updatePeer(id, { last_synced: new Date().toISOString() })
  }

  const togglePauseSync = async (id: string, currentState: string) => {
    await updatePeer(id, {
      sync_state: currentState === "paused" ? "active" : "paused"
    })
  }

  const blockPeer = async (id: string) => {
    await updatePeer(id, { sync_state: "blocked" })
    setShowBlockDialog(false)
  }

  const getStatusColor = (sync_state: string) => {
    switch (sync_state) {
      case "active":
        return "bg-green-500"
      case "paused":
        return "bg-yellow-500"
      case "blocked":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
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
            Synced Peers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {peers.map((peer) => (
              <Card key={peer.id} className="bg-[#1a1a1b] border border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getStatusColor(peer.sync_state)}`}>
                        {peer.peer_user_id.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-white font-medium flex items-center gap-2">
                          Peer: {peer.peer_user_id.slice(0, 8)}...{/* Show partial id for now */}
                          <span className={`w-2 h-2 rounded-full ${getStatusColor(peer.sync_state)}`} />
                          {peer.sync_state === "paused" && (
                            <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300">
                              Paused
                            </span>
                          )}
                          {peer.sync_state === "blocked" && (
                            <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                              Blocked
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="h-4 w-4" />
                          Last synced: {peer.last_synced ? format(new Date(peer.last_synced), "MMM d, yyyy HH:mm") : "Never"}
                        </div>
                        {peer.active_features && peer.active_features.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {peer.active_features.map((feature) => (
                              <span key={feature} className="text-xs bg-blue-900 text-blue-200 px-2 py-0.5 rounded">
                                {feature}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {peer.sync_state !== "blocked" && (
                        <>
                          <Button
                            onClick={() => syncWithPeer(peer.id)}
                            className="bg-blue-500 hover:bg-blue-600"
                            size="sm"
                            disabled={peer.sync_state === "paused"}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Sync Now
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <X className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#1a1a1b] border-gray-700 text-white">
                              <DropdownMenuItem
                                className="hover:bg-[#2a2a2b] cursor-pointer"
                                onClick={() => togglePauseSync(peer.id, peer.sync_state)}
                              >
                                {peer.sync_state === "paused" ? (
                                  <Play className="h-4 w-4 mr-2" />
                                ) : (
                                  <Pause className="h-4 w-4 mr-2" />
                                )}
                                {peer.sync_state === "paused" ? "Resume Sync" : "Pause Sync"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="hover:bg-[#2a2a2b] cursor-pointer"
                                onClick={() => {
                                  setSelectedPeer(peer)
                                  setShowBlockDialog(true)
                                }}
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Block Peer
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="hover:bg-[#2a2a2b] cursor-pointer text-red-500"
                                onClick={() => removePeer(peer.id)}
                              >
                                <Link2Off className="h-4 w-4 mr-2" />
                                Unsync
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                      {peer.sync_state === "blocked" && (
                        <Button
                          onClick={() => removePeer(peer.id)}
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {peers.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No synced peers yet</p>
              </div>
            )}
          </div>
          {error && <div className="bg-red-900 text-red-200 p-2 mb-4 rounded">{error}</div>}
          {loading && <div className="text-blue-300 mb-2">Loading...</div>}
        </CardContent>
      </Card>

      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="bg-[#141415] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Block Peer</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to block {selectedPeer?.peer_user_id}? This will:</p>
            <ul className="list-disc list-inside mt-2 text-gray-400">
              <li>Stop all syncing activities</li>
              <li>Prevent future sync requests</li>
              <li>Hide your updates from them</li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowBlockDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              onClick={() => selectedPeer && blockPeer(selectedPeer.id)}
            >
              Block Peer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 