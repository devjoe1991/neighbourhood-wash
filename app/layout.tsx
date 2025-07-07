import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/utils/supabase/server_new'
import { Toaster } from 'sonner'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Neighbourhood Wash',
  description: 'Connect with local washers for convenient laundry services',
  themeColor: [{ media: '(prefers-color-scheme: light)', color: 'white' }],
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang='en'>
      <body
        className={`${inter.variable} flex min-h-screen flex-col bg-white font-sans text-gray-900`}
      >
        <Header user={user} />
        <main className='flex-grow'>{children}</main>
        <Footer />
        <Toaster position='top-right' />
      </body>
    </html>
  )
}
