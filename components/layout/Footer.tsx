import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className='border-t bg-gray-50'>
      <div className='container mx-auto px-4 py-12 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 gap-8 md:grid-cols-4'>
          {/* Company Info */}
          <div className='col-span-1 md:col-span-2'>
            <h3 className='mb-4 text-lg font-bold text-gray-900'>
              Neighbourhood Wash
            </h3>
            <p className='mb-4 text-gray-600'>
              Your friendly neighbourhood laundry solution. Connecting
              communities through convenient, reliable laundry services.
            </p>
            <div className='text-sm text-gray-500'>
              <p>Neighbourhood Wash Technologies Ltd</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className='mb-4 text-sm font-semibold tracking-wide text-gray-900 uppercase'>
              Quick Links
            </h4>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='/how-it-works'
                  className='text-gray-600 transition-colors hover:text-blue-600'
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href='/our-washers'
                  className='text-gray-600 transition-colors hover:text-blue-600'
                >
                  Our Washers
                </Link>
              </li>
              <li>
                <Link
                  href='/reviews'
                  className='text-gray-600 transition-colors hover:text-blue-600'
                >
                  Reviews
                </Link>
              </li>
              <li>
                <Link
                  href='/faqs'
                  className='text-gray-600 transition-colors hover:text-blue-600'
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  href='/about'
                  className='text-gray-600 transition-colors hover:text-blue-600'
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div>
            <h4 className='mb-4 text-sm font-semibold tracking-wide text-gray-900 uppercase'>
              Legal & Policies
            </h4>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='/terms-of-service'
                  className='text-gray-600 transition-colors hover:text-blue-600'
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href='/privacy-policy'
                  className='text-gray-600 transition-colors hover:text-blue-600'
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href='/cookie-policy'
                  className='text-gray-600 transition-colors hover:text-blue-600'
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  href='/cancellation-refund-policy'
                  className='text-gray-600 transition-colors hover:text-blue-600'
                >
                  Cancellation & Refunds
                </Link>
              </li>
              <li>
                <Link
                  href='/dispute-resolution-claims-policy'
                  className='text-gray-600 transition-colors hover:text-blue-600'
                >
                  Dispute Resolution
                </Link>
              </li>
              <li>
                <Link
                  href='/community-guidelines'
                  className='text-gray-600 transition-colors hover:text-blue-600'
                >
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='mt-8 border-t border-gray-200 pt-8'>
          <div className='flex flex-col items-center justify-between md:flex-row'>
            <div className='mb-4 text-sm text-gray-500 md:mb-0'>
              <p>
                &copy; {currentYear} Neighbourhood Wash Technologies Ltd. All
                rights reserved.
              </p>
            </div>
            <div className='flex space-x-6 text-sm text-gray-500'>
              <Link
                href='/terms-of-service'
                className='transition-colors hover:text-blue-600'
              >
                Terms
              </Link>
              <Link
                href='/privacy-policy'
                className='transition-colors hover:text-blue-600'
              >
                Privacy
              </Link>
              <Link
                href='/cookie-policy'
                className='transition-colors hover:text-blue-600'
              >
                Cookies
              </Link>
              <Link
                href='/community-guidelines'
                className='transition-colors hover:text-blue-600'
              >
                Guidelines
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
