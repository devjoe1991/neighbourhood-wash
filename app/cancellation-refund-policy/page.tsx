import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy | Neighbourhood Wash',
  description:
    'Learn about our cancellation and refund policy for both users and washers. Understand timeframes, penalties, and refund procedures.',
  keywords:
    'cancellation policy, refund policy, neighbourhood wash, booking cancellation, washer cancellation',
  openGraph: {
    title: 'Cancellation & Refund Policy | Neighbourhood Wash',
    description:
      'Cancellation and refund policy for Neighbourhood Wash bookings',
    type: 'website',
  },
}

export default function CancellationRefundPolicyPage() {
  return (
    <div className='min-h-screen bg-white'>
      <div className='container mx-auto px-4 py-12 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-4xl'>
          {/* Header */}
          <div className='mb-12 text-center'>
            <h1 className='mb-4 text-4xl font-bold text-gray-900'>
              Cancellation & Refund Policy
            </h1>
            <p className='text-lg text-gray-600'>Last Updated: 13 July 2025</p>
          </div>

          {/* Content */}
          <div className='prose prose-lg max-w-none'>
            <div className='mb-8 border-l-4 border-blue-400 bg-blue-50 p-6'>
              <p className='font-medium text-blue-900'>
                This policy forms a part of the main{' '}
                <a
                  href='/terms-of-service'
                  className='text-blue-700 underline hover:text-blue-900'
                >
                  Terms of Service
                </a>
                . Please read it carefully.
              </p>
            </div>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                1. User Cancellations
              </h2>
              <p className='mb-4 text-gray-700'>
                Users may cancel a booking according to the following
                timeframes:
              </p>

              <div className='mb-6 grid gap-6 md:grid-cols-2'>
                <div className='rounded-lg border border-green-200 bg-green-50 p-6'>
                  <div className='mb-3 flex items-center'>
                    <div className='mr-3 h-3 w-3 rounded-full bg-green-500'></div>
                    <h3 className='text-lg font-semibold text-green-900'>
                      More than 12 hours before
                    </h3>
                  </div>
                  <p className='text-green-800'>
                    A User may cancel their booking and receive a{' '}
                    <strong>full refund</strong> to their original payment
                    method.
                  </p>
                </div>

                <div className='rounded-lg border border-red-200 bg-red-50 p-6'>
                  <div className='mb-3 flex items-center'>
                    <div className='mr-3 h-3 w-3 rounded-full bg-red-500'></div>
                    <h3 className='text-lg font-semibold text-red-900'>
                      Less than 12 hours before
                    </h3>
                  </div>
                  <p className='text-red-800'>
                    Cancellations made within this window are{' '}
                    <strong>not eligible for a refund</strong>. This is to
                    compensate the Washer for the reserved time slot they can no
                    longer fill and for any preparation they may have
                    undertaken.
                  </p>
                </div>
              </div>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                2. Washer Cancellations
              </h2>
              <p className='mb-4 text-gray-700'>
                Washers may cancel a booking, but different conditions and
                penalties apply depending on the timing:
              </p>

              <div className='space-y-6'>
                <div className='border-l-4 border-green-400 bg-green-50 p-6'>
                  <h3 className='mb-3 text-lg font-semibold text-green-900'>
                    Cancellation more than 12 hours before the booking slot
                  </h3>
                  <p className='text-green-800'>
                    If a Washer cancels a booking more than 12 hours before the
                    scheduled drop-off time, the User will receive a{' '}
                    <strong>full and automatic refund</strong>. No penalty will
                    be applied to the Washer's account.
                  </p>
                </div>

                <div className='border-l-4 border-red-400 bg-red-50 p-6'>
                  <h3 className='mb-3 text-lg font-semibold text-red-900'>
                    Cancellation within 12 hours of the booking slot
                  </h3>
                  <p className='mb-3 text-red-800'>
                    If a Washer cancels a booking within 12 hours of the
                    scheduled drop-off time, the User will receive a{' '}
                    <strong>full and automatic refund</strong>. In addition, the
                    Washer will be liable to pay a penalty equivalent to the
                    full price of the cancelled booking, plus an additional
                    penalty fee of <strong>£10</strong>. This amount will be
                    deducted from the Washer's earnings wallet or charged to
                    their linked payment method.
                  </p>
                </div>

                <div className='border-l-4 border-yellow-400 bg-yellow-50 p-6'>
                  <h3 className='mb-3 text-lg font-semibold text-yellow-900'>
                    Repeated Cancellations
                  </h3>
                  <p className='text-yellow-800'>
                    A "marker" will be applied to a Washer's profile for each
                    cancellation within the 12-hour window. If a Washer
                    accumulates <strong>three (3) such markers</strong> within a
                    6-month period, their account status will be reviewed, and
                    they may face temporary suspension or permanent termination
                    from the Platform at our sole discretion.
                  </p>
                </div>
              </div>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                3. Refund Processing
              </h2>
              <div className='rounded-lg bg-blue-50 p-6'>
                <ul className='space-y-3 text-blue-900'>
                  <li>
                    • All refunds are processed securely through{' '}
                    <strong>Stripe</strong> back to the original payment method.
                  </li>
                  <li>
                    • Once initiated, refunds may take{' '}
                    <strong>5-10 business days</strong> to appear on your bank
                    or credit card statement, depending on your bank's
                    processing times.
                  </li>
                  <li>
                    • Neighbourhood Wash is not responsible for any delays
                    caused by banks or payment processors.
                  </li>
                </ul>
              </div>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                4. Exceptional Circumstances
              </h2>
              <div className='border-l-4 border-gray-400 bg-gray-50 p-6'>
                <p className='text-gray-700'>
                  Neighbourhood Wash reserves the right to make exceptions to
                  this Cancellation & Refund Policy in cases of genuine
                  emergency or extenuating circumstances (e.g., severe illness,
                  unforeseen events), at our sole discretion. Any such
                  exceptions will be considered on a case-by-case basis and do
                  not set a precedent. Evidence may be required.
                </p>
              </div>
            </section>

            {/* Summary Table */}
            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                Summary Table
              </h2>
              <div className='overflow-x-auto'>
                <table className='min-w-full rounded-lg border border-gray-300 bg-white'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='border-b px-4 py-3 text-left text-sm font-semibold text-gray-900'>
                        Cancellation Type
                      </th>
                      <th className='border-b px-4 py-3 text-left text-sm font-semibold text-gray-900'>
                        Timing
                      </th>
                      <th className='border-b px-4 py-3 text-left text-sm font-semibold text-gray-900'>
                        User Refund
                      </th>
                      <th className='border-b px-4 py-3 text-left text-sm font-semibold text-gray-900'>
                        Washer Penalty
                      </th>
                    </tr>
                  </thead>
                  <tbody className='text-sm text-gray-700'>
                    <tr className='border-b'>
                      <td className='px-4 py-3 font-medium'>
                        User Cancellation
                      </td>
                      <td className='px-4 py-3'>&gt;12 hours before</td>
                      <td className='px-4 py-3 text-green-600'>Full refund</td>
                      <td className='px-4 py-3'>N/A</td>
                    </tr>
                    <tr className='border-b'>
                      <td className='px-4 py-3 font-medium'>
                        User Cancellation
                      </td>
                      <td className='px-4 py-3'>&lt;12 hours before</td>
                      <td className='px-4 py-3 text-red-600'>No refund</td>
                      <td className='px-4 py-3'>N/A</td>
                    </tr>
                    <tr className='border-b'>
                      <td className='px-4 py-3 font-medium'>
                        Washer Cancellation
                      </td>
                      <td className='px-4 py-3'>&gt;12 hours before</td>
                      <td className='px-4 py-3 text-green-600'>Full refund</td>
                      <td className='px-4 py-3 text-green-600'>No penalty</td>
                    </tr>
                    <tr>
                      <td className='px-4 py-3 font-medium'>
                        Washer Cancellation
                      </td>
                      <td className='px-4 py-3'>&lt;12 hours before</td>
                      <td className='px-4 py-3 text-green-600'>Full refund</td>
                      <td className='px-4 py-3 text-red-600'>
                        Booking price + £10
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Related Policies */}
            <div className='mt-12 rounded-lg bg-gray-50 p-6'>
              <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                Related Policies
              </h3>
              <div className='grid gap-4 md:grid-cols-2'>
                <a
                  href='/terms-of-service'
                  className='text-blue-600 underline hover:text-blue-800'
                >
                  Terms of Service
                </a>
                <a
                  href='/dispute-resolution-claims-policy'
                  className='text-blue-600 underline hover:text-blue-800'
                >
                  Dispute Resolution & Claims Policy
                </a>
                <a
                  href='/community-guidelines'
                  className='text-blue-600 underline hover:text-blue-800'
                >
                  Community Guidelines
                </a>
                <a
                  href='/privacy-policy'
                  className='text-blue-600 underline hover:text-blue-800'
                >
                  Privacy Policy
                </a>
              </div>
            </div>

            {/* Contact Information */}
            <div className='mt-6 rounded-lg bg-blue-50 p-6'>
              <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                Questions About This Policy?
              </h3>
              <p className='text-gray-700'>
                If you have any questions about our cancellation and refund
                policy, please contact us at:
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
