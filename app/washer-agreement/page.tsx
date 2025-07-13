import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Washer Agreement | Neighbourhood Wash',
  description:
    'Read the specific agreement for Washers on Neighbourhood Wash platform, including independent contractor terms, service expectations, and financial responsibilities.',
  keywords:
    'washer agreement, independent contractor, neighbourhood wash, washer terms, service provider agreement',
  openGraph: {
    title: 'Washer Agreement | Neighbourhood Wash',
    description: 'Washer Agreement for Neighbourhood Wash service providers',
    type: 'website',
  },
}

export default function WasherAgreementPage() {
  return (
    <div className='min-h-screen bg-white'>
      <div className='container mx-auto px-4 py-12 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-4xl'>
          {/* Header */}
          <div className='mb-12 text-center'>
            <h1 className='mb-4 text-4xl font-bold text-gray-900'>
              Washer Agreement
            </h1>
            <p className='text-lg text-gray-600'>Last Updated: 13 July 2025</p>
          </div>

          {/* Content */}
          <div className='prose prose-lg max-w-none'>
            <div className='mb-8 border-l-4 border-blue-400 bg-blue-50 p-6'>
              <p className='font-medium text-blue-900'>
                This agreement forms a distinct part of the main{' '}
                <a
                  href='/terms-of-service'
                  className='text-blue-700 underline hover:text-blue-900'
                >
                  Terms of Service
                </a>{' '}
                and must be explicitly agreed to during the Washer onboarding
                process.
              </p>
              <p className='mt-2 text-blue-900'>
                By becoming a Washer on the Neighbourhood Wash platform, you
                agree to the following additional terms:
              </p>
            </div>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                1. Independent Contractor Status
              </h2>
              <p className='mb-4 text-gray-700'>
                You acknowledge and agree that you are operating as a
                self-employed independent contractor. You are not an employee,
                partner, or agent of Neighbourhood Wash. You are solely
                responsible for:
              </p>
              <ul className='ml-6 space-y-2 text-gray-700'>
                <li>
                  • Paying your own income tax and National Insurance
                  contributions.
                </li>
                <li>
                  • Managing your own business expenses, including but not
                  limited to, laundry supplies, equipment maintenance, and
                  transportation.
                </li>
                <li>
                  • Your own work schedule and deciding which bookings to
                  accept.
                </li>
                <li>
                  • Any licenses, permits, or registrations required for your
                  self-employed activity.
                </li>
              </ul>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                2. Service Level Expectations
              </h2>
              <p className='mb-4 text-gray-700'>
                You commit to providing a high-quality, professional service to
                all Users, which includes:
              </p>

              <div className='mb-6 grid gap-6 md:grid-cols-2'>
                <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
                  <h3 className='mb-3 text-lg font-semibold text-green-900'>
                    Quality Standards
                  </h3>
                  <ul className='space-y-1 text-sm text-green-800'>
                    <li>
                      • Performing all Services (washing, drying, ironing, stain
                      removal, hypoallergenic washing) to a high standard
                    </li>
                    <li>
                      • Following reasonable and clearly communicated
                      instructions from Users
                    </li>
                    <li>• Exercising reasonable care in handling all items</li>
                  </ul>
                </div>

                <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
                  <h3 className='mb-3 text-lg font-semibold text-blue-900'>
                    Hygiene & Equipment
                  </h3>
                  <ul className='space-y-1 text-sm text-blue-800'>
                    <li>
                      • Using clean, well-maintained domestic equipment (washing
                      machine, dryer, iron)
                    </li>
                    <li>
                      • Using appropriate, non-damaging, and where specified,
                      hypoallergenic cleaning products
                    </li>
                    <li>
                      • Maintaining clean and hygienic home environment for
                      laundry processing
                    </li>
                  </ul>
                </div>

                <div className='rounded-lg border border-purple-200 bg-purple-50 p-4'>
                  <h3 className='mb-3 text-lg font-semibold text-purple-900'>
                    Communication
                  </h3>
                  <ul className='space-y-1 text-sm text-purple-800'>
                    <li>• Being on time for scheduled handovers</li>
                    <li>
                      • Communicating professionally and promptly via in-app
                      chat
                    </li>
                    <li>
                      • Notifying Users of any delays, issues, or questions
                    </li>
                  </ul>
                </div>

                <div className='rounded-lg border border-orange-200 bg-orange-50 p-4'>
                  <h3 className='mb-3 text-lg font-semibold text-orange-900'>
                    Special Services
                  </h3>
                  <ul className='space-y-1 text-sm text-orange-800'>
                    <li>
                      • If offering stain removal: possess necessary skills and
                      equipment
                    </li>
                    <li>
                      • If offering ironing: have appropriate equipment and
                      skill
                    </li>
                    <li>
                      • Use hypoallergenic products when requested for
                      sensitivities
                    </li>
                  </ul>
                </div>
              </div>

              <div className='border-l-4 border-red-400 bg-red-50 p-4'>
                <h4 className='mb-3 text-lg font-semibold text-red-900'>
                  Important Note
                </h4>
                <p className='text-red-800'>
                  You acknowledge that Neighbourhood Wash is not liable for
                  items left in User's pockets that may cause damage to your
                  equipment or the garment itself. Users are responsible for
                  checking their garments.
                </p>
              </div>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                3. Insurance (Crucial)
              </h2>
              <div className='rounded-lg border-2 border-red-200 bg-red-50 p-6'>
                <div className='flex items-start gap-3'>
                  <div className='mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-500'>
                    <span className='text-sm font-bold text-white'>!</span>
                  </div>
                  <div>
                    <h3 className='mb-3 text-lg font-semibold text-red-900'>
                      Critical Insurance Requirement
                    </h3>
                    <p className='mb-4 text-red-800'>
                      You acknowledge that Neighbourhood Wash{' '}
                      <strong>DOES NOT</strong> provide any form of public
                      liability or business insurance to Washers. It is your{' '}
                      <strong>sole responsibility</strong> to obtain and
                      maintain adequate insurance to cover potential damages,
                      accidents, or liabilities arising from your provision of
                      Services on the Platform.
                    </p>
                    <p className='mb-4 text-red-800'>
                      This includes, but is not limited to:
                    </p>
                    <ul className='ml-4 space-y-1 text-red-800'>
                      <li>• Damage to User's property</li>
                      <li>• Damage to your own property</li>
                      <li>• Personal injury</li>
                      <li>
                        • Any claims arising from the laundry services you
                        provide
                      </li>
                    </ul>
                    <p className='font-medium text-red-800'>
                      We strongly recommend you seek professional advice on
                      appropriate insurance coverage.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                4. Financial Agreement
              </h2>
              <p className='mb-4 text-gray-700'>
                You explicitly agree to the following financial terms:
              </p>

              <div className='mb-6 grid gap-4 md:grid-cols-3'>
                <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center'>
                  <h3 className='mb-2 text-lg font-semibold text-yellow-900'>
                    Onboarding Fee
                  </h3>
                  <p className='text-2xl font-bold text-yellow-800'>£50</p>
                  <p className='mt-2 text-sm text-yellow-700'>
                    One-time, non-refundable fee (subject to promotions)
                  </p>
                </div>

                <div className='rounded-lg border border-blue-200 bg-blue-50 p-4 text-center'>
                  <h3 className='mb-2 text-lg font-semibold text-blue-900'>
                    Service Commission
                  </h3>
                  <p className='text-2xl font-bold text-blue-800'>15%</p>
                  <p className='mt-2 text-sm text-blue-700'>
                    Deducted from total booking price
                  </p>
                </div>

                <div className='rounded-lg border border-purple-200 bg-purple-50 p-4 text-center'>
                  <h3 className='mb-2 text-lg font-semibold text-purple-900'>
                    Payout Fee
                  </h3>
                  <p className='text-2xl font-bold text-purple-800'>£2.50</p>
                  <p className='mt-2 text-sm text-purple-700'>
                    Per withdrawal from earnings wallet
                  </p>
                </div>
              </div>

              <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                <p className='text-sm text-gray-700'>
                  <strong>Important:</strong> You acknowledge that commission
                  and payout fee rates may change at any time, and we reserve
                  the right to modify them with prior notice. All payments will
                  be processed via Stripe Connect, and by creating an account,
                  you agree to Stripe's connected account agreement.
                </p>
              </div>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                5. Tax Responsibility
              </h2>
              <div className='border-l-4 border-orange-400 bg-orange-50 p-6'>
                <p className='font-medium text-orange-900'>
                  You are solely responsible for declaring and paying all
                  applicable income tax and National Insurance contributions to
                  HMRC (His Majesty's Revenue and Customs) on all earnings
                  received through the Neighbourhood Wash Platform.
                  Neighbourhood Wash will not deduct taxes or contributions on
                  your behalf.
                </p>
              </div>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                6. Washer Cancellations & Penalties
              </h2>
              <p className='mb-4 text-gray-700'>
                We understand that cancellations may occasionally be
                unavoidable. However, to maintain platform reliability and
                compensate Users and Washers for lost time and opportunity, the
                following applies:
              </p>

              <div className='space-y-4'>
                <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
                  <h3 className='mb-2 text-lg font-semibold text-green-900'>
                    Cancellations outside 12 hours
                  </h3>
                  <p className='text-green-800'>
                    If you cancel a booking more than 12 hours before the
                    scheduled drop-off time, the User will receive a full
                    refund, and <strong>no penalty</strong> will be applied to
                    your account.
                  </p>
                </div>

                <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
                  <h3 className='mb-2 text-lg font-semibold text-red-900'>
                    Cancellations within 12 hours
                  </h3>
                  <p className='mb-3 text-red-800'>
                    If you cancel a booking within 12 hours of the scheduled
                    drop-off time, the User will receive a full and automatic
                    refund. In addition, you will be liable to pay a penalty
                    equivalent to the{' '}
                    <strong>
                      full price of the cancelled booking, plus an additional
                      penalty fee of £10
                    </strong>
                    . This amount will be deducted from your earnings wallet or
                    charged to your linked payment method.
                  </p>
                </div>

                <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
                  <h3 className='mb-2 text-lg font-semibold text-yellow-900'>
                    Repeated Cancellations
                  </h3>
                  <p className='text-yellow-800'>
                    A record (or "marker") will be applied to your Washer
                    profile for each cancellation within the 12-hour window. If
                    you accumulate <strong>three (3) such markers</strong>{' '}
                    within a 6-month period, your account status will be
                    reviewed, and you may face temporary suspension or permanent
                    termination from the Platform at our sole discretion.
                  </p>
                </div>
              </div>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                7. Pet-Free & Smoke-Free Policy
              </h2>
              <div className='rounded-lg border-2 border-blue-200 bg-blue-50 p-6'>
                <h3 className='mb-3 text-lg font-semibold text-blue-900'>
                  Mandatory Policy for All Washers
                </h3>
                <p className='mb-4 text-blue-800'>
                  To ensure the safety and comfort of all Users, particularly
                  those with allergies, all Washers on the Neighbourhood Wash
                  platform must adhere to a strict{' '}
                  <strong>pet-free and smoke-free policy</strong> within their
                  laundry area and on any equipment used for Services.
                </p>

                <h4 className='mb-2 font-semibold text-blue-900'>
                  This means:
                </h4>
                <ul className='ml-4 space-y-2 text-blue-800'>
                  <li>
                    • No pets should be present in the area where laundry is
                    washed, dried, or stored.
                  </li>
                  <li>
                    • No smoking should occur in the area where laundry is
                    processed or stored.
                  </li>
                  <li>
                    • Equipment (washing machine, dryer, baskets) must be free
                    from pet hair, dander, and smoke residue.
                  </li>
                </ul>

                <div className='mt-4 rounded border border-red-300 bg-red-100 p-3'>
                  <p className='font-medium text-red-800'>
                    <strong>Enforcement:</strong> Violation of this policy will
                    result in immediate account review and potential
                    termination. This policy is enforced universally across all
                    Washers to ensure a consistent and safe experience for all
                    Users, and is not subject to individual preference.
                  </p>
                </div>
              </div>
            </section>

            {/* Related Policies */}
            <div className='mt-12 rounded-lg bg-gray-50 p-6'>
              <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                Related Documents
              </h3>
              <div className='grid gap-4 md:grid-cols-2'>
                <a
                  href='/terms-of-service'
                  className='text-blue-600 underline hover:text-blue-800'
                >
                  Terms of Service
                </a>
                <a
                  href='/privacy-policy'
                  className='text-blue-600 underline hover:text-blue-800'
                >
                  Privacy Policy
                </a>
                <a
                  href='/cancellation-refund-policy'
                  className='text-blue-600 underline hover:text-blue-800'
                >
                  Cancellation & Refund Policy
                </a>
                <a
                  href='/community-guidelines'
                  className='text-blue-600 underline hover:text-blue-800'
                >
                  Community Guidelines
                </a>
              </div>
            </div>

            {/* Contact Information */}
            <div className='mt-6 rounded-lg bg-blue-50 p-6'>
              <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                Questions About This Agreement?
              </h3>
              <p className='text-gray-700'>
                If you have any questions about the Washer Agreement, please
                contact us at:
              </p>
              <p className='mt-2 text-gray-700'>
                Email:{' '}
                <a
                  href='mailto:team@neighbourhoodwash.com'
                  className='text-blue-600 hover:text-blue-800'
                >
                  team@neighbourhoodwash.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
