"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session and user role
    const fetchUserAndRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Fetch role from public.users table
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (!error && data) {
          setUserRole(data.role)
        } else {
          // Fallback to user_metadata if public.users doesn't have the role
          setUserRole(user.user_metadata?.role || 'user')
        }
      }
      
      setLoading(false)
    }

    fetchUserAndRole()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Fetch role from public.users table
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        if (!error && data) {
          setUserRole(data.role)
        } else {
          // Fallback to user_metadata if public.users doesn't have the role
          setUserRole(session.user.user_metadata?.role || 'user')
        }
      } else {
        setUserRole(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const isAdmin = userRole === 'admin'

  return {
    user,
    loading,
    isAdmin,
    userRole,
    isAuthenticated: !!user,
  }
}

