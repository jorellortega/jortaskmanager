"use client"

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Send, MessageSquare } from 'lucide-react'
import type { AIMessage } from '@/types'

const INITIAL_ASSISTANT_MESSAGE: AIMessage = {
  role: 'assistant',
  content: "Hello! I'm your AI assistant. How can I help you organize your tasks and boost your productivity today?",
  timestamp: new Date().toISOString(),
}

export function AIChat() {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    if (isExpanded) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    }
  }, [messages, isExpanded])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: AIMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    // Expand chat on first message
    let currentMessages = messages
    if (!isExpanded) {
      setIsExpanded(true)
      // Add initial assistant message when expanding
      currentMessages = [INITIAL_ASSISTANT_MESSAGE]
      setMessages(currentMessages)
    }

    // Optimistically add user message
    const messagesWithUser = [...currentMessages, userMessage]
    setMessages(messagesWithUser)
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Please log in to use the AI assistant')
      }

      // Build conversation history (exclude system messages)
      const history = messagesWithUser
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }))

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: history,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to get AI response')
      }

      const data = await response.json()
      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
      // Remove the optimistic user message on error
      setMessages(messagesWithUser.filter((m) => m !== userMessage))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatMessage = (content: string) => {
    // Simple markdown link handling
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const parts: (string | JSX.Element)[] = []
    let lastIndex = 0
    let match

    while ((match = linkRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index))
      }
      parts.push(
        <a
          key={match.index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          {match[1]}
        </a>
      )
      lastIndex = linkRegex.lastIndex
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex))
    }

    return parts.length > 0 ? parts : content
  }

  // Compact view (before first message)
  if (!isExpanded) {
    return (
      <Card className="bg-[#141415] border-gray-800 text-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about task management, productivity, or your schedule..."
              className="flex-1 bg-[#1A1A1B] border-gray-700 text-white resize-none"
              rows={2}
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-red-900/20 border border-red-500 rounded text-red-400 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Expanded view (after first message)
  return (
    <Card className="bg-[#141415] border-gray-800 text-white h-[600px] flex flex-col">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-700">
          <MessageSquare className="h-5 w-5 text-blue-400" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>

        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2"
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1A1A1B] text-gray-200 border border-gray-700'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap break-words">
                  {formatMessage(message.content)}
                </div>
                {message.timestamp && (
                  <div className="text-xs mt-1 opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#1A1A1B] border border-gray-700 rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="mb-2 p-2 bg-red-900/20 border border-red-500 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about task management, productivity, or your schedule..."
            className="flex-1 bg-[#1A1A1B] border-gray-700 text-white resize-none"
            rows={2}
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

