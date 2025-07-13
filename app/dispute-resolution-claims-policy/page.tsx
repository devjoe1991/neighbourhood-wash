import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dispute Resolution & Claims Policy | Neighbourhood Wash',
  description:
    'Learn about our dispute resolution process for handling claims, damaged items, and service issues between users and washers.',
  keywords:
    'dispute resolution, claims policy, neighbourhood wash, damaged items, mediation, complaints',
  openGraph: {
    title: 'Dispute Resolution & Claims Policy | Neighbourhood Wash',
    description: 'Dispute resolution and claims policy for Neighbourhood Wash',
    type: 'website',
  },
}

export default function DisputeResolutionClaimsPolicyPage() {
  return (
    <div className='min-h-screen bg-white'>
      <div className='container mx-auto px-4 py-12 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-4xl'>
          {/* Header */}
          <div className='mb-12 text-center'>
            <h1 className='mb-4 text-4xl font-bold text-gray-900'>
              Dispute Resolution & Claims Policy
            </h1>
            <p className='text-lg text-gray-600'>Last Updated: 13 July 2025</p>
          </div>

          {/* Content */}
          <div className='prose prose-lg max-w-none'>
            <div className='mb-8 border-l-4 border-blue-400 bg-blue-50 p-6'>
              <p className='font-medium text-blue-900'>
                If a User experiences an issue with a completed service (e.g.,
                damaged or lost items, or concerns about service quality), the
                following step-by-step process must be followed. This policy is
                part of our main{' '}
                <a
                  href='/terms-of-service'
                  className='text-blue-700 underline hover:text-blue-900'
                >
                  Terms of Service
                </a>
                .
              </p>
            </div>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                1. Step 1: Direct Communication (Mandatory First Step)
              </h2>

              <div className='mb-6 rounded-lg border border-green-200 bg-green-50 p-6'>
                <h3 className='mb-3 text-lg font-semibold text-green-900'>
                  Requirements
                </h3>
                <ul className='space-y-2 text-green-800'>
                  <li>
                    <strong>Timeframe:</strong> The User and Washer must first
                    attempt to resolve the issue directly through the platform's
                    in-app chat feature within <strong>48 hours</strong> of the
                    Pick-up PIN being verified and the service marked as
                    complete.
                  </li>
                  <li>
                    <strong>Purpose:</strong> This initial step is designed to
                    encourage amicable resolution between the parties whose
                    contract for services is direct. Many issues can be resolved
                    quickly and efficiently at this stage.
                  </li>
                  <li>
                    <strong>Documentation:</strong> Users should document the
                    issue with clear photos or videos of any damage or
                    discrepancy, and provide a clear description of the problem.
                  </li>
                </ul>
              </div>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                2. Step 2: Escalation to Neighbourhood Wash
              </h2>

              <div className='mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-6'>
                <h3 className='mb-3 text-lg font-semibold text-yellow-900'>
                  When and How to Escalate
                </h3>
                <div className='space-y-4 text-yellow-800'>
                  <div>
                    <strong>When to Escalate:</strong> If a satisfactory
                    resolution is not reached through direct communication
                    within the 48-hour timeframe, either the User or the Washer
                    can escalate the dispute to Neighbourhood Wash.
                  </div>
                  <div>
                    <strong>How to Escalate:</strong> To escalate, send an email
                    to <strong>team@neighbourhoodwash.com</strong> with the
                    following information:
                    <ul className='mt-2 ml-4 space-y-1'>
                      <li>
                        • The relevant <strong>Booking ID</strong>
                      </li>
                      <li>• A clear and concise summary of the issue</li>
                      <li>
                        • Evidence collected (e.g., photos, screenshots of chat
                        logs)
                      </li>
                      <li>
                        • Details of attempts to resolve the issue directly
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                3. Step 3: Mediation and Evidence Review
              </h2>

              <div className='mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6'>
                <h3 className='mb-3 text-lg font-semibold text-blue-900'>
                  Our Role as Mediator
                </h3>
                <p className='mb-4 text-blue-800'>
                  Upon escalation, Neighbourhood Wash will review the
                  information provided by both parties. We will act as a{' '}
                  <strong>neutral mediator</strong> to help facilitate a fair
                  resolution, but we are <strong>not an arbiter</strong> and
                  have no legal obligation to provide financial compensation.
                </p>

                <h4 className='text-md mb-2 font-semibold text-blue-900'>
                  Evidence Required
                </h4>
                <p className='mb-2 text-blue-800'>
                  We will request all relevant evidence from both parties, which
                  may include:
                </p>
                <ul className='ml-4 space-y-1 text-blue-800'>
                  <li>
                    • Clear photos or videos of the items before and after the
                    service (if available)
                  </li>
                  <li>
                    • Detailed descriptions of the items and the alleged
                    damage/loss
                  </li>
                  <li>
                    • Screenshots of relevant communication via the in-app chat
                  </li>
                  <li>
                    • The timestamped Drop-off and Pick-up PIN verification
                    logs, which serve as key evidence confirming the chain of
                    custody
                  </li>
                  <li>• Any other information pertinent to the dispute</li>
                </ul>
              </div>

              <div className='border-l-4 border-red-400 bg-red-50 p-6'>
                <h4 className='mb-3 text-lg font-semibold text-red-900'>
                  Responsibility for Items
                </h4>
                <p className='text-red-800'>
                  Users are solely responsible for checking all garments for
                  personal items (e.g., keys, wallets, phones, jewellery) before
                  handing them over to the Washer. Neighbourhood Wash and the
                  Washer are not liable for any damage to a User's personal
                  items, or to the Washer's equipment, caused by items left in
                  clothing.
                </p>
              </div>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                4. Step 4: Compensation and Outcome
              </h2>

              <div className='mb-6 rounded-lg border border-gray-200 bg-gray-50 p-6'>
                <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                  No Legal Obligation
                </h3>
                <p className='mb-4 text-gray-700'>
                  As explicitly stated in our Terms of Service, Neighbourhood
                  Wash's role is solely that of a technology platform
                  facilitating bookings. The contract for services is directly
                  between the User and the Washer. Therefore, Neighbourhood Wash
                  has{' '}
                  <strong>
                    no legal obligation to provide financial compensation
                  </strong>{' '}
                  for damaged or lost items, or for any disputes arising from
                  the provision of Services.
                </p>

                <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                  Discretionary Platform Credit
                </h3>
                <p className='mb-4 text-gray-700'>
                  However, at our <strong>sole discretion</strong> and purely as
                  a gesture of goodwill, Neighbourhood Wash may offer platform
                  credit to the User or Washer. Any such offer is not an
                  admission of liability and does not set a precedent for future
                  disputes.
                </p>

                <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                  Recommendation
                </h3>
                <p className='text-gray-700'>
                  We strongly encourage Users and Washers to maintain open
                  communication and resolve issues amicably. The Platform's
                  dispute resolution process is designed to assist, but it is
                  not an insurer for laundry services.
                </p>
              </div>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                5. Abuse Policy
              </h2>
              <div className='border-l-4 border-red-400 bg-red-50 p-6'>
                <p className='font-medium text-red-900'>
                  Any form of physical, verbal, or mental abuse directed towards
                  a User or Washer during the dispute resolution process or at
                  any other time will not be tolerated. Neighbourhood Wash
                  reserves the right to immediately suspend or terminate the
                  account of any party engaging in abusive behaviour and, if
                  deemed necessary, will pass relevant details to the
                  appropriate authorities.
                </p>
              </div>
            </section>

            {/* Process Flow Diagram */}
            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                Dispute Resolution Process Flow
              </h2>
              <div className='rounded-lg border-2 border-gray-200 bg-white p-6'>
                <div className='flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0 md:space-x-4'>
                  <div className='flex-1 text-center'>
                    <div className='mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-500 font-bold text-white'>
                      1
                    </div>
                    <h4 className='font-semibold text-gray-900'>
                      Direct Communication
                    </h4>
                    <p className='text-sm text-gray-600'>
                      48 hours via in-app chat
                    </p>
                  </div>
                  <div className='hidden text-gray-400 md:block'>→</div>
                  <div className='flex-1 text-center'>
                    <div className='mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500 font-bold text-white'>
                      2
                    </div>
                    <h4 className='font-semibold text-gray-900'>Escalation</h4>
                    <p className='text-sm text-gray-600'>
                      Email team@neighbourhoodwash.com
                    </p>
                  </div>
                  <div className='hidden text-gray-400 md:block'>→</div>
                  <div className='flex-1 text-center'>
                    <div className='mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 font-bold text-white'>
                      3
                    </div>
                    <h4 className='font-semibold text-gray-900'>Mediation</h4>
                    <p className='text-sm text-gray-600'>
                      Evidence review & neutral mediation
                    </p>
                  </div>
                  <div className='hidden text-gray-400 md:block'>→</div>
                  <div className='flex-1 text-center'>
                    <div className='mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500 font-bold text-white'>
                      4
                    </div>
                    <h4 className='font-semibold text-gray-900'>Resolution</h4>
                    <p className='text-sm text-gray-600'>
                      Outcome & potential goodwill credit
                    </p>
                  </div>
                </div>
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
                Need to Report a Dispute?
              </h3>
              <p className='text-gray-700'>
                For dispute escalation, please email us with all relevant
                information:
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
              <p className='mt-2 text-sm text-gray-700'>
                <strong>Remember:</strong> Always attempt direct communication
                first via the in-app chat before escalating to us.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
