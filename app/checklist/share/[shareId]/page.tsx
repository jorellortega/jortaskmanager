"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Info, Loader2, CheckCircle2, Circle, Share2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Checkbox } from "@/components/ui/checkbox"

type ChecklistItem = {
  id: string
  text: string
  completed: boolean
  sort_order: number
}

type SharedChecklist = {
  category_name: string
  items: ChecklistItem[]
}

export default function SharedChecklistPage() {
  const params = useParams()
  const shareId = params.shareId as string
  const [checklist, setChecklist] = useState<SharedChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (shareId) {
      fetchSharedChecklist()
    }
  }, [shareId])

  const fetchSharedChecklist = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch the shared checklist by share_token
      const { data: categoryData, error: categoryError } = await supabase
        .from("checklist_categories")
        .select("id, category_name")
        .eq("share_token", shareId)
        .eq("is_shared", true)
        .single()

      if (categoryError || !categoryData) {
        throw new Error("Checklist not found or no longer shared")
      }

      // Fetch items for this category
      const { data: itemsData, error: itemsError } = await supabase
        .from("checklist_items")
        .select("id, text, completed, sort_order")
        .eq("category_id", categoryData.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })

      if (itemsError) {
        throw itemsError
      }

      setChecklist({
        category_name: categoryData.category_name,
        items: itemsData || [],
      })
    } catch (err) {
      console.error("Error fetching shared checklist:", err)
      setError(err instanceof Error ? err.message : "Failed to load checklist")
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = async (itemId: string, currentCompleted: boolean) => {
    try {
      setUpdating(itemId)

      // Update the item's completed status
      const { error } = await supabase
        .from("checklist_items")
        .update({ completed: !currentCompleted })
        .eq("id", itemId)

      if (error) throw error

      // Update local state
      setChecklist((prev) => {
        if (!prev) return null
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
        }
      })
    } catch (err) {
      console.error("Error updating item:", err)
      setError("Failed to update item")
    } finally {
      setUpdating(null)
    }
  }

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/checklist/share/${shareId}`
    navigator.clipboard.writeText(shareUrl)
    alert("Share link copied to clipboard!")
  }

  if (loading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-[#101217] via-[#181c24] to-[#0E0E0F] text-white pb-24 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading checklist...</p>
        </div>
      </div>
    )
  }

  if (error || !checklist) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-[#101217] via-[#181c24] to-[#0E0E0F] text-white pb-24 flex items-center justify-center">
        <Card className="bg-gradient-to-br from-[#181c24] to-[#101217] border border-red-900/40 max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <p className="text-red-400 text-lg mb-2">Error</p>
            <p className="text-gray-400">{error || "Checklist not found"}</p>
            <p className="text-gray-500 text-sm mt-4">
              This checklist may have been deleted or the share link is invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedCount = checklist.items.filter((item) => item.completed).length
  const totalCount = checklist.items.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#101217] via-[#181c24] to-[#0E0E0F] text-white pb-24">
      <div className="sticky top-0 z-30 bg-gradient-to-b from-[#101217] to-transparent pt-2 pb-4">
        <div className="container mx-auto flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono tracking-wide">Shared Checklist</span>
          </div>
          <Button
            onClick={copyShareLink}
            variant="outline"
            className="bg-[#181c24] border-blue-700/40 text-blue-400 hover:bg-[#1e2228] hover:text-blue-300"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
        </div>
        <div className="container mx-auto px-4 mt-2">
          <h1 className="text-4xl font-extrabold mb-1 tracking-tight drop-shadow-lg flex items-center gap-2">
            Checklist
            <Info className="h-6 w-6 text-blue-400 cursor-pointer" aria-label="Shared checklist - you can check items but cannot edit the list" />
          </h1>
          <p className="text-lg text-blue-200/80 mb-2 font-medium">Shared checklist - check items as you complete them</p>
        </div>
      </div>

      <div className="container mx-auto px-2 md:px-4 mt-6">
        {/* Progress Card */}
        {totalCount > 0 && (
          <Card className="bg-gradient-to-br from-[#181c24] to-[#101217] border border-blue-900/40 mb-8 shadow-xl p-2 md:p-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Progress</span>
                <span className="text-blue-400 text-lg">
                  {completedCount} / {totalCount}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-[#181c24] rounded-full h-4 border border-blue-700/40 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-gray-400 text-sm mt-2">{Math.round(progressPercentage)}% complete</p>
            </CardContent>
          </Card>
        )}

        {/* Checklist Items */}
        <Card className="bg-gradient-to-br from-[#181c24] to-[#101217] border border-blue-900/40 mb-8 shadow-2xl p-2 md:p-6 animate-fade-in-section">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-5 w-5 text-blue-300" aria-label="Checklist items" />
            <span className="text-blue-200/80 text-sm">Checklist Items</span>
          </div>
          <CardHeader>
            <CardTitle className="text-white text-3xl tracking-wide mb-4 font-extrabold drop-shadow-lg">
              Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Checklist Items List */}
            <div className="space-y-3">
              {checklist.items.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Circle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">This checklist is empty.</p>
                </div>
              ) : (
                checklist.items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      item.completed
                        ? "bg-[#181c24]/50 border-green-500/40 opacity-75"
                        : "bg-[#181c24] border-blue-700/40 hover:border-blue-500/60"
                    } ${updating === item.id ? "opacity-50" : ""}`}
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleItem(item.id, item.completed)}
                      disabled={updating === item.id}
                      className="h-5 w-5 border-2 border-blue-400 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                    <span
                      className={`flex-1 text-lg ${
                        item.completed ? "line-through text-gray-500" : "text-white"
                      }`}
                    >
                      {item.text}
                    </span>
                    {updating === item.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

