'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { getSupabaseClient, getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase/client'
import { getProfile, updateProfile, clearUserSessionData } from '@/lib/storage/localStorage'

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  isConfigured: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    const url = getSupabaseUrl()
    const key = getSupabaseAnonKey()
    const configured = Boolean(url && key)
    setIsConfigured(configured)

    const supabase = getSupabaseClient()

    if (!supabase) {
      setProfile(getProfile())
      setLoading(false)
      return
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        loadUserProfile(currentUser, supabase)
      } else {
        clearUserSessionData()
        setProfile(null)
        setLoading(false)
      }
    })

    // Listen to real-time auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        loadUserProfile(currentUser, supabase)
      } else {
        clearUserSessionData()
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  async function loadUserProfile(authUser, supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (data && !error) {
        const fullProfile = {
          id: data.id,
          full_name: data.full_name || authUser.user_metadata?.full_name || 'Safety Officer',
          organization: data.organization || 'Irisathenas Plant Safety',
          worker_id: data.worker_id || 'ISO-01',
          email: authUser.email,
        }
        setProfile(fullProfile)
        updateProfile(fullProfile)
      } else {
        // Fallback to auth metadata
        const fallback = {
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || 'Safety Officer',
          organization: authUser.user_metadata?.organization || 'Irisathenas Plant Safety',
          worker_id: authUser.user_metadata?.worker_id || 'ISO-01',
          email: authUser.email,
        }
        setProfile(fallback)
        updateProfile(fallback)
      }
    } catch (e) {
      console.warn('Profile fetch warning:', e)
    } finally {
      setLoading(false)
    }
  }

  // Sign In with email & password
  const signIn = async (email, password) => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error('Supabase is not configured. Please check environment variables.')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) throw error
    return data
  }

  // Sign Up with name, email, password, org, workerId
  const signUp = async ({ email, password, fullName, organization, workerId }) => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error('Supabase is not configured. Please check environment variables.')
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          organization: organization?.trim() || 'Irisathenas Plant Safety',
          worker_id: workerId?.trim() || 'ISO-' + Math.floor(1000 + Math.random() * 9000),
        },
      },
    })

    if (error) throw error

    // Create profile record if user created
    if (data?.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName.trim(),
        organization: organization?.trim() || 'Irisathenas Plant Safety',
        worker_id: workerId?.trim() || 'ISO-' + Math.floor(1000 + Math.random() * 9000),
      })
    }

    return data
  }

  // Sign Out
  const signOut = async () => {
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    clearUserSessionData()
    setUser(null)
    setProfile(null)
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  const refreshProfile = async () => {
    const supabase = getSupabaseClient()
    if (supabase && user) {
      await loadUserProfile(user, supabase)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isConfigured,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
