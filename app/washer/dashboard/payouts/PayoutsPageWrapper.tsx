import { requireWasherVerification } from '@/lib/middleware/washer-verification'
import PayoutsPageClient from './PayoutsPageClient'

export default async function PayoutsPageWrapper() {
  // Check authentication, washer status, and verification
  await requireWasherVerification()

  // If we reach here, the user is verified and can access the payouts page
  return <PayoutsPageClient />
}