'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import PasswordInput from '@/components/ui/PasswordInput'
import { signup } from './actions'
import { User, Briefcase, Gift, Shield } from 'lucide-react'

interface SignupFormProps {
  defaultRefCode: string
  message?: string
}

export default function SignupForm({
  defaultRefCode,
  message,
}: SignupFormProps) {
  const [role, setRole] = useState<'user' | 'washer'>('user')

  return (
    <form className='space-y-8' action={signup}>
      {/* Email Field */}
      <div className='space-y-2'>
        <Label htmlFor='email' className='text-sm font-semibold text-gray-700'>
          Email address
        </Label>
        <Input
          id='email'
          name='email'
          type='email'
          autoComplete='email'
          required
          placeholder='you@example.com'
          className='h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        />
      </div>

      {/* Role Selection */}
      <div className='space-y-4'>
        <Label className='text-sm font-semibold text-gray-700'>I am a...</Label>
        <RadioGroup
          value={role}
          onValueChange={(value) => setRole(value as 'user' | 'washer')}
          name='role'
          className='space-y-3'
        >
          <div
            className={`relative rounded-lg border-2 p-4 transition-all ${
              role === 'user'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className='flex items-center space-x-3'>
              <RadioGroupItem value='user' id='role-user' className='mt-0.5' />
              <div className='flex flex-1 items-center space-x-3'>
                <User className='h-5 w-5 text-blue-600' />
                <div>
                  <Label
                    htmlFor='role-user'
                    className='cursor-pointer font-medium text-gray-900'
                  >
                    User
                  </Label>
                  <p className='text-sm text-gray-600'>
                    Looking for laundry service
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`relative rounded-lg border-2 p-4 transition-all ${
              role === 'washer'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className='flex items-center space-x-3'>
              <RadioGroupItem
                value='washer'
                id='role-washer'
                className='mt-0.5'
              />
              <div className='flex flex-1 items-center space-x-3'>
                <Briefcase className='h-5 w-5 text-blue-600' />
                <div>
                  <Label
                    htmlFor='role-washer'
                    className='cursor-pointer font-medium text-gray-900'
                  >
                    Washer
                  </Label>
                  <p className='text-sm text-gray-600'>
                    Offering laundry service
                  </p>
                </div>
              </div>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Referral Code */}
      <div className='space-y-2'>
        <Label
          htmlFor='referral_code'
          className='flex items-center gap-2 text-sm font-semibold text-gray-700'
        >
          <Gift className='h-4 w-4' />
          Referral Code (Optional)
        </Label>
        <Input
          id='referral_code'
          name='referral_code'
          type='text'
          placeholder='Enter referral code'
          defaultValue={defaultRefCode}
          className='h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        />
        {defaultRefCode && (
          <div className='rounded-lg border border-green-200 bg-green-50 p-3'>
            <p className='text-sm font-medium text-green-700'>
              🎉 Referral code applied! You'll get 50% off your first wash.
            </p>
          </div>
        )}
      </div>

      {/* Password */}
      <div className='space-y-2'>
        <Label
          htmlFor='password'
          className='text-sm font-semibold text-gray-700'
        >
          Password
        </Label>
        <PasswordInput
          id='password'
          name='password'
          required
          placeholder='Create a strong password'
          className='h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        />
      </div>

      {/* Legal Consent Section */}
      <div className='space-y-6 rounded-xl bg-gray-50 p-6'>
        <div className='mb-4 flex items-center gap-2'>
          <Shield className='h-5 w-5 text-blue-600' />
          <h3 className='text-lg font-semibold text-gray-900'>
            Legal Agreement & Consent
          </h3>
        </div>

        <div className='space-y-5'>
          {/* Terms of Service */}
          <div className='flex items-start space-x-3'>
            <Checkbox
              id='terms_consent'
              name='terms_consent'
              required
              className='mt-1'
            />
            <Label
              htmlFor='terms_consent'
              className='text-sm leading-6 text-gray-700'
            >
              I agree to the{' '}
              <Link
                href='/terms-of-service'
                target='_blank'
                className='font-medium text-blue-600 underline hover:text-blue-700'
              >
                Terms of Service
              </Link>
            </Label>
          </div>

          {/* Privacy Policy */}
          <div className='flex items-start space-x-3'>
            <Checkbox
              id='privacy_consent'
              name='privacy_consent'
              required
              className='mt-1'
            />
            <Label
              htmlFor='privacy_consent'
              className='text-sm leading-6 text-gray-700'
            >
              I agree to the{' '}
              <Link
                href='/privacy-policy'
                target='_blank'
                className='font-medium text-blue-600 underline hover:text-blue-700'
              >
                Privacy Policy
              </Link>
            </Label>
          </div>

          {/* Conditional Washer Agreement */}
          {role === 'washer' && (
            <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
              <div className='flex items-start space-x-3'>
                <Checkbox
                  id='washer_agreement_consent'
                  name='washer_agreement_consent'
                  required
                  className='mt-1'
                />
                <Label
                  htmlFor='washer_agreement_consent'
                  className='text-sm leading-6 text-blue-900'
                >
                  I agree to the{' '}
                  <Link
                    href='/washer-agreement'
                    target='_blank'
                    className='font-medium text-blue-700 underline hover:text-blue-800'
                  >
                    Washer Agreement
                  </Link>
                </Label>
              </div>
            </div>
          )}

          {/* Marketing Consent - Optional */}
          <div className='border-t border-gray-200 pt-4'>
            <div className='flex items-start space-x-3'>
              <Checkbox
                id='marketing_consent'
                name='marketing_consent'
                className='mt-1'
              />
              <Label
                htmlFor='marketing_consent'
                className='text-sm leading-6 text-gray-600'
              >
                <strong>Optional:</strong> I consent to receiving marketing
                communications from Neighbourhood Wash
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {message && (
        <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
          <p className='text-sm text-red-700'>{message}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type='submit'
        className='h-12 w-full bg-blue-600 text-base font-semibold transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
      >
        Create Account
      </Button>
    </form>
  )
}
