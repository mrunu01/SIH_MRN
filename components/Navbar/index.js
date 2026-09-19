'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Camera,
  History,
  BookOpen,
  User,
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = user ? [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/new-scan', label: 'New Scan', icon: Camera },
    { href: '/history', label: 'History', icon: History },
    { href: '/methodology', label: 'Methodology', icon: BookOpen },
  ] : [
    { href: '/', label: 'Home', icon: Home },
    { href: '/methodology', label: 'Methodology', icon: BookOpen },
  ]

  const isActive = (href) => pathname === href

  return (
    <nav style={{
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}>
          {/* Logo */}
          <Link href={user ? '/dashboard' : '/'} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: 'var(--color-text)',
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #0066cc, #004999)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}>
              <Shield size={20} />
            </div>
            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>AEGIS-BAND</span>
          </Link>

          {/* Desktop Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: isActive(item.href) ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  background: isActive(item.href) ? 'rgba(0, 102, 204, 0.1)' : 'transparent',
                  fontWeight: 500,
                  fontSize: 14,
                  transition: 'all 0.2s',
                }}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  href="/profile"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 6,
                    textDecoration: 'none',
                    color: isActive('/profile') ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    background: isActive('/profile') ? 'rgba(0, 102, 204, 0.1)' : 'transparent',
                    fontWeight: 500,
                    fontSize: 14,
                  }}
                >
                  <User size={16} />
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-text-secondary)',
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm">
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              display: 'none',
              padding: 8,
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text)',
              cursor: 'pointer',
            }}
            className="mobile-menu-btn"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div style={{
            padding: '16px 0',
            borderTop: '1px solid var(--color-border)',
          }}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  textDecoration: 'none',
                  color: isActive(item.href) ? 'var(--color-primary)' : 'var(--color-text)',
                  fontWeight: 500,
                }}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 0',
                    textDecoration: 'none',
                    color: 'var(--color-text)',
                    fontWeight: 500,
                  }}
                >
                  <User size={18} />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    handleLogout()
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 0',
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-text)',
                    fontWeight: 500,
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px',
                  marginTop: 12,
                  background: 'var(--color-primary)',
                  color: '#fff',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  )
}
