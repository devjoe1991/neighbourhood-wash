'use client'

import { useState, useEffect } from 'react'
import { X, Settings, Shield, BarChart3, Target } from 'lucide-react'
import Link from 'next/link'

interface CookiePreferences {
  essential: boolean
  analytics: boolean
  marketing: boolean
}

interface CookieConsentProps {
  className?: string
}

export default function CookieConsent({ className = '' }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    // Check if user has already made cookie choices
    const cookieConsent = localStorage.getItem('cookie-consent')
    if (!cookieConsent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const acceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
    }

    saveCookiePreferences(allAccepted)
    setIsVisible(false)
  }

  const acceptEssentialOnly = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
    }

    saveCookiePreferences(essentialOnly)
    setIsVisible(false)
  }

  const saveCustomPreferences = () => {
    saveCookiePreferences(preferences)
    setIsVisible(false)
    setShowPreferences(false)
  }

  const saveCookiePreferences = (prefs: CookiePreferences) => {
    const consentData = {
      preferences: prefs,
      timestamp: new Date().toISOString(),
      version: '1.0',
    }

    localStorage.setItem('cookie-consent', JSON.stringify(consentData))

    // Initialize analytics if accepted
    if (prefs.analytics) {
      initializeAnalytics()
    }

    // Initialize marketing cookies if accepted
    if (prefs.marketing) {
      initializeMarketing()
    }
  }

  const initializeAnalytics = () => {
    // Google Analytics initialization would go here
    console.log('Analytics cookies enabled')
  }

  const initializeMarketing = () => {
    // Marketing cookie initialization would go here
    console.log('Marketing cookies enabled')
  }

  const handlePreferenceChange = (
    type: keyof CookiePreferences,
    value: boolean
  ) => {
    if (type === 'essential') return // Essential cookies can't be disabled

    setPreferences((prev) => ({
      ...prev,
      [type]: value,
    }))
  }

  if (!isVisible) return null

  return (
    <>
      {/* Cookie Consent Banner */}
      <div className={`fixed right-0 bottom-0 left-0 z-50 ${className}`}>
        <div className='border-t border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900'>
          <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
            <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
              <div className='flex-1'>
                <div className='flex items-start gap-3'>
                  <div className='mt-1 flex-shrink-0'>
                    <Shield className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                  </div>
                  <div>
                    <h3 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                      Your Privacy Matters
                    </h3>
                    <p className='text-sm leading-relaxed text-gray-700 dark:text-gray-300'>
                      We use cookies to ensure you get the best experience on
                      Neighbourhood Wash. You can choose which cookies to
                      accept.{' '}
                      <Link
                        href='/cookie-policy'
                        target='_blank'
                        className='text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                      >
                        Learn more about our cookie policy
                      </Link>
                    </p>
                  </div>
                </div>
              </div>

              <div className='flex flex-col gap-3 sm:flex-row lg:flex-shrink-0'>
                <button
                  onClick={() => setShowPreferences(true)}
                  className='inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                >
                  <Settings className='mr-2 h-4 w-4' />
                  Cookie Settings
                </button>
                <button
                  onClick={acceptEssentialOnly}
                  className='inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                >
                  Essential Only
                </button>
                <button
                  onClick={acceptAll}
                  className='inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700'
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Preferences Modal */}
      {showPreferences && (
        <div className='fixed inset-0 z-[60] overflow-y-auto'>
          <div className='flex min-h-screen items-center justify-center p-4'>
            <div
              className='bg-opacity-50 fixed inset-0 bg-black'
              onClick={() => setShowPreferences(false)}
            />

            <div className='relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-900'>
              <div className='sticky top-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
                    Cookie Preferences
                  </h2>
                  <button
                    onClick={() => setShowPreferences(false)}
                    className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  >
                    <X className='h-6 w-6' />
                  </button>
                </div>
              </div>

              <div className='space-y-6 px-6 py-6'>
                <p className='text-gray-700 dark:text-gray-300'>
                  Manage your cookie preferences below. You can change these
                  settings at any time.
                </p>

                {/* Essential Cookies */}
                <div className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start gap-3'>
                      <Shield className='mt-1 h-5 w-5 text-green-600 dark:text-green-400' />
                      <div>
                        <h3 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                          Essential Cookies
                        </h3>
                        <p className='mb-3 text-sm text-gray-700 dark:text-gray-300'>
                          These cookies are necessary for the website to
                          function and cannot be switched off. They enable core
                          functionality such as security, authentication, and
                          accessibility.
                        </p>
                        <div className='text-xs text-gray-500 dark:text-gray-400'>
                          <p>• User authentication and security</p>
                          <p>• Remember your preferences</p>
                          <p>• Essential platform functionality</p>
                        </div>
                      </div>
                    </div>
                    <div className='ml-4 flex-shrink-0'>
                      <div className='rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-200'>
                        Always Active
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start gap-3'>
                      <BarChart3 className='mt-1 h-5 w-5 text-blue-600 dark:text-blue-400' />
                      <div>
                        <h3 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                          Analytics Cookies
                        </h3>
                        <p className='mb-3 text-sm text-gray-700 dark:text-gray-300'>
                          These cookies help us understand how you use our
                          website so we can improve it. All data is anonymized
                          and used solely for improving user experience.
                        </p>
                        <div className='text-xs text-gray-500 dark:text-gray-400'>
                          <p>• Website usage statistics</p>
                          <p>• Performance monitoring</p>
                          <p>• User experience improvements</p>
                        </div>
                      </div>
                    </div>
                    <div className='ml-4 flex-shrink-0'>
                      <label className='relative inline-flex cursor-pointer items-center'>
                        <input
                          type='checkbox'
                          checked={preferences.analytics}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'analytics',
                              e.target.checked
                            )
                          }
                          className='peer sr-only'
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start gap-3'>
                      <Target className='mt-1 h-5 w-5 text-purple-600 dark:text-purple-400' />
                      <div>
                        <h3 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                          Marketing Cookies
                        </h3>
                        <p className='mb-3 text-sm text-gray-700 dark:text-gray-300'>
                          These cookies help us show you relevant advertisements
                          and measure the effectiveness of our marketing
                          campaigns.
                        </p>
                        <div className='text-xs text-gray-500 dark:text-gray-400'>
                          <p>• Personalized advertisements</p>
                          <p>• Marketing campaign effectiveness</p>
                          <p>• Social media integration</p>
                        </div>
                        <div className='mt-2 text-xs text-yellow-600 dark:text-yellow-400'>
                          Currently disabled - We will ask for consent before
                          enabling marketing cookies.
                        </div>
                      </div>
                    </div>
                    <div className='ml-4 flex-shrink-0'>
                      <div className='rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400'>
                        Coming Soon
                      </div>
                    </div>
                  </div>
                </div>

                <div className='rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20'>
                  <div className='flex items-start gap-3'>
                    <Shield className='mt-1 h-5 w-5 text-blue-600 dark:text-blue-400' />
                    <div>
                      <h4 className='mb-1 font-medium text-blue-900 dark:text-blue-100'>
                        Your Data is Safe
                      </h4>
                      <p className='text-sm text-blue-800 dark:text-blue-200'>
                        We never sell your personal data to third parties. All
                        data collection is transparent and complies with GDPR
                        and UK data protection laws.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className='sticky bottom-0 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800'>
                <div className='flex flex-col justify-end gap-3 sm:flex-row'>
                  <button
                    onClick={() => setShowPreferences(false)}
                    className='inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  >
                    Cancel
                  </button>
                  <Link
                    href='/cookie-policy'
                    target='_blank'
                    className='inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  >
                    Learn More
                  </Link>
                  <button
                    onClick={saveCustomPreferences}
                    className='inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700'
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
