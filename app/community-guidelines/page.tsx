import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community Guidelines & Acceptable Use Policy | Neighbourhood Wash',
  description:
    'Read our community guidelines and acceptable use policy for a safe, respectful neighbourhood laundry community.',
  keywords:
    'community guidelines, acceptable use, neighbourhood wash, safety standards, user conduct, washer policy',
  openGraph: {
    title: 'Community Guidelines & Acceptable Use Policy | Neighbourhood Wash',
    description:
      'Community guidelines and acceptable use policy for Neighbourhood Wash users and washers',
    type: 'website',
  },
}

export default function CommunityGuidelinesPage() {
  return (
    <div className='min-h-screen bg-white'>
      <div className='container mx-auto px-4 py-12 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-4xl'>
          {/* Header */}
          <div className='mb-12 text-center'>
            <h1 className='mb-4 text-4xl font-bold text-gray-900'>
              Community Guidelines & Acceptable Use Policy
            </h1>
            <p className='text-lg text-gray-600'>Last Updated: 13 July 2025</p>
          </div>

          {/* Content */}
          <div className='prose prose-lg max-w-none'>
            <div className='mb-8 border-l-4 border-blue-400 bg-blue-50 p-6'>
              <p className='font-medium text-blue-900'>
                These Community Guidelines and Acceptable Use Policy are an
                integral part of our{' '}
                <a
                  href='/terms-of-service'
                  className='text-blue-700 underline hover:text-blue-900'
                >
                  Terms of Service
                </a>{' '}
                and apply to all Users and Washers on the Neighbourhood Wash
                Platform. They are designed to foster a safe, respectful, and
                reliable community. Your continued use of the Platform signifies
                your agreement to adhere to these guidelines.
              </p>
            </div>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                1. Respectful Conduct
              </h2>
              <p className='mb-4 text-gray-700'>
                We expect all users to interact with each other with courtesy
                and respect.
              </p>

              <div className='space-y-4'>
                <div className='border-l-4 border-red-400 bg-red-50 p-4'>
                  <h3 className='mb-2 text-lg font-semibold text-red-900'>
                    No Abuse
                  </h3>
                  <p className='text-red-800'>
                    Any form of physical, verbal, or mental abuse, harassment,
                    threats, discrimination, or hate speech directed towards any
                    other user, our staff, or third parties will not be
                    tolerated. This includes, but is not limited to, offensive
                    language, intimidation, or any behaviour that creates a
                    hostile environment.{' '}
                    <strong>
                      Violation of this rule will lead to immediate account
                      termination
                    </strong>{' '}
                    and, if necessary, details being shared with relevant
                    authorities.
                  </p>
                </div>

                <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
                  <h3 className='mb-2 text-lg font-semibold text-green-900'>
                    Professional Communication
                  </h3>
                  <p className='text-green-800'>
                    Maintain clear, polite, and constructive communication
                    through the in-app chat feature.
                  </p>
                </div>

                <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
                  <h3 className='mb-2 text-lg font-semibold text-blue-900'>
                    Privacy
                  </h3>
                  <p className='text-blue-800'>
                    Do not share personal information of others without their
                    explicit consent.
                  </p>
                </div>

                <div className='rounded-lg border border-purple-200 bg-purple-50 p-4'>
                  <h3 className='mb-2 text-lg font-semibold text-purple-900'>
                    Non-Discrimination
                  </h3>
                  <p className='text-purple-800'>
                    Neighbourhood Wash is committed to providing a platform free
                    from discrimination. Users and Washers must not discriminate
                    against any individual based on race, colour, religion,
                    national origin, age, disability, gender, sexual
                    orientation, or any other protected characteristic.
                  </p>
                </div>
              </div>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                2. Platform Integrity & Fair Use
              </h2>
              <p className='mb-4 text-gray-700'>
                To ensure a fair and functional marketplace, you must:
              </p>

              <div className='grid gap-6 md:grid-cols-2'>
                <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
                  <h3 className='mb-2 text-lg font-semibold text-yellow-900'>
                    Honesty & Accuracy
                  </h3>
                  <p className='text-yellow-800'>
                    Provide accurate and truthful information during
                    registration, booking, and when providing Services. Do not
                    misrepresent yourself, your capabilities, or your items.
                  </p>
                </div>

                <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
                  <h3 className='mb-2 text-lg font-semibold text-red-900'>
                    No Circumvention
                  </h3>
                  <p className='text-red-800'>
                    All bookings and payments for laundry services facilitated
                    through Neighbourhood Wash must be made exclusively through
                    the Platform. Attempting to arrange services or payments
                    outside the Platform ("off-platform transactions") is{' '}
                    <strong>strictly prohibited</strong> and will result in
                    account termination.
                  </p>
                </div>

                <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
                  <h3 className='mb-2 text-lg font-semibold text-green-900'>
                    Accurate Reviews & Ratings
                  </h3>
                  <p className='text-green-800'>
                    Provide honest, fair, and constructive feedback in reviews
                    and ratings. Do not manipulate ratings, post fake reviews,
                    or retaliate with negative reviews.
                  </p>
                </div>

                <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                  <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                    No Misuse
                  </h3>
                  <p className='text-gray-700'>
                    Do not use the Platform for any illegal, fraudulent, or
                    unauthorised purpose. This includes, but is not limited to,
                    money laundering, drug-related activities, or any activity
                    that violates UK law.
                  </p>
                </div>
              </div>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                3. Hygiene & Safety Standards
              </h2>

              <div className='grid gap-8 md:grid-cols-2'>
                <div>
                  <h3 className='mb-4 text-xl font-semibold text-gray-900'>
                    For Users:
                  </h3>
                  <div className='space-y-4'>
                    <div className='border-l-4 border-orange-400 bg-orange-50 p-4'>
                      <h4 className='mb-2 font-semibold text-orange-900'>
                        Pre-Check Garments
                      </h4>
                      <p className='text-sm text-orange-800'>
                        It is your responsibility to thoroughly check all
                        garments for personal items (e.g., keys, wallets,
                        phones, jewellery, sharp objects) before handing them
                        over to a Washer. Neighbourhood Wash and the Washer are
                        not liable for any damage to your personal items or to
                        the Washer's equipment caused by items left in clothing.
                      </p>
                    </div>

                    <div className='border-l-4 border-blue-400 bg-blue-50 p-4'>
                      <h4 className='mb-2 font-semibold text-blue-900'>
                        Reasonable Cleanliness
                      </h4>
                      <p className='text-sm text-blue-800'>
                        Laundry must be in a reasonable state of cleanliness and
                        free from hazardous materials, excessive bodily fluids,
                        or excessive animal hair. Washers reserve the right to
                        refuse service for items deemed unhygienic or hazardous,
                        with appropriate notice to the User.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className='mb-4 text-xl font-semibold text-gray-900'>
                    For Washers:
                  </h3>
                  <div className='space-y-4'>
                    <div className='border-l-4 border-green-400 bg-green-50 p-4'>
                      <h4 className='mb-2 font-semibold text-green-900'>
                        Clean & Safe Equipment
                      </h4>
                      <p className='text-sm text-green-800'>
                        You must use clean, well-maintained, and safe domestic
                        washing machines, dryers, and ironing equipment.
                      </p>
                    </div>

                    <div className='border-l-4 border-purple-400 bg-purple-50 p-4'>
                      <h4 className='mb-2 font-semibold text-purple-900'>
                        Appropriate Products
                      </h4>
                      <p className='text-sm text-purple-800'>
                        Use appropriate, non-damaging, and effective cleaning
                        products. If a User requests hypoallergenic products for
                        sensitive skin or allergies, you must use suitable
                        alternatives as instructed by the User or decline the
                        booking if unable to meet the request.
                      </p>
                    </div>

                    <div className='border-l-4 border-red-400 bg-red-50 p-4'>
                      <h4 className='mb-2 font-semibold text-red-900'>
                        Pet-Free & Smoke-Free Environment
                      </h4>
                      <p className='text-sm text-red-800'>
                        As detailed in the Washer Agreement, all Washers must
                        adhere to a strict{' '}
                        <strong>pet-free and smoke-free policy</strong> within
                        their laundry area and on any equipment used for
                        Services. This is non-negotiable to protect users with
                        allergies and ensure a high standard of cleanliness.
                      </p>
                    </div>

                    <div className='border-l-4 border-yellow-400 bg-yellow-50 p-4'>
                      <h4 className='mb-2 font-semibold text-yellow-900'>
                        Stain Removal & Ironing
                      </h4>
                      <p className='text-sm text-yellow-800'>
                        If you offer stain removal, you must possess the
                        necessary expertise and products to attempt stain
                        removal responsibly, understanding that not all stains
                        can be removed. If offering ironing, you must have the
                        appropriate equipment and skill to iron garments
                        professionally without causing damage.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                4. Timeliness & Reliability
              </h2>

              <div className='grid gap-6 md:grid-cols-2'>
                <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
                  <h3 className='mb-2 text-lg font-semibold text-blue-900'>
                    On-Time Handovers
                  </h3>
                  <p className='text-blue-800'>
                    Users and Washers are expected to be punctual for scheduled
                    drop-off and pick-up times. Consistent lateness can
                    negatively impact your ratings and may lead to account
                    review.
                  </p>
                </div>

                <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
                  <h3 className='mb-2 text-lg font-semibold text-green-900'>
                    Communication of Delays
                  </h3>
                  <p className='text-green-800'>
                    If you anticipate a delay, communicate promptly with the
                    other party via the in-app chat.
                  </p>
                </div>

                <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4 md:col-span-2'>
                  <h3 className='mb-2 text-lg font-semibold text-yellow-900'>
                    Washer Availability
                  </h3>
                  <p className='text-yellow-800'>
                    Washers should only accept bookings they are genuinely able
                    to fulfil within the agreed timeframe. Consistent
                    last-minute cancellations, particularly within the 12-hour
                    window, will be penalised as per the{' '}
                    <a
                      href='/cancellation-refund-policy'
                      className='text-yellow-700 underline hover:text-yellow-900'
                    >
                      Cancellation & Refund Policy
                    </a>
                    .
                  </p>
                </div>
              </div>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                5. Handover Procedures & Addresses
              </h2>

              <div className='space-y-4'>
                <div className='rounded-lg border border-purple-200 bg-purple-50 p-4'>
                  <h3 className='mb-2 text-lg font-semibold text-purple-900'>
                    PIN System Adherence
                  </h3>
                  <p className='text-purple-800'>
                    Both Users and Washers must diligently follow the PIN system
                    for drop-off and pick-up to ensure a secure chain of
                    custody.
                  </p>
                </div>

                <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                  <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                    Address Privacy
                  </h3>
                  <p className='text-gray-700'>
                    Users and Washers can choose to meet at pre-determined safe
                    pick-up/drop-off points to avoid disclosing personal
                    addresses. If home pick-up/drop-off is selected, addresses
                    will only be visible to the relevant parties (User and
                    Washer) during the hour before and the hour after the
                    scheduled booking time and its completion. Users and Washers
                    should not attempt to obtain or retain the other party's
                    address outside of this system.
                  </p>
                </div>
              </div>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                6. Reporting Violations
              </h2>
              <div className='border-l-4 border-orange-400 bg-orange-50 p-6'>
                <p className='text-orange-900'>
                  If you witness or experience a violation of these Community
                  Guidelines, please report it immediately to Neighbourhood Wash
                  at{' '}
                  <a
                    href='mailto:team@neighbourhoodwash.com'
                    className='text-orange-700 underline hover:text-orange-900'
                  >
                    team@neighbourhoodwash.com
                  </a>
                  . Provide as much detail and evidence as possible to help us
                  investigate.
                </p>
              </div>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                7. Enforcement
              </h2>
              <div className='rounded-lg border border-red-200 bg-red-50 p-6'>
                <p className='mb-4 text-red-900'>
                  Neighbourhood Wash reserves the right to investigate any
                  reported violations of these guidelines. Depending on the
                  severity and frequency of the violation, we may take actions
                  including, but not limited to:
                </p>
                <ul className='space-y-2 text-red-900'>
                  <li>• Issuing a warning</li>
                  <li>• Temporary suspension of your account</li>
                  <li>• Permanent termination of your account</li>
                  <li>
                    • Reporting severe violations to law enforcement agencies
                  </li>
                </ul>
                <p className='mt-4 font-medium text-red-900'>
                  Our aim is to maintain a safe, trustworthy, and efficient
                  platform for everyone.
                </p>
              </div>
            </section>

            {/* Key Highlights Summary */}
            <div className='mt-12 rounded-lg bg-blue-50 p-6'>
              <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                Key Highlights
              </h3>
              <div className='grid gap-4 text-sm md:grid-cols-3'>
                <div>
                  <h4 className='font-semibold text-blue-900'>
                    Zero Tolerance
                  </h4>
                  <p className='text-blue-800'>
                    Abuse, discrimination, or off-platform transactions
                  </p>
                </div>
                <div>
                  <h4 className='font-semibold text-blue-900'>Safety First</h4>
                  <p className='text-blue-800'>
                    Pet-free, smoke-free, hygienic environment for all
                  </p>
                </div>
                <div>
                  <h4 className='font-semibold text-blue-900'>
                    Respect & Reliability
                  </h4>
                  <p className='text-blue-800'>
                    Professional communication and punctual service
                  </p>
                </div>
              </div>
            </div>

            {/* Related Policies */}
            <div className='mt-6 rounded-lg bg-gray-50 p-6'>
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
                  href='/dispute-resolution-claims-policy'
                  className='text-blue-600 underline hover:text-blue-800'
                >
                  Dispute Resolution & Claims Policy
                </a>
              </div>
            </div>

            {/* Contact Information */}
            <div className='mt-6 rounded-lg bg-orange-50 p-6'>
              <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                Report Violations
              </h3>
              <p className='text-gray-700'>
                Help us maintain a safe community by reporting violations:
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
