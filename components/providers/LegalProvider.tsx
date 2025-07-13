'use client'

import { Suspense } from 'react'
import CookieConsent from '@/components/legal/CookieConsent'

interface LegalProviderProps {
  children: React.ReactNode
}

export default function LegalProvider({ children }: LegalProviderProps) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <CookieConsent />
      </Suspense>
    </>
  )
}
