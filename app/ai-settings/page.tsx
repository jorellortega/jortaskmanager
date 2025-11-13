"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { AISetting } from '@/types'

const OPENAI_MODELS = [
  'gpt-4o-mini',
  'gpt-4o',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo',
]

const ANTHROPIC_MODELS = [
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
]

export default function AISettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading, isAdmin } = useAuth()
  const [settings, setSettings] = useState<AISetting[]>([])
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({})
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
      loadSettings()
    }
  }, [user, authLoading, isAdmin, router])

  const loadSettings = async () => {
    try {
      setIsLoadingSettings(true)
      const { data, error } = await supabase
        .from('ai_settings')
        .select('setting_key, setting_value, description, updated_at')
        .order('setting_key')

      if (error) throw error
      setSettings(data || [])
    } catch (err) {
      console.error('Error loading settings:', err)
      setError('Failed to load settings')
    } finally {
      setIsLoadingSettings(false)
    }
  }

  const updateValue = (key: string, value: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.setting_key === key ? { ...s, setting_value: value } : s))
    )
  }

  const toggleVisibility = (key: string) => {
    setVisibleKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const isSensitiveKey = (key: string) => {
    return key.includes('api_key')
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      // Save each setting individually
      for (const setting of settings) {
        const { error } = await supabase
          .from('ai_settings')
          .upsert({
            setting_key: setting.setting_key,
            setting_value: setting.setting_value,
            description: setting.description,
          }, {
            onConflict: 'setting_key',
          })

        if (error) throw error
      }

      // Reload to get updated timestamps
      await loadSettings()
    } catch (err) {
      console.error('Error saving settings:', err)
      setError('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || isLoadingSettings) {
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
          <h1 className="text-3xl font-bold mb-2">AI Settings</h1>
          <p className="text-gray-400">Configure AI provider keys and models</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <Card className="bg-[#141415] border-gray-800">
          <CardHeader>
            <CardTitle>Provider Configuration</CardTitle>
            <CardDescription>
              Manage API keys and model selections for AI providers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {settings.map((setting) => (
              <div key={setting.setting_key} className="space-y-2">
                <Label htmlFor={setting.setting_key} className="text-white">
                  {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </Label>
                {setting.description && (
                  <p className="text-sm text-gray-400">{setting.description}</p>
                )}

                {setting.setting_key === 'openai_model' ? (
                  <Select
                    value={setting.setting_value || ''}
                    onValueChange={(value) => updateValue(setting.setting_key, value)}
                  >
                    <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPENAI_MODELS.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : setting.setting_key === 'anthropic_model' ? (
                  <Select
                    value={setting.setting_value || ''}
                    onValueChange={(value) => updateValue(setting.setting_key, value)}
                  >
                    <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {ANTHROPIC_MODELS.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="relative">
                    <Input
                      id={setting.setting_key}
                      type={
                        isSensitiveKey(setting.setting_key) && !visibleKeys[setting.setting_key]
                          ? 'password'
                          : 'text'
                      }
                      value={setting.setting_value || ''}
                      onChange={(e) => updateValue(setting.setting_key, e.target.value)}
                      className="bg-[#1A1A1B] border-gray-700 text-white pr-10"
                    />
                    {isSensitiveKey(setting.setting_key) && (
                      <button
                        type="button"
                        onClick={() => toggleVisibility(setting.setting_key)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {visibleKeys[setting.setting_key] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                )}

                {setting.updated_at && (
                  <p className="text-xs text-gray-500">
                    Last updated: {new Date(setting.updated_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))}

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSave}
                disabled={isLoadingSettings || isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

