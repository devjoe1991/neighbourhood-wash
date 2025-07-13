import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import PasswordInput from '@/components/ui/PasswordInput'
import { signup } from './actions'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; ref?: string }>
}) {
  const params = await searchParams
  return (
    <div className='flex min-h-screen flex-col justify-center bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <Link href='/'>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-blue-700 transition-colors hover:text-blue-800'>
            Create your account
          </h2>
        </Link>
      </div>

      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white px-4 py-8 shadow-xl sm:rounded-lg sm:px-10'>
          <form className='space-y-6' action={signup}>
            <div>
              <Label htmlFor='email'>Email address</Label>
              <div className='mt-1'>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  required
                  placeholder='you@example.com'
                />
              </div>
            </div>

            <div>
              <Label>I am a...</Label>
              <RadioGroup
                defaultValue='user'
                name='role'
                className='mt-2 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4'
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='user' id='role-user' />
                  <Label htmlFor='role-user' className='font-normal'>
                    User (Looking for laundry service)
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='washer' id='role-washer' />
                  <Label htmlFor='role-washer' className='font-normal'>
                    Washer (Offering laundry service)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor='referral_code'>Referral Code (Optional)</Label>
              <div className='mt-1'>
                <Input
                  id='referral_code'
                  name='referral_code'
                  type='text'
                  placeholder='Enter referral code'
                  defaultValue={params?.ref || ''}
                />
              </div>
              {params?.ref && (
                <p className='mt-1 text-sm text-green-600'>
                  Referral code applied! You'll get 50% off your first wash.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor='password'>Password</Label>
              <div className='mt-1'>
                <PasswordInput
                  id='password'
                  name='password'
                  required
                  placeholder='••••••••'
                />
              </div>
            </div>

            {/* Legal Consent Section */}
            <div className='border-t border-gray-200 pt-6'>
              <h3 className='mb-4 text-sm font-semibold text-gray-900'>
                Legal Agreement & Consent
              </h3>

              <div className='space-y-4'>
                <div className='flex items-start space-x-3'>
                  <Checkbox
                    id='terms_consent'
                    name='terms_consent'
                    required
                    className='mt-0.5'
                  />
                  <Label htmlFor='terms_consent' className='text-sm leading-5'>
                    I agree to the{' '}
                    <Link
                      href='/terms-of-service'
                      target='_blank'
                      className='text-blue-600 underline hover:text-blue-800'
                    >
                      Terms of Service
                    </Link>{' '}
                    and understand that Neighbourhood Wash is a facilitating
                    platform and that Washers are independent contractors.
                  </Label>
                </div>

                <div className='flex items-start space-x-3'>
                  <Checkbox
                    id='privacy_consent'
                    name='privacy_consent'
                    required
                    className='mt-0.5'
                  />
                  <Label
                    htmlFor='privacy_consent'
                    className='text-sm leading-5'
                  >
                    I agree to the{' '}
                    <Link
                      href='/privacy-policy'
                      target='_blank'
                      className='text-blue-600 underline hover:text-blue-800'
                    >
                      Privacy Policy
                    </Link>{' '}
                    and consent to the processing of my personal data as
                    described.
                  </Label>
                </div>

                <div className='flex items-start space-x-3'>
                  <Checkbox
                    id='community_guidelines_consent'
                    name='community_guidelines_consent'
                    required
                    className='mt-0.5'
                  />
                  <Label
                    htmlFor='community_guidelines_consent'
                    className='text-sm leading-5'
                  >
                    I agree to follow the{' '}
                    <Link
                      href='/community-guidelines'
                      target='_blank'
                      className='text-blue-600 underline hover:text-blue-800'
                    >
                      Community Guidelines & Acceptable Use Policy
                    </Link>{' '}
                    and maintain respectful conduct on the platform.
                  </Label>
                </div>

                <div className='flex items-start space-x-3'>
                  <Checkbox
                    id='cancellation_policy_consent'
                    name='cancellation_policy_consent'
                    required
                    className='mt-0.5'
                  />
                  <Label
                    htmlFor='cancellation_policy_consent'
                    className='text-sm leading-5'
                  >
                    I understand and accept the{' '}
                    <Link
                      href='/cancellation-refund-policy'
                      target='_blank'
                      className='text-blue-600 underline hover:text-blue-800'
                    >
                      Cancellation & Refund Policy
                    </Link>{' '}
                    including the 12-hour cancellation window.
                  </Label>
                </div>

                {/* Marketing consent - Optional */}
                <div className='flex items-start space-x-3 border-t border-gray-100 pt-2'>
                  <Checkbox
                    id='marketing_consent'
                    name='marketing_consent'
                    className='mt-0.5'
                  />
                  <Label
                    htmlFor='marketing_consent'
                    className='text-sm leading-5 text-gray-600'
                  >
                    <strong>Optional:</strong> I consent to receiving marketing
                    communications and promotional offers from Neighbourhood
                    Wash. You can unsubscribe at any time.
                  </Label>
                </div>
              </div>

              <div className='mt-4 rounded-lg bg-blue-50 p-3'>
                <p className='text-xs text-blue-900'>
                  <strong>Note:</strong> By creating an account, you confirm
                  that you are at least 18 years old and have the legal capacity
                  to enter into this agreement. All legal documents will open in
                  a new tab for your review.
                </p>
              </div>
            </div>

            {params?.message && (
              <p className='mt-4 bg-gray-100 p-4 text-center text-gray-500'>
                {params.message}
              </p>
            )}

            <div>
              <Button
                type='submit'
                className='flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
              >
                Create Account
              </Button>
            </div>
          </form>

          <div className='mt-6 text-center text-sm'>
            <p className='text-gray-600'>
              Already have an account?{' '}
              <Link
                href='/signin'
                className='font-medium text-blue-600 hover:text-blue-500'
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
