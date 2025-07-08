import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
