import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Neighbourhood Wash',
  description:
    'Read the Terms of Service for Neighbourhood Wash - your friendly neighbourhood laundry solution. Learn about our booking platform, user responsibilities, and service policies.',
  keywords:
    'terms of service, neighbourhood wash, laundry booking, platform terms, user agreement',
  openGraph: {
    title: 'Terms of Service | Neighbourhood Wash',
    description:
      'Terms of Service for Neighbourhood Wash laundry booking platform',
    type: 'website',
  },
}

export default function TermsOfServicePage() {
  return (
    <div className='min-h-screen bg-white'>
      <div className='container mx-auto px-4 py-12 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-4xl'>
          {/* Header */}
          <div className='mb-12 text-center'>
            <h1 className='mb-4 text-4xl font-bold text-gray-900'>
              Terms of Service
            </h1>
            <p className='text-lg text-gray-600'>Last Updated: 13 July 2025</p>
          </div>

          {/* Content */}
          <div className='prose prose-lg max-w-none'>
            <div className='mb-8 border-l-4 border-blue-400 bg-blue-50 p-6'>
              <p className='font-medium text-blue-900'>
                Welcome to Neighbourhood Wash. These Terms of Service ("Terms")
                govern your use of the Neighbourhood Wash website, applications,
                and services (collectively, the "Platform"). By accessing the
                Platform and/or making a Booking, you agree to be bound by these
                Terms.
              </p>
              <p className='mt-2 text-blue-900'>
                Please read these Terms carefully. If you do not agree to be
                bound by them, you must not use the Platform.
              </p>
            </div>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                1. Definitions
              </h2>
              <ul className='space-y-2 text-gray-700'>
                <li>
                  <strong>"Platform":</strong> Refers to the website located at
                  neighbourhoodwash.com, and any associated applications and
                  technology operated by Neighbourhood Wash Technologies Ltd.
                </li>
                <li>
                  <strong>"Neighbourhood Wash", "we", "us", or "our":</strong>{' '}
                  Refers to Neighbourhood Wash Technologies Ltd, a company
                  registered in England and Wales, with a registered address at
                  115 Hampstead Road, London, NW1 3EE. We can be contacted by
                  email at team@neighbourhoodwash.com.
                </li>
                <li>
                  <strong>"User":</strong> Any individual who uses the Platform
                  to search for, book, and pay for laundry services.
                </li>
                <li>
                  <strong>"Washer":</strong> A self-employed, independent
                  contractor who has been vetted and approved to offer their
                  laundry Services to Users via the Platform.
                </li>
                <li>
                  <strong>"Services":</strong> The laundry services (e.g.,
                  washing, drying, ironing, stain removal, hypoallergenic
                  washing) provided by a Washer to a User.
                </li>
                <li>
                  <strong>"Booking":</strong> A confirmed order for Services
                  made by a User with a Washer through the Platform.
                </li>
                <li>
                  <strong>"PIN System":</strong> The dual 4-digit PIN
                  verification method used to confirm the drop-off and pick-up
                  of laundry, forming a digital chain of custody.
                </li>
                <li>
                  <strong>"User Content":</strong> Any content submitted by
                  users to the Platform, including reviews, ratings, messages,
                  and profile information.
                </li>
              </ul>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                2. The Role of Neighbourhood Wash
              </h2>

              <h3 className='mb-3 text-xl font-semibold text-gray-900'>
                2.1. A Booking Platform
              </h3>
              <p className='mb-4 text-gray-700'>
                Neighbourhood Wash provides a technology platform that connects
                Users seeking laundry services with local, independent Washers.
                We act as a booking agency and facilitator only. Our service is
                the provision of this Platform, not the provision of laundry
                services themselves.
              </p>

              <h3 className='mb-3 text-xl font-semibold text-gray-900'>
                2.2. Independent Contractors
              </h3>
              <p className='mb-4 text-gray-700'>
                You acknowledge and agree that Washers are independent,
                self-employed contractors, not employees, agents, or partners of
                Neighbourhood Wash. The contract for the provision of the actual
                laundry Services is a direct contract between the User and the
                Washer. Neighbourhood Wash is not a party to that contract.
              </p>

              <h3 className='mb-3 text-xl font-semibold text-gray-900'>
                2.3. Vetting
              </h3>
              <p className='mb-4 text-gray-700'>
                While we vet prospective Washers, which includes an application
                review and mandatory ID verification through our partner Stripe,
                we do not guarantee the quality, safety, or legality of the
                Services they provide. We do not and cannot guarantee the
                accuracy or completeness of these checks. You engage with
                Washers at your own risk.
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                3. User & Washer Registration
              </h2>

              <h3 className='mb-3 text-xl font-semibold text-gray-900'>
                3.1. Account Creation
              </h3>
              <p className='mb-4 text-gray-700'>
                To use most features of the Platform, you must register for an
                account. You agree to provide true, accurate, and complete
                information and to keep this information updated. You may not
                impersonate any other person or use a name you are not
                authorised to use.
              </p>

              <h3 className='mb-3 text-xl font-semibold text-gray-900'>
                3.2. Washer Onboarding
              </h3>
              <p className='mb-4 text-gray-700'>
                Prospective Washers must complete a detailed application, pay a
                one-time, non-refundable Onboarding Fee of <strong>£50</strong>,
                unless specific promotions are offered which can change this fee
                at any time. They must successfully complete our vetting
                process, including identity verification via Stripe Identity. To
                receive payments, all Washers must create a Stripe Connect
                Express account and agree to Stripe's terms and conditions.
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                4. The Booking Process
              </h2>

              <h3 className='mb-3 text-xl font-semibold text-gray-900'>
                4.1. Creating a Booking
              </h3>
              <p className='mb-4 text-gray-700'>
                A User requests a Booking by selecting the required Services
                (e.g., wash, dry, iron, stain removal, hypoallergenic wash) and
                an available time slot. Users may add special instructions
                (e.g., for allergies, detergent preferences, or specific care).
                The Platform will then either make the booking available to
                Washers to accept or automatically assign it to the closest and
                most available Washer within 24 hours of the requested booking
                time.
              </p>

              <h3 className='mb-3 text-xl font-semibold text-gray-900'>
                4.2. 8:00 PM Booking Restriction
              </h3>
              <div className='mb-4 border-l-4 border-yellow-400 bg-yellow-50 p-4'>
                <p className='text-yellow-800'>
                  To prevent noise disturbances and anti-social behaviour in
                  residential areas, the Platform strictly prohibits booking
                  time slots that end after 8:00 PM. Users will not be able to
                  select or request such time slots during the booking process.
                </p>
              </div>

              <h3 className='mb-3 text-xl font-semibold text-gray-900'>
                4.3. PIN Verification System
              </h3>
              <p className='mb-4 text-gray-700'>
                Upon booking confirmation, a unique{' '}
                <strong>Drop-off PIN</strong> is generated. The Washer must
                enter this PIN into their dashboard to confirm they have
                received the User's laundry.
              </p>
              <p className='mb-4 text-gray-700'>
                Upon service completion, a second unique{' '}
                <strong>Pick-up PIN</strong> is generated. The User provides
                this Pick-up PIN to the Washer, who must enter it to confirm the
                service is complete and the items have been returned to the
                User.
              </p>
              <p className='mb-4 text-gray-700'>
                This dual PIN system creates a timestamped, digital chain of
                custody. Verification of the Pick-up PIN serves as the User's
                confirmation that the Service is complete and the items have
                been returned to their satisfaction. This action triggers the
                final payment capture.
              </p>

              <h3 className='mb-3 text-xl font-semibold text-gray-900'>
                4.4. User Agreement at Booking
              </h3>
              <div className='mb-4 border-l-4 border-red-400 bg-red-50 p-4'>
                <p className='mb-2 font-medium text-red-900'>
                  By confirming a Booking, you, the User, explicitly agree and
                  acknowledge:
                </p>
                <ul className='space-y-1 text-red-900'>
                  <li>
                    • That Washers are independent contractors and Neighbourhood
                    Wash is a facilitator.
                  </li>
                  <li>
                    • You accept the platform's Cancellation & Refund Policy.
                  </li>
                  <li>
                    • You understand and agree to use the PIN System for
                    handovers.
                  </li>
                  <li>
                    • You agree to the platform's Limitation of Liability as
                    detailed in these Terms.
                  </li>
                  <li>
                    • You understand that it is your responsibility to check all
                    garments for personal items (e.g., keys, wallets, phones)
                    before handover. Neighbourhood Wash and the Washer are not
                    liable for any damage to your personal items or the Washer's
                    equipment caused by items left in clothing.
                  </li>
                </ul>
              </div>

              <h3 className='mb-3 text-xl font-semibold text-gray-900'>
                4.5. Safe Pick-up and Drop-off Points
              </h3>
              <p className='mb-4 text-gray-700'>
                Users and Washers have the option to arrange to meet at
                pre-determined safe pick-up and drop-off points to avoid
                disclosing personal addresses. If this option is chosen,
                personal addresses associated with the booking will not be
                displayed. If direct home pick-up/drop-off is selected,
                addresses will only be visible to the relevant parties (User and
                Washer) during the hour before and the hour after the scheduled
                booking time and its completion.
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                5. Payments, Commissions & Payouts
              </h2>

              <h3 className='mb-3 text-xl font-semibold text-gray-900'>
                5.1. Payments
              </h3>
              <p className='mb-4 text-gray-700'>
                Users must provide valid payment card details at the time of
                booking. All payments are securely processed by our third-party
                payment provider, <strong>Stripe</strong>. We do not store your
                full payment card details. Payment for the full booking amount
                is authorised when the Booking is made and captured upon
                successful verification of the Pick-up PIN.
              </p>

              <h3 className='mb-3 text-xl font-semibold text-gray-900'>
                5.2. Platform Commission
              </h3>
              <p className='mb-4 text-gray-700'>
                Neighbourhood Wash deducts a{' '}
                <strong>15% service commission</strong> from the total booking
                price paid by the User. This commission is for the use of the
                Platform, payment processing, and facilitation services. You
                acknowledge and agree that this commission rate may change at
                any time, and we reserve the right to modify it with prior
                notice.
              </p>

              <h3 className='mb-3 text-xl font-semibold text-gray-900'>
                5.3. Washer Earnings & Payouts
              </h3>
              <p className='mb-4 text-gray-700'>
                The remaining amount of the booking (total price minus the 15%
                commission) is credited to the Washer's platform wallet. Washers
                can request a payout of their balance at any time. Each payout
                transaction is subject to a fixed{' '}
                <strong>£2.50 Payout Fee</strong>. You acknowledge and agree
                that this payout fee may change at any time, and we reserve the
                right to modify it with prior notice.
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                6. Community Guidelines & Acceptable Use
              </h2>
              <p className='mb-4 text-gray-700'>
                You agree to use the Platform lawfully and respectfully. You
                will not:
              </p>
              <ul className='ml-6 space-y-2 text-gray-700'>
                <li>
                  • Engage in any activity that is illegal, fraudulent, or
                  harmful.
                </li>
                <li>
                  • Harass, threaten, or abuse other users, whether physically
                  or mentally. Any form of abuse will result in immediate
                  account termination and may lead to details being shared with
                  appropriate authorities.
                </li>
                <li>
                  • Post User Content that is defamatory, obscene, or
                  discriminatory.
                </li>
                <li>
                  • Attempt to circumvent the Platform by arranging bookings or
                  payments outside of it.
                </li>
                <li>
                  • Violate hygiene standards. All laundry must be in a
                  reasonable state of cleanliness (e.g., free from excessive
                  bodily fluids, hazardous materials, or excessive animal hair).
                </li>
                <li>
                  • Discriminate against any User or Washer based on race,
                  gender, religion, national origin, disability, sexual
                  orientation, or any other protected characteristic.
                </li>
                <li>
                  • Require or expect Washers to provide Services that conflict
                  with the <strong>Pet-Free & Smoke-Free Policy</strong>{' '}
                  detailed in the Washer Agreement and Community Guidelines,
                  which applies universally to maintain a safe environment for
                  all users, particularly those with allergies.
                </li>
              </ul>
              <p className='mt-4 text-gray-700'>
                Violation of these guidelines may result in account suspension
                or termination.
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                7. Cancellation & Refund Policy
              </h2>
              <p className='mb-4 text-gray-700'>
                Our{' '}
                <a
                  href='/cancellation-refund-policy'
                  className='text-blue-600 underline hover:text-blue-800'
                >
                  Cancellation & Refund Policy
                </a>{' '}
                is a part of these Terms. Please review it for detailed
                information on cancellation timeframes and refund eligibility
                for both Users and Washers.
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                8. Dispute Resolution & Claims
              </h2>
              <p className='mb-4 text-gray-700'>
                Our{' '}
                <a
                  href='/dispute-resolution-claims-policy'
                  className='text-blue-600 underline hover:text-blue-800'
                >
                  Dispute Resolution & Claims Policy
                </a>{' '}
                is a part of these Terms. In the event of an issue, such as lost
                or damaged items, you must first attempt to resolve it directly
                with the other party. If a resolution cannot be reached, you may
                escalate it to us. We may act as a neutral mediator, but we are
                not an arbiter and have no obligation to provide compensation.
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                9. Liability
              </h2>

              <h3 className='mb-3 text-xl font-semibold text-gray-900'>
                9.1. Our Liability is Limited
              </h3>
              <div className='mb-4 border-l-4 border-red-400 bg-red-50 p-4'>
                <p className='text-red-900'>
                  To the fullest extent permitted by law, our liability is
                  limited to our role as a technology platform. Because the
                  contract for Services is between the User and the Washer, we
                  are not liable for any direct or indirect damages, including
                  but not limited to, damage to clothing, lost items, missed
                  deadlines, personal injury arising from the Services, or
                  damage to a Washer's equipment caused by items left in User's
                  garments.
                </p>
              </div>

              <h3 className='mb-3 text-xl font-semibold text-gray-900'>
                9.2. No Liability for User Interactions
              </h3>
              <p className='mb-4 text-gray-700'>
                We are not responsible for the conduct of any User or Washer,
                either online or offline. You use the Platform and the Services
                at your own risk.
              </p>

              <h3 className='mb-3 text-xl font-semibold text-gray-900'>
                9.3. Financial Liability Cap
              </h3>
              <p className='mb-4 text-gray-700'>
                Should we be found liable for any reason, our liability to you
                will not exceed the total amount of commission we have received
                from your bookings in the preceding six (6) months.
              </p>

              <h3 className='mb-3 text-xl font-semibold text-gray-900'>
                9.4. Washer Insurance
              </h3>
              <p className='mb-4 text-gray-700'>
                We do not provide any form of insurance to Washers. Washers are
                solely responsible for obtaining their own public liability and
                any other relevant business insurance to cover their activities.
                We strongly recommend they do so.
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                10. Intellectual Property
              </h2>
              <p className='mb-4 text-gray-700'>
                All content and technology on the Platform, including the code,
                design, logos, and text, are the exclusive property of
                Neighbourhood Wash Technologies Ltd. You may not copy,
                reproduce, or create derivative works from our content without
                our express written permission. By posting User Content, you
                grant us a worldwide, non-exclusive, royalty-free license to
                use, display, and distribute that content on our Platform.
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                11. Termination
              </h2>
              <p className='mb-4 text-gray-700'>
                You can terminate your account at any time by contacting us. We
                reserve the right to suspend or terminate your access to the
                Platform at our discretion, without notice, if you violate these
                Terms or for any other reason we deem appropriate to protect the
                integrity and safety of the Platform and its users.
              </p>
            </section>

            <section className='mb-8'>
              <h2 className='mb-4 text-2xl font-bold text-gray-900'>
                12. General
              </h2>

              <h3 className='mb-3 text-xl font-semibold text-gray-900'>
                12.1. Governing Law
              </h3>
              <p className='mb-4 text-gray-700'>
                These Terms shall be governed by and construed in accordance
                with the laws of England and Wales. Any disputes will be subject
                to the exclusive jurisdiction of the courts of England and
                Wales.
              </p>

              <h3 className='mb-3 text-xl font-semibold text-gray-900'>
                12.2. Changes to Terms
              </h3>
              <p className='mb-4 text-gray-700'>
                We may modify these Terms from time to time. We will notify you
                of any material changes, and your continued use of the Platform
                after such changes will constitute your acceptance of the new
                Terms.
              </p>

              <h3 className='mb-3 text-xl font-semibold text-gray-900'>
                12.3. Severability
              </h3>
              <p className='mb-4 text-gray-700'>
                If any part of these Terms is deemed unlawful or unenforceable,
                that part will be severed, and the remaining provisions will
                continue in full force and effect.
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
          </div>
        </div>
      </div>
    </div>
  )
}
