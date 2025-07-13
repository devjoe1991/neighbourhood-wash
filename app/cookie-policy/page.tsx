import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cookie Policy | Neighbourhood Wash - Your Data & Privacy Rights',
  description:
    'Learn about how Neighbourhood Wash uses cookies, your privacy choices, and how to manage cookie preferences. GDPR compliant cookie policy.',
  keywords:
    'cookie policy, privacy, data protection, GDPR, cookies, neighbourhood wash, laundry service',
  openGraph: {
    title: 'Cookie Policy | Neighbourhood Wash',
    description:
      'Transparent cookie usage and privacy choices for Neighbourhood Wash users',
    type: 'article',
  },
}

export default function CookiePolicy() {
  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      <div className='mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-12 text-center'>
          <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-white'>
            Cookie Policy
          </h1>
          <p className='mx-auto max-w-3xl text-xl text-gray-600 dark:text-gray-300'>
            How we use cookies to enhance your experience on Neighbourhood Wash
          </p>
          <div className='mt-4 text-sm text-gray-500 dark:text-gray-400'>
            <p>Effective Date: July 13, 2025</p>
            <p>Last Updated: July 13, 2025</p>
          </div>
        </div>

        {/* Quick Summary */}
        <div className='mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20'>
          <h2 className='mb-3 text-xl font-semibold text-blue-900 dark:text-blue-100'>
            Quick Summary
          </h2>
          <ul className='space-y-2 text-blue-800 dark:text-blue-200'>
            <li>• We use essential cookies to make our platform work</li>
            <li>
              • Analytics cookies help us improve user experience (with your
              consent)
            </li>
            <li>• You can manage your cookie preferences at any time</li>
            <li>• We never sell your data to third parties</li>
          </ul>
        </div>

        <div className='prose prose-gray dark:prose-invert max-w-none'>
          {/* What Are Cookies */}
          <section className='mb-8'>
            <h2 className='mb-4 text-2xl font-semibold text-gray-900 dark:text-white'>
              What Are Cookies?
            </h2>
            <p className='mb-4 text-gray-700 dark:text-gray-300'>
              Cookies are small text files stored on your device when you visit
              our website. They help us provide you with a better experience by
              remembering your preferences and enabling essential platform
              functionality.
            </p>
            <div className='rounded-lg bg-gray-100 p-4 dark:bg-gray-800'>
              <p className='text-sm text-gray-600 italic dark:text-gray-400'>
                Cookies contain information about your interactions with our
                website but never include personal details like passwords or
                payment information.
              </p>
            </div>
          </section>

          {/* Types of Cookies */}
          <section className='mb-8'>
            <h2 className='mb-6 text-2xl font-semibold text-gray-900 dark:text-white'>
              Types of Cookies We Use
            </h2>

            {/* Essential Cookies */}
            <div className='mb-6 rounded-lg border border-gray-200 p-6 dark:border-gray-700'>
              <h3 className='mb-3 text-xl font-semibold text-gray-900 dark:text-white'>
                Essential Cookies (Required)
              </h3>
              <p className='mb-4 text-gray-700 dark:text-gray-300'>
                These cookies are necessary for the website to function and
                cannot be switched off. They enable core functionality such as
                security, authentication, and accessibility.
              </p>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                  <thead className='bg-gray-50 dark:bg-gray-800'>
                    <tr>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400'>
                        Cookie Name
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400'>
                        Purpose
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400'>
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                    <tr>
                      <td className='px-4 py-3 text-sm text-gray-900 dark:text-gray-300'>
                        supabase-auth-token
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-700 dark:text-gray-300'>
                        User authentication
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-700 dark:text-gray-300'>
                        7 days
                      </td>
                    </tr>
                    <tr>
                      <td className='px-4 py-3 text-sm text-gray-900 dark:text-gray-300'>
                        theme-preference
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-700 dark:text-gray-300'>
                        Light/dark mode setting
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-700 dark:text-gray-300'>
                        1 year
                      </td>
                    </tr>
                    <tr>
                      <td className='px-4 py-3 text-sm text-gray-900 dark:text-gray-300'>
                        cookie-consent
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-700 dark:text-gray-300'>
                        Remember your cookie preferences
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-700 dark:text-gray-300'>
                        1 year
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className='mb-6 rounded-lg border border-gray-200 p-6 dark:border-gray-700'>
              <h3 className='mb-3 text-xl font-semibold text-gray-900 dark:text-white'>
                Analytics Cookies (Optional)
              </h3>
              <p className='mb-4 text-gray-700 dark:text-gray-300'>
                These cookies help us understand how you use our website so we
                can improve it. All data is anonymized and used solely for
                improving user experience.
              </p>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                  <thead className='bg-gray-50 dark:bg-gray-800'>
                    <tr>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400'>
                        Provider
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400'>
                        Purpose
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400'>
                        Data Collected
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                    <tr>
                      <td className='px-4 py-3 text-sm text-gray-900 dark:text-gray-300'>
                        Google Analytics
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-700 dark:text-gray-300'>
                        Website usage analytics
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-700 dark:text-gray-300'>
                        Page views, session duration, device type
                      </td>
                    </tr>
                    <tr>
                      <td className='px-4 py-3 text-sm text-gray-900 dark:text-gray-300'>
                        Hotjar
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-700 dark:text-gray-300'>
                        User behavior analysis
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-700 dark:text-gray-300'>
                        Click patterns, scroll behavior (anonymized)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className='mb-6 rounded-lg border border-gray-200 p-6 dark:border-gray-700'>
              <h3 className='mb-3 text-xl font-semibold text-gray-900 dark:text-white'>
                Marketing Cookies (Optional)
              </h3>
              <p className='mb-4 text-gray-700 dark:text-gray-300'>
                These cookies help us show you relevant advertisements and
                measure the effectiveness of our marketing campaigns.
              </p>
              <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20'>
                <p className='text-sm text-yellow-800 dark:text-yellow-200'>
                  <strong>Note:</strong> Marketing cookies are currently
                  disabled. We will ask for your explicit consent before
                  enabling any marketing or advertising cookies.
                </p>
              </div>
            </div>
          </section>

          {/* Your Cookie Choices */}
          <section className='mb-8'>
            <h2 className='mb-4 text-2xl font-semibold text-gray-900 dark:text-white'>
              Your Cookie Choices
            </h2>
            <div className='grid gap-6 md:grid-cols-2'>
              <div className='rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20'>
                <h3 className='mb-3 text-lg font-semibold text-blue-900 dark:text-blue-100'>
                  Manage Preferences
                </h3>
                <p className='mb-4 text-blue-800 dark:text-blue-200'>
                  You can update your cookie preferences at any time using our
                  cookie preference center.
                </p>
                <button className='rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'>
                  Cookie Preferences
                </button>
              </div>
              <div className='rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20'>
                <h3 className='mb-3 text-lg font-semibold text-green-900 dark:text-green-100'>
                  Browser Settings
                </h3>
                <p className='mb-4 text-green-800 dark:text-green-200'>
                  You can also control cookies through your browser settings.
                  Note that disabling essential cookies may affect
                  functionality.
                </p>
                <Link
                  href='#browser-instructions'
                  className='text-green-600 underline hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                >
                  Browser Instructions →
                </Link>
              </div>
            </div>
          </section>

          {/* GDPR Rights */}
          <section className='mb-8'>
            <h2 className='mb-4 text-2xl font-semibold text-gray-900 dark:text-white'>
              Your Rights Under GDPR
            </h2>
            <div className='rounded-lg bg-gray-50 p-6 dark:bg-gray-800'>
              <div className='grid gap-6 md:grid-cols-2'>
                <div>
                  <h3 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                    Data Subject Rights
                  </h3>
                  <ul className='space-y-2 text-gray-700 dark:text-gray-300'>
                    <li>• Right to access your data</li>
                    <li>• Right to rectification</li>
                    <li>• Right to erasure</li>
                    <li>• Right to data portability</li>
                  </ul>
                </div>
                <div>
                  <h3 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                    How to Exercise Rights
                  </h3>
                  <ul className='space-y-2 text-gray-700 dark:text-gray-300'>
                    <li>• Email: privacy@neighbourhoodwash.com</li>
                    <li>• Account settings dashboard</li>
                    <li>• Data export tool</li>
                    <li>• Account deletion option</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Browser Instructions */}
          <section className='mb-8' id='browser-instructions'>
            <h2 className='mb-4 text-2xl font-semibold text-gray-900 dark:text-white'>
              Browser Cookie Settings
            </h2>
            <div className='grid gap-6 md:grid-cols-2'>
              <div className='space-y-4'>
                <div className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
                  <h3 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                    Google Chrome
                  </h3>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    Settings → Privacy and security → Cookies and other site
                    data
                  </p>
                </div>
                <div className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
                  <h3 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                    Mozilla Firefox
                  </h3>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    Settings → Privacy & Security → Cookies and Site Data
                  </p>
                </div>
              </div>
              <div className='space-y-4'>
                <div className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
                  <h3 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                    Safari
                  </h3>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    Preferences → Privacy → Manage Website Data
                  </p>
                </div>
                <div className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
                  <h3 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                    Microsoft Edge
                  </h3>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    Settings → Cookies and site permissions → Cookies and site
                    data
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Third-Party Services */}
          <section className='mb-8'>
            <h2 className='mb-4 text-2xl font-semibold text-gray-900 dark:text-white'>
              Third-Party Services
            </h2>
            <p className='mb-4 text-gray-700 dark:text-gray-300'>
              We use reputable third-party services that may place cookies on
              your device. These services have their own privacy policies:
            </p>
            <div className='space-y-3'>
              <div className='flex items-center justify-between rounded-lg bg-gray-100 p-3 dark:bg-gray-800'>
                <span className='font-medium text-gray-900 dark:text-white'>
                  Google Analytics
                </span>
                <a
                  href='https://policies.google.com/privacy'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-600 underline dark:text-blue-400'
                >
                  Privacy Policy →
                </a>
              </div>
              <div className='flex items-center justify-between rounded-lg bg-gray-100 p-3 dark:bg-gray-800'>
                <span className='font-medium text-gray-900 dark:text-white'>
                  Supabase
                </span>
                <a
                  href='https://supabase.com/privacy'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-600 underline dark:text-blue-400'
                >
                  Privacy Policy →
                </a>
              </div>
              <div className='flex items-center justify-between rounded-lg bg-gray-100 p-3 dark:bg-gray-800'>
                <span className='font-medium text-gray-900 dark:text-white'>
                  Stripe
                </span>
                <a
                  href='https://stripe.com/privacy'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-600 underline dark:text-blue-400'
                >
                  Privacy Policy →
                </a>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className='mb-8'>
            <h2 className='mb-4 text-2xl font-semibold text-gray-900 dark:text-white'>
              Questions About Cookies?
            </h2>
            <div className='rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20'>
              <p className='mb-4 text-blue-800 dark:text-blue-200'>
                If you have any questions about our use of cookies or this
                Cookie Policy, please contact us:
              </p>
              <div className='space-y-2 text-blue-800 dark:text-blue-200'>
                <p>
                  <strong>Email:</strong> privacy@neighbourhoodwash.com
                </p>
                <p>
                  <strong>Address:</strong> Neighbourhood Wash Ltd, London, UK
                </p>
                <p>
                  <strong>Data Protection Officer:</strong>{' '}
                  dpo@neighbourhoodwash.com
                </p>
              </div>
            </div>
          </section>

          {/* Related Documents */}
          <section className='mb-8'>
            <h2 className='mb-4 text-2xl font-semibold text-gray-900 dark:text-white'>
              Related Documents
            </h2>
            <div className='grid gap-4 md:grid-cols-3'>
              <Link
                href='/privacy-policy'
                className='block rounded-lg bg-gray-100 p-4 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
              >
                <h3 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                  Privacy Policy
                </h3>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  How we collect and use your data
                </p>
              </Link>
              <Link
                href='/terms-of-service'
                className='block rounded-lg bg-gray-100 p-4 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
              >
                <h3 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                  Terms of Service
                </h3>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Platform usage terms and conditions
                </p>
              </Link>
              <Link
                href='/community-guidelines'
                className='block rounded-lg bg-gray-100 p-4 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
              >
                <h3 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                  Community Guidelines
                </h3>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Community standards and conduct
                </p>
              </Link>
            </div>
          </section>

          {/* Update Notice */}
          <section className='rounded-lg bg-gray-100 p-6 dark:bg-gray-800'>
            <h2 className='mb-3 text-lg font-semibold text-gray-900 dark:text-white'>
              Updates to This Policy
            </h2>
            <p className='text-gray-700 dark:text-gray-300'>
              We may update this Cookie Policy from time to time. When we make
              changes, we will update the "Last Updated" date at the top of this
              page and notify you through our platform or by email for
              significant changes.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
