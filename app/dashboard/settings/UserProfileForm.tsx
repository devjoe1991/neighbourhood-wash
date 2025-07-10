'use client'

import { useState, useEffect, FormEvent } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { UserCircleIcon, MailIcon, Loader2Icon } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ProfileData {
  id: string
  first_name?: string | null
  last_name?: string | null
  phone_number?: string | null
  postcode?: string | null
  borough?: string | null
}

interface UserProfileFormProps {
  userEmail: string | undefined
  userId: string
  initialProfile: ProfileData | null
}

const londonBoroughs = [
  'Barking and Dagenham',
  'Barnet',
  'Bexley',
  'Brent',
  'Bromley',
  'Camden',
  'City of London',
  'Croydon',
  'Ealing',
  'Enfield',
  'Greenwich',
  'Hackney',
  'Hammersmith and Fulham',
  'Haringey',
  'Harrow',
  'Havering',
  'Hillingdon',
  'Hounslow',
  'Islington',
  'Kensington and Chelsea',
  'Kingston upon Thames',
  'Lambeth',
  'Lewisham',
  'Merton',
  'Newham',
  'Redbridge',
  'Richmond upon Thames',
  'Southwark',
  'Sutton',
  'Tower Hamlets',
  'Waltham Forest',
  'Wandsworth',
  'Westminster',
]

export default function UserProfileForm({
  userEmail,
  userId,
  initialProfile,
}: UserProfileFormProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [postcode, setPostcode] = useState('')
  const [borough, setBorough] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (initialProfile) {
      setFirstName(initialProfile.first_name || '')
      setLastName(initialProfile.last_name || '')
      setPhoneNumber(initialProfile.phone_number || '')
      setPostcode(initialProfile.postcode || '')
      setBorough(initialProfile.borough || '')
    }
  }, [initialProfile])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!userId) {
      toast.error('User ID not available')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          postcode: postcode,
          borough: borough,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) {
        console.error('Error updating profile:', error)
        toast.error('Failed to update profile')
      } else {
        toast.success('Profile updated successfully!')
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <UserCircleIcon className='mr-2 h-5 w-5 text-blue-600' /> Profile
          Information
        </CardTitle>
        <CardDescription>
          Manage your personal details and account information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div>
              <Label htmlFor='firstName'>First Name</Label>
              <Input
                id='firstName'
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder='Enter your first name'
              />
            </div>
            <div>
              <Label htmlFor='lastName'>Last Name</Label>
              <Input
                id='lastName'
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder='Enter your last name'
              />
            </div>
          </div>
          <div>
            <Label htmlFor='email'>Email Address</Label>
            <div className='flex items-center space-x-2'>
              <MailIcon className='h-5 w-5 text-gray-400' />
              <Input
                id='email'
                type='email'
                value={userEmail || ''}
                disabled
                className='cursor-not-allowed bg-gray-100'
              />
            </div>
          </div>
          <div>
            <Label htmlFor='phoneNumber'>Phone Number</Label>
            <Input
              id='phoneNumber'
              type='tel'
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder='Enter your phone number'
            />
          </div>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div>
              <Label htmlFor='postcode'>Postcode</Label>
              <Input
                id='postcode'
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder='Enter your postcode'
              />
            </div>
            <div>
              <Label htmlFor='borough'>Borough</Label>
              <Select value={borough} onValueChange={setBorough}>
                <SelectTrigger id='borough'>
                  <SelectValue placeholder='Select your borough' />
                </SelectTrigger>
                <SelectContent>
                  {londonBoroughs.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type='submit' className='w-full sm:w-auto' disabled={saving}>
            {saving ? (
              <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
            ) : null}
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
