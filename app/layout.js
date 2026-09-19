import '../styles/globals.css'

export const metadata = {
  title: 'AEGIS-BAND v2 | Passive H₂S Dosimetry',
  description: 'Passive H₂S Dosimetry Wristband - We measure a distance, not a colour',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  )
}
