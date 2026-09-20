'use client'

import { createClient } from '@supabase/supabase-js'

export function getSupabaseUrl() {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  if (url.includes('demicneqd1zdparanatd')) {
    url = url.replace('demicneqd1zdparanatd', 'demicneqdizdparanatd')
  }
  return url
}

export function getSupabaseAnonKey() {
  return (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
}

let supabaseInstance = null

export function getSupabaseClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()

  if (!url || !key) {
    return null
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }

  return supabaseInstance
}
