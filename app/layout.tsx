import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'


export const metadata: Metadata = {
  title: 'Device Protection Portal | Demo',
  description: 'Device protection enrollment and device management demonstration',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="border-b bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
          Demonstration only · Use synthetic customer data · No real payments or coverage
        </div>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
