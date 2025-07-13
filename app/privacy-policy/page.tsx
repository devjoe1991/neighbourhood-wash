import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Neighbourhood Wash',
  description:
    'Read our GDPR-compliant Privacy Policy to understand how Neighbourhood Wash collects, uses, and protects your personal data.',
  keywords:
    'privacy policy, GDPR, data protection, neighbourhood wash, personal data, privacy rights',
  openGraph: {
    title: 'Privacy Policy | Neighbourhood Wash',
    description: 'GDPR-compliant Privacy Policy for Neighbourhood Wash',
    type: 'website',
  },
}

export default function PrivacyPolicyPage() {
  return (
    <div className='min-h-screen bg-white'>
      <div className='container mx-auto px-4 py-12 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-4xl'>
          {/* Header */}
          <div className='mb-12 text-center'>
            <h1 className='mb-4 text-4xl font-bold text-gray-900'>
              Privacy Policy
            </h1>
            <p className='text-lg text-gray-600'>
              GDPR Compliant - Last Updated: 13 July 2025
            </p>
          </div>

          {/* Content */}
          <div className='prose prose-lg max-w-none'>
            <div className='mb-8 border-l-4 border-blue-400 bg-blue-50 p-6'>
              <p className='font-medium text-blue-900'>
                Neighbourhood Wash is committed to protecting your privacy. This
                policy explains what personal data we collect, why we collect
                it, how we use and protect it, and your rights under the UK
                General Data Protection Regulation (UK GDPR).
              </p>
            </div>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                1. Data Controller
              </h2>
              <p className='mb-4 text-gray-700'>
                The data controller is{' '}
                <strong>Neighbourhood Wash Technologies Ltd</strong>, registered
                at 115 Hampstead Road, London, NW1 3EE. You can contact us at
                team@neighbourhoodwash.com.
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                2. What Data We Collect
              </h2>
              <p className='mb-4 text-gray-700'>
                We collect the following types of personal data:
              </p>

              <ul className='ml-6 space-y-3 text-gray-700'>
                <li>
                  <strong>Personal Identification Information (PII):</strong>{' '}
                  Name, email address, phone number, physical address.
                </li>
                <li>
                  <strong>Verification Data:</strong> For Washers, we collect ID
                  documents and may process biometric data for verification,
                  primarily through our partner Stripe Identity.
                </li>
                <li>
                  <strong>Location Data:</strong> Your address and postcode for
                  the "nearby" search functionality and for facilitating
                  bookings.
                </li>
                <li>
                  <strong>Financial Data:</strong> Transaction history. Payout
                  and bank details for Washers are managed securely by Stripe
                  Connect. We do not store your full payment card numbers on our
                  servers.
                </li>
                <li>
                  <strong>User-Generated Content:</strong> Reviews, ratings,
                  profile descriptions, special instructions for bookings, and
                  messages sent via our in-app chat feature.
                </li>
                <li>
                  <strong>Usage Data:</strong> Your booking history,
                  interactions with the Platform, device information (e.g.,
                  operating system, browser type), IP address, and access times.
                </li>
              </ul>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                3. How and Why We Use Your Data (Purpose & Legal Basis)
              </h2>
              <p className='mb-4 text-gray-700'>
                We process your personal data based on the following legal bases
                under UK GDPR:
              </p>

              <div className='overflow-x-auto'>
                <table className='min-w-full rounded-lg border border-gray-300 bg-white'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='border-b px-4 py-3 text-left text-sm font-semibold text-gray-900'>
                        Purpose of Processing
                      </th>
                      <th className='border-b px-4 py-3 text-left text-sm font-semibold text-gray-900'>
                        Type of Data Used
                      </th>
                      <th className='border-b px-4 py-3 text-left text-sm font-semibold text-gray-900'>
                        Legal Basis under UK GDPR
                      </th>
                    </tr>
                  </thead>
                  <tbody className='text-sm text-gray-700'>
                    <tr className='border-b'>
                      <td className='px-4 py-3'>
                        To provide and manage our service (user registration,
                        booking, connecting Users & Washers, PIN system)
                      </td>
                      <td className='px-4 py-3'>
                        PII, Location, User-Generated Content
                      </td>
                      <td className='px-4 py-3'>
                        <strong>Performance of a Contract</strong>
                      </td>
                    </tr>
                    <tr className='border-b'>
                      <td className='px-4 py-3'>
                        To process payments and payouts
                      </td>
                      <td className='px-4 py-3'>PII, Financial Data</td>
                      <td className='px-4 py-3'>
                        <strong>Performance of a Contract</strong>
                      </td>
                    </tr>
                    <tr className='border-b'>
                      <td className='px-4 py-3'>
                        To verify Washer identity for safety and fraud
                        prevention
                      </td>
                      <td className='px-4 py-3'>PII, Verification Data</td>
                      <td className='px-4 py-3'>
                        <strong>Legitimate Interest</strong>
                      </td>
                    </tr>
                    <tr className='border-b'>
                      <td className='px-4 py-3'>
                        To facilitate communication between users
                      </td>
                      <td className='px-4 py-3'>PII, User-Generated Content</td>
                      <td className='px-4 py-3'>
                        <strong>Performance of a Contract</strong>
                      </td>
                    </tr>
                    <tr className='border-b'>
                      <td className='px-4 py-3'>
                        To provide customer support and mediate disputes
                      </td>
                      <td className='px-4 py-3'>
                        PII, Financial, User-Generated, Usage Data
                      </td>
                      <td className='px-4 py-3'>
                        <strong>Legitimate Interest</strong>
                      </td>
                    </tr>
                    <tr className='border-b'>
                      <td className='px-4 py-3'>
                        To improve and analyse our Platform's performance and
                        user experience
                      </td>
                      <td className='px-4 py-3'>
                        Usage Data, Location Data (anonymised where possible)
                      </td>
                      <td className='px-4 py-3'>
                        <strong>Legitimate Interest</strong>
                      </td>
                    </tr>
                    <tr className='border-b'>
                      <td className='px-4 py-3'>
                        To send you marketing communications (if you opt-in)
                      </td>
                      <td className='px-4 py-3'>PII (Email)</td>
                      <td className='px-4 py-3'>
                        <strong>Consent</strong>
                      </td>
                    </tr>
                    <tr>
                      <td className='px-4 py-3'>
                        To comply with legal obligations (e.g., tax, financial
                        reporting)
                      </td>
                      <td className='px-4 py-3'>
                        PII, Financial Data, Transaction History
                      </td>
                      <td className='px-4 py-3'>
                        <strong>Legal Obligation</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                4. Data Sharing and Third Parties
              </h2>
              <p className='mb-4 text-gray-700'>
                We do not sell your personal data. We only share it in the
                following circumstances:
              </p>

              <ul className='ml-6 space-y-4 text-gray-700'>
                <li>
                  <strong>Between Users and Washers:</strong> To facilitate a
                  confirmed booking, we share necessary information between the
                  User and their selected Washer (e.g., first name, precise
                  location for pick-up/drop-off, and specific instructions).
                  Full addresses are only disclosed as detailed in our Terms of
                  Service (Section 4.5).
                </li>
                <li>
                  <strong>With Third-Party Service Providers:</strong> We use
                  trusted partners to operate and improve our Platform. They are
                  contractually bound to protect your data and only process it
                  according to our instructions and applicable data protection
                  laws. These include:
                  <ul className='mt-2 ml-4 space-y-1'>
                    <li>
                      • <strong>Stripe:</strong> For all payment processing,
                      Washer payouts, and ID verification (Stripe Identity).
                      Your financial data is handled directly by Stripe.
                    </li>
                    <li>
                      • <strong>Supabase (AWS):</strong> For secure database
                      hosting and cloud infrastructure.
                    </li>
                    <li>
                      • <strong>Communication Tools:</strong> For in-app chat
                      functionality and email notifications.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>For Legal Reasons:</strong> We may disclose your data
                  if required by law, court order, or to protect the rights,
                  property, or safety of Neighbourhood Wash, our users, or
                  others.
                </li>
                <li>
                  <strong>Business Transfers:</strong> In the event of a merger,
                  acquisition, or asset sale, your personal data may be
                  transferred as part of that transaction.
                </li>
              </ul>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                5. Your Rights Under UK GDPR
              </h2>
              <p className='mb-4 text-gray-700'>
                You have the following rights regarding your personal data:
              </p>

              <div className='border-l-4 border-green-400 bg-green-50 p-6'>
                <ul className='space-y-3 text-green-900'>
                  <li>
                    <strong>The right to be informed:</strong> About how we use
                    your data (which is the purpose of this policy).
                  </li>
                  <li>
                    <strong>The right of access:</strong> To request a copy of
                    the personal data we hold about you.
                  </li>
                  <li>
                    <strong>The right to rectification:</strong> To request that
                    we correct any inaccurate or incomplete personal data we
                    hold about you.
                  </li>
                  <li>
                    <strong>
                      The right to erasure ("right to be forgotten"):
                    </strong>{' '}
                    To request that we delete your personal data under certain
                    conditions.
                  </li>
                  <li>
                    <strong>The right to restrict processing:</strong> To
                    request that we limit how we use your personal data in
                    certain circumstances.
                  </li>
                  <li>
                    <strong>The right to data portability:</strong> To receive
                    your personal data in a structured, commonly used, and
                    machine-readable format, and to transmit that data to
                    another controller.
                  </li>
                  <li>
                    <strong>The right to object:</strong> To our processing of
                    your personal data, particularly for direct marketing
                    purposes or where processing is based on legitimate
                    interests.
                  </li>
                  <li>
                    <strong>
                      Rights in relation to automated decision making and
                      profiling:
                    </strong>{' '}
                    The right not to be subject to a decision based solely on
                    automated processing, including profiling, which produces
                    legal effects concerning you or similarly significantly
                    affects you.
                  </li>
                </ul>
              </div>

              <p className='mt-4 text-gray-700'>
                To exercise any of these rights, please contact us at
                team@neighbourhoodwash.com. We will respond to your request
                within one month. You also have the right to lodge a complaint
                with the Information Commissioner's Office (ICO) if you believe
                your data protection rights have been violated.
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                6. Data Security and Retention
              </h2>
              <p className='mb-4 text-gray-700'>
                We implement robust technical and organisational measures to
                protect your data against unauthorised access, alteration,
                disclosure, or destruction. These measures include data
                encryption, access controls, secure servers, and regular
                security audits.
              </p>

              <p className='mb-4 text-gray-700'>
                We retain your personal data only for as long as necessary to
                fulfil the purposes for which it was collected, including for
                satisfying any legal, accounting, or reporting requirements. For
                example:
              </p>

              <ul className='ml-6 space-y-2 text-gray-700'>
                <li>
                  <strong>Transaction Data:</strong> Kept for up to 6 years
                  after the transaction for legal and tax purposes.
                </li>
                <li>
                  <strong>Account Information:</strong> Retained for as long as
                  your account is active and for a reasonable period thereafter
                  in case you wish to reactivate it, or as required by law.
                </li>
                <li>
                  <strong>User-Generated Content:</strong> May be retained
                  indefinitely for platform integrity, even after account
                  deletion, but will be anonymised where possible.
                </li>
              </ul>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                7. Cookies
              </h2>
              <p className='mb-4 text-gray-700'>
                We use essential cookies to make our site function correctly.
                With your consent, we may also use analytics cookies (e.g.,
                Google Analytics) to help us understand how users interact with
                our Platform, allowing us to improve the user experience. You
                can manage your cookie preferences at any time through your
                browser settings or our cookie consent banner.
              </p>
            </section>

            {/* Contact Information */}
            <div className='mt-12 rounded-lg bg-gray-50 p-6'>
              <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                Contact Information
              </h3>
              <p className='text-gray-700'>
                <strong>Neighbourhood Wash Technologies Ltd</strong>
                <br />
                115 Hampstead Road
                <br />
                London, NW1 3EE
                <br />
                United Kingdom
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

            {/* ICO Information */}
            <div className='mt-6 rounded-lg bg-blue-50 p-6'>
              <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                Data Protection Authority
              </h3>
              <p className='text-gray-700'>
                If you believe your data protection rights have been violated,
                you can lodge a complaint with:
              </p>
              <p className='mt-2 text-gray-700'>
                <strong>Information Commissioner's Office (ICO)</strong>
                <br />
                Website:{' '}
                <a
                  href='https://ico.org.uk'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-600 hover:text-blue-800'
                >
                  ico.org.uk
                </a>
                <br />
                Helpline: 0303 123 1113
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
