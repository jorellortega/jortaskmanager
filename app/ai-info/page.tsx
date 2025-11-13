"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft, Plus, Trash2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { AISetting } from '@/types'

interface PromptSection {
  id: string
  name: string
  content: string
}

// Parse prompt into sections (split by ### headers)
function parsePromptIntoSections(prompt: string | null | undefined): PromptSection[] {
  if (!prompt) {
    return [{ id: '1', name: '', content: '' }]
  }

  const sections: PromptSection[] = []
  const parts = prompt.split(/^###\s+/m).filter((p) => p.trim())

  if (parts.length === 0) {
    return [{ id: '1', name: '', content: prompt }]
  }

  parts.forEach((part, index) => {
    // Extract name from first line if it exists, otherwise use empty string
    const lines = part.trim().split('\n')
    const firstLine = lines[0] || ''
    const name = firstLine.trim()
    const content = lines.slice(1).join('\n').trim()

    sections.push({
      id: String(index + 1),
      name: name,
      content: content,
    })
  })

  return sections.length > 0 ? sections : [{ id: '1', name: '', content: prompt }]
}

// Combine sections back into full prompt
function combineSectionsIntoPrompt(sections: PromptSection[]): string {
  return sections
    .map((section) => {
      const name = section.name.trim()
      const content = section.content.trim()
      const header = name ? `### ${name}` : '###'
      return content ? `${header}\n${content}` : header
    })
    .join('\n\n')
}

export default function AIInfoPage() {
  const router = useRouter()
  const { user, loading: authLoading, isAdmin } = useAuth()
  const [sections, setSections] = useState<PromptSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth')
        return
      }
      if (!isAdmin) {
        router.push('/dashboard')
        return
      }
      loadPrompt()
    }
  }, [user, authLoading, isAdmin, router])

  const loadPrompt = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('ai_settings')
        .select('setting_key, setting_value')
        .eq('setting_key', 'system_prompt')
        .maybeSingle()

      if (error) throw error
      setSections(parsePromptIntoSections((data as AISetting | null)?.setting_value))
    } catch (err) {
      console.error('Error loading prompt:', err)
      setError('Failed to load system prompt')
    } finally {
      setIsLoading(false)
    }
  }

  const updateSection = (id: string, field: 'name' | 'content', value: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  const addSection = () => {
    const newId = String(Date.now())
    setSections((prev) => [...prev, { id: newId, name: '', content: '' }])
  }

  const removeSection = (id: string) => {
    if (sections.length > 1) {
      setSections((prev) => prev.filter((s) => s.id !== id))
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      const fullPrompt = combineSectionsIntoPrompt(sections)

      const { error } = await supabase
        .from('ai_settings')
        .upsert(
          {
            setting_key: 'system_prompt',
            setting_value: fullPrompt,
            description: 'The system prompt that defines how the AI assistant behaves.',
          },
          {
            onConflict: 'setting_key',
          }
        )

      if (error) throw error
    } catch (err) {
      console.error('Error saving prompt:', err)
      setError('Failed to save system prompt')
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      setError(null)

      const fullPrompt = combineSectionsIntoPrompt(sections)

      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/generate-ai-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ prompt: fullPrompt }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate prompt')
      }

      const data = await response.json()
      const improvedPrompt = data.prompt

      if (improvedPrompt) {
        setSections(parsePromptIntoSections(improvedPrompt))
      }
    } catch (err) {
      console.error('Error generating prompt:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate improved prompt')
    } finally {
      setIsGenerating(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-blue-500 hover:text-blue-400 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">AI System Prompt</h1>
          <p className="text-gray-400">Build and customize the AI assistant's behavior</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <Card className="bg-[#141415] border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5" />
              System Prompt Builder
            </CardTitle>
            <CardDescription>
              Edit the system prompt that defines how the AI assistant behaves. Each section
              represents a part of the prompt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sections.map((section, index) => (
              <div key={section.id} className="space-y-2 p-4 border border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-white">Section {index + 1}</Label>
                  {sections.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(section.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor={`section-name-${section.id}`} className="text-gray-300 text-sm">
                      Section Name (optional)
                    </Label>
                    <Input
                      id={`section-name-${section.id}`}
                      value={section.name}
                      onChange={(e) => updateSection(section.id, 'name', e.target.value)}
                      placeholder="e.g., Role, Instructions, Tone"
                      className="bg-[#1A1A1B] border-gray-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`section-content-${section.id}`} className="text-gray-300 text-sm">
                      Content
                    </Label>
                    <Textarea
                      id={`section-content-${section.id}`}
                      value={section.content}
                      onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                      className="bg-[#1A1A1B] border-gray-700 text-white min-h-[120px] font-mono text-sm mt-1"
                      placeholder="Enter prompt section content..."
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addSection}
              className="w-full border-gray-700 bg-[#1A1A1B] text-white hover:bg-[#252526] hover:text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving || isGenerating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Prompt
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isSaving || isGenerating}
                variant="outline"
                className="border-gray-700 bg-[#1A1A1B] text-white hover:bg-[#252526] hover:text-white"
              >
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Sparkles className="mr-2 h-4 w-4" />
                Enhance with AI
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

