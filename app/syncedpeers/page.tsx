"use client"

import { useState } from "react"
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

type PeerStatus = "online" | "offline" | "paused" | "blocked"

type SyncedPeer = {
  id: string
  name: string
  lastSynced: Date
  activeFeatures: string[]
  status: PeerStatus
  avatar: string
  syncState: "active" | "paused" | "blocked"
}

const mockPeers: SyncedPeer[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    lastSynced: new Date(2024, 2, 15, 14, 30),
    activeFeatures: ["Calendar", "Tasks", "Goals"],
    status: "online",
    avatar: "SJ",
    syncState: "active"
  },
  {
    id: "2",
    name: "Mike Chen",
    lastSynced: new Date(2024, 2, 14, 9, 45),
    activeFeatures: ["Calendar", "Fitness", "Meal Planning"],
    status: "offline",
    avatar: "MC",
    syncState: "paused"
  },
  {
    id: "3",
    name: "Emma Davis",
    lastSynced: new Date(2024, 2, 15, 11, 20),
    activeFeatures: ["Goals", "Tasks", "Notes"],
    status: "online",
    avatar: "ED",
    syncState: "active"
  }
]

export default function SyncedPeersPage() {
  const [peers, setPeers] = useState<SyncedPeer[]>(mockPeers)
  const [selectedPeer, setSelectedPeer] = useState<SyncedPeer | null>(null)
  const [showBlockDialog, setShowBlockDialog] = useState(false)

  const removePeer = (id: string) => {
    setPeers(prev => prev.filter(peer => peer.id !== id))
  }

  const syncWithPeer = (id: string) => {
    setPeers(prev =>
      prev.map(peer =>
        peer.id === id
          ? { ...peer, lastSynced: new Date() }
          : peer
      )
    )
  }

  const togglePauseSync = (id: string) => {
    setPeers(prev =>
      prev.map(peer =>
        peer.id === id
          ? { 
              ...peer, 
              syncState: peer.syncState === "paused" ? "active" : "paused",
              status: peer.syncState === "paused" ? "online" : "paused"
            }
          : peer
      )
    )
  }

  const blockPeer = (id: string) => {
    setPeers(prev =>
      prev.map(peer =>
        peer.id === id
          ? { ...peer, syncState: "blocked", status: "blocked" }
          : peer
      )
    )
    setShowBlockDialog(false)
  }

  const unsyncPeer = (id: string) => {
    removePeer(id)
  }

  const getStatusColor = (status: PeerStatus) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "offline":
        return "bg-gray-500"
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
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                        getStatusColor(peer.status)
                      }`}>
                        {peer.avatar}
                      </div>
                      <div>
                        <h3 className="text-white font-medium flex items-center gap-2">
                          {peer.name}
                          <span className={`w-2 h-2 rounded-full ${getStatusColor(peer.status)}`} />
                          {peer.syncState === "paused" && (
                            <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300">
                              Paused
                            </span>
                          )}
                          {peer.syncState === "blocked" && (
                            <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                              Blocked
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="h-4 w-4" />
                          Last synced: {format(peer.lastSynced, "MMM d, yyyy HH:mm")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {peer.syncState !== "blocked" && (
                        <>
                          <Button
                            onClick={() => syncWithPeer(peer.id)}
                            className="bg-blue-500 hover:bg-blue-600"
                            size="sm"
                            disabled={peer.syncState === "paused"}
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
                                onClick={() => togglePauseSync(peer.id)}
                              >
                                {peer.syncState === "paused" ? (
                                  <Play className="h-4 w-4 mr-2" />
                                ) : (
                                  <Pause className="h-4 w-4 mr-2" />
                                )}
                                {peer.syncState === "paused" ? "Resume Sync" : "Pause Sync"}
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
                                className="hover:bg-[#2a2a2b] cursor-pointer text-red-400"
                                onClick={() => unsyncPeer(peer.id)}
                              >
                                <Link2Off className="h-4 w-4 mr-2" />
                                Unsync
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                      {peer.syncState === "blocked" && (
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
                  <div className="mt-3">
                    <p className="text-sm text-gray-400 mb-2">Active Features:</p>
                    <div className="flex flex-wrap gap-2">
                      {peer.activeFeatures.map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 rounded-full text-xs bg-[#2a2a2b] text-gray-300"
                        >
                          {feature}
                        </span>
                      ))}
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
        </CardContent>
      </Card>

      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="bg-[#141415] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Block Peer</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to block {selectedPeer?.name}? This will:</p>
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