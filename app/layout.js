import '../styles/globals.css'
import { AuthProvider } from '@/lib/context/AuthContext'

export const metadata = {
  title: 'Irisathenas Band | Passive H₂S Dosimetry',
  description: 'Irisathenas Band - Passive H₂S Dosimetry Wristband: We measure a distance, not a colour',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
