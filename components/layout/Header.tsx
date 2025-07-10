'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { type User } from '@supabase/supabase-js'
import { signOut } from '@/app/auth/actions'
// import { ThemeToggle } from '@/components/ThemeToggle';
import { useState } from 'react'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/our-washers', label: 'Our Washers' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/faqs', label: 'FAQs' },
  { href: '/about', label: 'About Us' },
]

interface HeaderProps {
  user: User | null
}

export default function Header({ user }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className='sticky top-0 z-50 border-b bg-white shadow-sm'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          <div className='flex items-center'>
            <Link href='/' className='text-2xl font-bold text-blue-600'>
              <span className='hidden sm:inline'>Neighbourhood Wash</span>
              <span className='sm:hidden'>NW</span>
            </Link>
          </div>
          <nav className='hidden space-x-1 md:flex lg:space-x-2'>
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className='rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className='flex items-center space-x-2'>
            <div className={`hidden items-center space-x-2 md:flex`}>
              {user ? (
                <>
                  <Button variant='outline' size='sm' asChild>
                    <Link href='/user/dashboard'>Dashboard</Link>
                  </Button>
                  <form action={signOut as (formData: FormData) => void}>
                    <Button
                      type='submit'
                      variant='ghost'
                      size='sm'
                      className='text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    >
                      Sign Out
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Button variant='outline' size='sm' asChild>
                    <Link href='/signin'>Sign In</Link>
                  </Button>
                  <Button
                    size='sm'
                    className='bg-blue-600 text-white hover:bg-blue-700'
                    asChild
                  >
                    <Link href='/signup'>Join Neighbourhood Wash</Link>
                  </Button>
                </>
              )}
            </div>
            <div className='md:hidden'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label='Toggle mobile menu'
              >
                {isMobileMenuOpen ? (
                  <X className='h-6 w-6' />
                ) : (
                  <Menu className='h-6 w-6' />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className='absolute top-16 left-0 w-full border-t bg-white shadow-lg md:hidden'>
          <nav className='flex flex-col space-y-1 p-4'>
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className='block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <hr className='my-2' />
            {user ? (
              <>
                <Link
                  href='/user/dashboard'
                  className='block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <form
                  action={signOut as (formData: FormData) => void}
                  className='w-full'
                >
                  <Button
                    type='submit'
                    variant='ghost'
                    size='sm'
                    className='w-full justify-start rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href='/signin'
                  className='block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href='/signup'
                  className='block rounded-md bg-blue-600 px-3 py-2 text-base font-medium text-white hover:bg-blue-700'
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Join Neighbourhood Wash
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
