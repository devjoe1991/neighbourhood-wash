import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Moon } from 'lucide-react';
// import { ThemeToggle } from '@/components/ThemeToggle';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/our-washers', label: 'Our Washers' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/faqs', label: 'FAQs' },
  { href: '/about', label: 'About Us' },
];

export default function Header() {
  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Neighbourhood Wash
            </Link>
          </div>
          <nav className="hidden md:flex space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center space-x-2">
            {/* <ThemeToggle /> */}
            <Button variant="ghost" size="icon" disabled>
              <Moon className="h-5 w-5 text-gray-400" />
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
              <Link href="/join">Join Neighbourhood Wash</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
} 