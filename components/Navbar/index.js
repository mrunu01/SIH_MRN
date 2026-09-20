'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Camera,
  History,
  BookOpen,
  User,
  Menu,
  X,
  Shield,
  LayoutDashboard,
  LogIn,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut } = useAuth()

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/new-scan', label: 'New Scan', icon: Camera },
    { href: '/history', label: 'History', icon: History },
    { href: '/methodology', label: 'Methodology', icon: BookOpen },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  const isActive = (href) => pathname === href

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

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
          <Link href="/dashboard" style={{
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
            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Irisathenas Band</span>
          </Link>

          {/* Desktop Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
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

            <Link
              href="/new-scan"
              className="btn btn-primary btn-sm"
              style={{ marginLeft: 6 }}
            >
              <Camera size={14} /> Scan Now
            </Link>

            {/* Auth Button */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 10 }}>
                <Link
                  href="/profile"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 10px',
                    borderRadius: 6,
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    textDecoration: 'none',
                    color: 'var(--color-text)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                  title={user.email}
                >
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'inline-block',
                  }} />
                  {profile?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Sign Out"
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: 6,
                    padding: '6px 8px',
                    cursor: 'pointer',
                    color: 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <LogIn size={14} /> Sign In
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

            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
              {user ? (
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); handleSignOut() }}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <LogOut size={16} /> Sign Out ({user.email})
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <LogIn size={16} /> Sign In / Register
                </Link>
              )}
            </div>
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
