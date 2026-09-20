'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Camera,
  History,
  BookOpen,
  User,
  Menu,
  X,
  Shield,
  LayoutDashboard
} from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/new-scan', label: 'New Scan', icon: Camera },
    { href: '/history', label: 'History', icon: History },
    { href: '/methodology', label: 'Methodology', icon: BookOpen },
    { href: '/profile', label: 'Profile', icon: User },
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
                  padding: '8px 14px',
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
              style={{ marginLeft: 8 }}
            >
              <Camera size={14} /> Scan Now
            </Link>
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
