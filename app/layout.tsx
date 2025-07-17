import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import LegalProvider from '@/components/providers/LegalProvider'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Neighbourhood Wash',
  description: 'Connect with local washers for convenient laundry services',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang='en'>
      <body
        className={`${inter.variable} flex min-h-screen flex-col bg-white font-sans text-gray-900`}
        suppressHydrationWarning={true}
      >
        <LegalProvider>
          <Header user={user} />
          <main className='flex-grow'>{children}</main>
          <Footer />
          <Toaster />
        </LegalProvider>
      </body>
    </html>
  )
}
