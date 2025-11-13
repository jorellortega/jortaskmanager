"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Trash2, Info, Plus, CheckCircle2, Circle, Share2, Copy, Check, Loader2 } from "lucide-react"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabaseClient"
import { useEffect } from "react"

type ChecklistItem = {
  id: number | string
  text: string
  completed: boolean
  category?: string
}

type ChecklistCategory = {
  id: string
  name: string
  share_token: string | null
}

export default function ChecklistPage() {
  const [categories, setCategories] = useState<ChecklistCategory[]>([])
  const [checklists, setChecklists] = useState<{ [key: string]: ChecklistItem[] }>({})
  const [categoryIds, setCategoryIds] = useState<{ [key: string]: string }>({})
  const [newItemText, setNewItemText] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChecklists()
  }, [])

  const loadChecklists = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("checklist_categories")
        .select("id, category_name, share_token")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })

      if (categoriesError) throw categoriesError

      if (categoriesData && categoriesData.length > 0) {
        const cats: ChecklistCategory[] = categoriesData.map(c => ({
          id: c.id,
          name: c.category_name,
          share_token: c.share_token,
        }))
        setCategories(cats)
        setSelectedCategory(cats[0].name)
        setSelectedCategoryId(cats[0].id)
        if (cats[0].share_token) {
          setShareToken(cats[0].share_token)
        }

        // Load items for all categories
        const categoryMap: { [key: string]: ChecklistItem[] } = {}
        const idMap: { [key: string]: string } = {}

        for (const cat of cats) {
          idMap[cat.name] = cat.id
          const { data: itemsData } = await supabase
            .from("checklist_items")
            .select("id, text, completed, sort_order")
            .eq("category_id", cat.id)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true })

          categoryMap[cat.name] = (itemsData || []).map(item => ({
            id: item.id,
            text: item.text,
            completed: item.completed,
            category: cat.name,
          }))
        }

        setChecklists(categoryMap)
        setCategoryIds(idMap)
      } else {
        // No categories, create a default one
        const { data: newCategory, error: createError } = await supabase
          .from("checklist_categories")
          .insert({
            user_id: user.id,
            category_name: "Daily Tasks",
          })
          .select()
          .single()

        if (!createError && newCategory) {
          const cat: ChecklistCategory = {
            id: newCategory.id,
            name: newCategory.category_name,
            share_token: newCategory.share_token,
          }
          setCategories([cat])
          setSelectedCategory(cat.name)
          setSelectedCategoryId(cat.id)
          setChecklists({ [cat.name]: [] })
          setCategoryIds({ [cat.name]: cat.id })
        }
      }
    } catch (err) {
      console.error("Error loading checklists:", err)
    } finally {
      setLoading(false)
    }
  }

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemText.trim() || !selectedCategory || !selectedCategoryId) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: newItem, error } = await supabase
        .from("checklist_items")
        .insert({
          user_id: user.id,
          category_id: selectedCategoryId,
          text: newItemText.trim(),
          completed: false,
        })
        .select()
        .single()

      if (error) throw error

      setChecklists((prev) => ({
        ...prev,
        [selectedCategory]: [...(prev[selectedCategory] || []), {
          id: newItem.id,
          text: newItem.text,
          completed: newItem.completed,
          category: selectedCategory,
        }],
      }))
      setNewItemText("")
    } catch (err) {
      console.error("Error adding item:", err)
      alert("Failed to add item")
    }
  }

  const toggleItem = async (category: string, id: number | string) => {
    try {
      const item = checklists[category]?.find(i => i.id === id)
      if (!item) return

      const { error } = await supabase
        .from("checklist_items")
        .update({ completed: !item.completed })
        .eq("id", id)

      if (error) throw error

      setChecklists((prev) => ({
        ...prev,
        [category]: prev[category].map((item) =>
          item.id === id ? { ...item, completed: !item.completed } : item
        ),
      }))
    } catch (err) {
      console.error("Error toggling item:", err)
    }
  }

  const deleteItem = async (category: string, id: number | string) => {
    try {
      const { error } = await supabase
        .from("checklist_items")
        .delete()
        .eq("id", id)

      if (error) throw error

      setChecklists((prev) => ({
        ...prev,
        [category]: prev[category].filter((item) => item.id !== id),
      }))
    } catch (err) {
      console.error("Error deleting item:", err)
      alert("Failed to delete item")
    }
  }

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: newCategory, error } = await supabase
        .from("checklist_categories")
        .insert({
          user_id: user.id,
          category_name: newCategoryName.trim(),
        })
        .select()
        .single()

      if (error) throw error

      const cat: ChecklistCategory = {
        id: newCategory.id,
        name: newCategory.category_name,
        share_token: newCategory.share_token,
      }

      setCategories((prev) => [...prev, cat])
      setChecklists((prev) => ({
        ...prev,
        [cat.name]: [],
      }))
      setCategoryIds((prev) => ({
        ...prev,
        [cat.name]: cat.id,
      }))
      setSelectedCategory(cat.name)
      setSelectedCategoryId(cat.id)
      setNewCategoryName("")
    } catch (err) {
      console.error("Error adding category:", err)
      alert("Failed to add category")
    }
  }

  const deleteCategory = async (category: string) => {
    if (categories.length <= 1) {
      alert("You must have at least one category")
      return
    }

    try {
      const categoryId = categoryIds[category]
      if (!categoryId) return

      const { error } = await supabase
        .from("checklist_categories")
        .delete()
        .eq("id", categoryId)

      if (error) throw error

      const newCategories = categories.filter(c => c.name !== category)
      setCategories(newCategories)
      const newChecklists = { ...checklists }
      delete newChecklists[category]
      setChecklists(newChecklists)
      const newIds = { ...categoryIds }
      delete newIds[category]
      setCategoryIds(newIds)

      if (selectedCategory === category) {
        setSelectedCategory(newCategories[0].name)
        setSelectedCategoryId(newCategories[0].id)
        setShareToken(newCategories[0].share_token)
      }
    } catch (err) {
      console.error("Error deleting category:", err)
      alert("Failed to delete category")
    }
  }

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (typeof window === 'undefined') {
      return false
    }

    // Try fallback method first (more reliable in some contexts)
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      if (successful) {
        return true
      }
    } catch (fallbackErr) {
      console.log("Fallback copy method failed, trying clipboard API")
    }

    // Try modern clipboard API as fallback
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        return true
      }
    } catch (err) {
      console.log("Clipboard API failed:", err)
    }

    return false
  }

  const handleShare = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert("Please log in to share checklists")
        return
      }

      if (!selectedCategoryId) {
        alert("Please select a category")
        return
      }

      // Use the database function to generate and save share token
      console.log("Calling share_checklist_category with:", {
        p_category_id: selectedCategoryId,
        p_user_id: user.id,
        categoryIdType: typeof selectedCategoryId,
        userIdType: typeof user.id,
      })
      
      let token: string | null = null
      let error: any = null
      
      // Try RPC call first
      const rpcResult = await supabase.rpc('share_checklist_category', {
        p_category_id: selectedCategoryId,
        p_user_id: user.id,
      })
      
      token = rpcResult.data
      error = rpcResult.error

      // If RPC fails, try direct database update as fallback
      if (error) {
        console.error("RPC error details:", JSON.stringify(error, null, 2))
        console.error("Error code:", error.code)
        console.error("Error message:", error.message)
        console.error("Error details:", error.details)
        console.error("Error hint:", error.hint)
        console.log("Attempting fallback: direct database update")
        
        // Generate token manually
        const generateToken = () => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
          let result = ''
          for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length))
          }
          return result
        }
        
        const fallbackToken = generateToken()
        
        // Direct update
        const { data: updateData, error: updateError } = await supabase
          .from('checklist_categories')
          .update({
            is_shared: true,
            share_token: fallbackToken,
          })
          .eq('id', selectedCategoryId)
          .eq('user_id', user.id)
          .select('share_token')
          .single()
        
        if (updateError) {
          console.error("Fallback update error:", updateError)
          throw new Error(`RPC failed and fallback failed: ${error.message || 'Unknown error'}`)
        }
        
        token = updateData?.share_token || fallbackToken
        console.log("Fallback successful, token:", token)
      } else {
        console.log("RPC successful, token:", token)
      }

      if (!token) {
        throw new Error("Failed to generate share token")
      }
      
      if (token) {
        setShareToken(token)
        // Update the category in state
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === selectedCategoryId
              ? { ...cat, share_token: token }
              : cat
          )
        )

        // Copy to clipboard
        const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/checklist/share/${token}` : ''
        if (shareUrl) {
          const copied = await copyToClipboard(shareUrl)
          if (copied) {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          } else {
            setCopied(false)
          }
        }
      }
    } catch (err: any) {
      console.error("Error sharing checklist:", err)
      const errorMessage = err?.message || err?.error?.message || "Failed to generate share link"
      alert(`Failed to generate share link: ${errorMessage}`)
    }
  }

  const copyShareLink = async () => {
    if (shareToken && typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/checklist/share/${shareToken}`
      const copied = await copyToClipboard(shareUrl)
      if (copied) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const categoryNames = categories.map(c => c.name)
  const currentItems = checklists[selectedCategory] || []
  const completedCount = currentItems.filter((item) => item.completed).length
  const totalCount = currentItems.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  if (loading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-[#101217] via-[#181c24] to-[#0E0E0F] text-white pb-24 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading checklists...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#101217] via-[#181c24] to-[#0E0E0F] text-white pb-24">
      <div className="sticky top-0 z-30 bg-gradient-to-b from-[#101217] to-transparent pt-2 pb-4">
        <div className="container mx-auto flex items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center text-blue-400 hover:text-blue-300 font-semibold">
            <ArrowLeft className="mr-2" /> Dashboard
          </Link>
          <span className="text-xs text-gray-400 font-mono tracking-wide">Weekly Task Manager</span>
        </div>
        <div className="container mx-auto px-4 mt-2">
          <h1 className="text-4xl font-extrabold mb-1 tracking-tight drop-shadow-lg flex items-center gap-2">
            Checklist
            <Info className="h-6 w-6 text-blue-400 cursor-pointer" aria-label="Organize your tasks with customizable checklists." />
          </h1>
          <p className="text-lg text-blue-200/80 mb-2 font-medium">Stay organized and track your progress with interactive checklists.</p>
        </div>
      </div>

      <div className="container mx-auto px-2 md:px-4 mt-6">
        {/* Category Selection */}
        <Card className="bg-gradient-to-br from-[#181c24] to-[#101217] border border-blue-900/40 mb-8 shadow-2xl p-2 md:p-6 animate-fade-in-section">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-5 w-5 text-blue-300" aria-label="Select or create a checklist category" />
            <span className="text-blue-200/80 text-sm">Categories</span>
          </div>
          <CardHeader>
            <CardTitle className="text-white text-3xl tracking-wide mb-4 font-extrabold drop-shadow-lg">Checklist Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-6">
              {categoryNames.map((category) => {
                const categoryData = categories.find(c => c.name === category)
                return (
                <div key={category} className="relative inline-flex items-center gap-2">
                  <Button
                    onClick={() => {
                      setSelectedCategory(category)
                      setSelectedCategoryId(categoryData?.id || "")
                      setShareToken(categoryData?.share_token || null)
                    }}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className={`${
                      selectedCategory === category
                        ? "bg-gradient-to-r from-green-400 to-blue-500 text-white border-0"
                        : "bg-[#181c24] border-blue-700/40 text-gray-300 hover:bg-[#1e2228] hover:text-white"
                    } font-semibold px-6 py-2 rounded-xl shadow-lg transition-all`}
                  >
                    {category}
                  </Button>
                  {categoryNames.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteCategory(category)
                      }}
                      className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg -ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )
              })}
            </div>

            {/* Add New Category */}
            <form onSubmit={addCategory} className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="newCategory" className="text-white text-lg font-semibold mb-2 block">
                  New Category
                </Label>
                <Input
                  id="newCategory"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="bg-[#181c24] border-2 border-blue-700/40 text-white rounded-xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-500 transition-all text-lg shadow-inner"
                  placeholder="Enter category name"
                />
              </div>
              <Button
                type="submit"
                className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:from-green-500 hover:to-blue-600 transition-all text-lg mt-2 md:mt-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Progress Card */}
        {totalCount > 0 && (
          <Card className="bg-gradient-to-br from-[#181c24] to-[#101217] border border-blue-900/40 mb-8 shadow-xl p-2 md:p-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Progress: {selectedCategory}</span>
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
            <Info className="h-5 w-5 text-blue-300" aria-label="Manage your checklist items" />
            <span className="text-blue-200/80 text-sm">{selectedCategory}</span>
          </div>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-white text-3xl tracking-wide font-extrabold drop-shadow-lg">
                Checklist Items
              </CardTitle>
              <Button
                onClick={shareToken ? copyShareLink : handleShare}
                variant="outline"
                className="bg-[#181c24] border-blue-700/40 text-blue-400 hover:bg-[#1e2228] hover:text-blue-300"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : shareToken ? (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </>
                )}
              </Button>
            </div>
            {shareToken && typeof window !== 'undefined' && (
              <div className="mt-4 p-3 bg-[#101217] border border-blue-600/40 rounded-lg">
                <p className="text-gray-400 text-xs mb-2">Share Link:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/checklist/share/${shareToken}`}
                    className="flex-1 bg-[#0a0a0b] border border-blue-700/40 text-blue-400 text-sm font-mono p-2 rounded focus:outline-none focus:border-blue-500 cursor-text"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    onClick={copyShareLink}
                    size="sm"
                    variant="outline"
                    className="bg-[#181c24] border-blue-700/40 text-blue-400 hover:bg-[#1e2228] hover:text-blue-300"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                {copied && (
                  <p className="text-green-400 text-xs mt-2">Link copied to clipboard!</p>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {/* Add New Item */}
            <form onSubmit={addItem} className="flex flex-col md:flex-row md:items-end gap-4 mb-8">
              <div className="flex-1">
                <Label htmlFor="newItem" className="text-white text-lg font-semibold mb-2 block">
                  New Item
                </Label>
                <Input
                  id="newItem"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  className="bg-[#181c24] border-2 border-blue-700/40 text-white rounded-xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-500 transition-all text-lg shadow-inner"
                  placeholder="Enter a new checklist item"
                />
              </div>
              <Button
                type="submit"
                className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:from-green-500 hover:to-blue-600 transition-all text-lg mt-2 md:mt-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </form>

            {/* Checklist Items List */}
            <div className="space-y-3">
              {currentItems.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Circle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No items in this checklist yet.</p>
                  <p className="text-sm mt-2">Add your first item above to get started!</p>
                </div>
              ) : (
                currentItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      item.completed
                        ? "bg-[#181c24]/50 border-green-500/40 opacity-75"
                        : "bg-[#181c24] border-blue-700/40 hover:border-blue-500/60"
                    }`}
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleItem(selectedCategory, item.id)}
                      className="h-5 w-5 border-2 border-blue-400 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                    <span
                      className={`flex-1 text-lg ${
                        item.completed ? "line-through text-gray-500" : "text-white"
                      }`}
                    >
                      {item.text}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteItem(selectedCategory, item.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
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

