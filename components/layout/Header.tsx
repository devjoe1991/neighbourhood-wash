import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Moon } from 'lucide-react'
// import { ThemeToggle } from '@/components/ThemeToggle';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/our-washers', label: 'Our Washers' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/faqs', label: 'FAQs' },
  { href: '/about', label: 'About Us' },
]

export default function Header() {
  return (
    <header className='sticky top-0 z-50 border-b bg-white shadow-sm'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          <div className='flex items-center'>
            <Link href='/' className='text-2xl font-bold text-blue-600'>
              Neighbourhood Wash
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
            {/* <ThemeToggle /> */}
            <Button variant='ghost' size='icon' disabled>
              <Moon className='h-5 w-5 text-gray-400' />
            </Button>
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
          </div>
        </div>
      </div>
    </header>
  )
}
