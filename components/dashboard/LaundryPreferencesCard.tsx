'use client'

import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WashingMachine, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LaundryPreferencesCardProps {
  preferencesExist: boolean
}

export default function LaundryPreferencesCard({
  preferencesExist,
}: LaundryPreferencesCardProps) {
  return (
    <Card
      className={cn(
        'flex flex-col transition-all duration-300',
        !preferencesExist &&
          'border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
      )}
    >
      <CardHeader>
        <div className='flex items-center space-x-3'>
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              preferencesExist
                ? 'bg-green-500/10'
                : 'bg-yellow-500/10 dark:bg-yellow-400/20'
            )}
          >
            {preferencesExist ? (
              <CheckCircle2 className='h-6 w-6 text-green-600' />
            ) : (
              <WashingMachine className='text-primary h-6 w-6' />
            )}
          </div>
          <div>
            <CardTitle>
              {preferencesExist
                ? 'Laundry Preferences Set'
                : 'Set Your Preferences'}
            </CardTitle>
            <CardDescription>
              {!preferencesExist && (
                <span className='font-semibold text-yellow-600'>
                  Action Required
                </span>
              )}
              {preferencesExist && 'Your choices are saved for future orders.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className='flex-grow'>
        <p>
          {preferencesExist
            ? 'Your preferences for allergies and products are saved. You can update them anytime.'
            : "Tell us about your allergies and product choices now so we're ready to match you with the perfect Washer."}
        </p>
      </CardContent>
      <div className='p-6 pt-0'>
        <Button
          asChild
          className='w-full'
          variant={preferencesExist ? 'secondary' : 'default'}
        >
          <Link href='/user/dashboard/laundry-preferences'>
            {preferencesExist ? 'Edit Preferences' : 'Set Preferences Now'}
          </Link>
        </Button>
      </div>
    </Card>
  )
}
