'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState, useEffect, FormEvent } from 'react'
import type { User, SupabaseClient } from '@supabase/supabase-js'
import { CogIcon, Loader2Icon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

// --- Define the selectable options ---
const allergyOptions = [
  { id: 'perfume_free', label: 'Perfume-free' },
  { id: 'dye_free', label: 'Dye-free' },
  { id: 'hypoallergenic', label: 'Hypoallergenic' },
  { id: 'nut_allergies', label: 'Nut Allergies (inform washer)' },
  { id: 'sensitive_skin', label: 'General Sensitive Skin' },
]

const preferenceOptions = [
  { id: 'non_bio', label: 'Non-bio Detergent' },
  { id: 'eco_friendly', label: 'Eco-friendly Products' },
  { id: 'fabric_softener', label: 'Use Fabric Softener' },
  { id: 'tumble_dry', label: 'Tumble Dry (if suitable)' },
  { id: 'air_dry', label: 'Air Dry Preferred' },
]

interface ProfileData {
  id: string
  // Storing selections as an array of strings
  allergies?: string[] | null
  product_preferences?: string[] | null
}

const UserPreferencesSettings = ({
  userId,
  supabase,
  initialData,
}: {
  userId: string | undefined
  supabase: SupabaseClient | null
  initialData: ProfileData | null
}) => {
  // --- State to hold arrays of selected IDs ---
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([])
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialData) {
      // Set initial state from profile data, ensuring it's an array
      setSelectedAllergies(initialData.allergies || [])
      setSelectedPreferences(initialData.product_preferences || [])
    }
  }, [initialData])

  // --- Handlers for checkbox changes ---
  const handleAllergyChange = (allergyId: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(allergyId)
        ? prev.filter((id) => id !== allergyId)
        : [...prev, allergyId]
    )
  }

  const handlePreferenceChange = (preferenceId: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(preferenceId)
        ? prev.filter((id) => id !== preferenceId)
        : [...prev, preferenceId]
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase || !userId) {
      console.error(
        'UserPreferencesSettings: Supabase client or User ID not available.'
      )
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        // Save the arrays to the database
        allergies: selectedAllergies,
        product_preferences: selectedPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    setSaving(false)
    if (error) {
      console.error('Error updating user preferences:', error)
    } else {
      console.log('User preferences updated successfully!')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <CogIcon className='mr-2 h-5 w-5 text-blue-600' /> Laundry Preferences
        </CardTitle>
        <CardDescription>
          Select your preferences below. These will be shared with your Washer
          for each booking.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* --- Allergies Section --- */}
          <div>
            <Label className='text-lg font-semibold'>
              Allergies and Sensitivities
            </Label>
            <p className='mb-3 text-sm text-gray-500'>
              Select any that apply to you or your household.
            </p>
            <div className='grid grid-cols-1 gap-4 rounded-md border p-4 sm:grid-cols-2'>
              {allergyOptions.map((option) => (
                <div key={option.id} className='flex items-center space-x-2'>
                  <Checkbox
                    id={`allergy-${option.id}`}
                    checked={selectedAllergies.includes(option.id)}
                    onCheckedChange={() => handleAllergyChange(option.id)}
                  />
                  <Label
                    htmlFor={`allergy-${option.id}`}
                    className='font-normal'
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* --- Preferences Section --- */}
          <div>
            <Label className='text-lg font-semibold'>
              Product and Detergent Preferences
            </Label>
            <p className='mb-3 text-sm text-gray-500'>
              Choose your preferred laundry options.
            </p>
            <div className='grid grid-cols-1 gap-4 rounded-md border p-4 sm:grid-cols-2'>
              {preferenceOptions.map((option) => (
                <div key={option.id} className='flex items-center space-x-2'>
                  <Checkbox
                    id={`pref-${option.id}`}
                    checked={selectedPreferences.includes(option.id)}
                    onCheckedChange={() => handlePreferenceChange(option.id)}
                  />
                  <Label htmlFor={`pref-${option.id}`} className='font-normal'>
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <Button type='submit' className='w-full sm:w-auto' disabled={saving}>
            {saving ? (
              <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
            ) : null}
            {saving ? 'Saving...' : 'Save Laundry Preferences'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function LaundryPreferencesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, allergies, product_preferences')
          .eq('id', session.user.id)
          .maybeSingle()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
        } else {
          setProfile(profileData)
        }
      } else {
        router.push('/signin')
      }
      setLoading(false)
    }

    fetchData()
  }, [supabase, router])

  if (loading) {
    return (
      <div className='flex items-center justify-center'>
        <p>Loading preferences...</p>
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-4xl'>
      <UserPreferencesSettings
        userId={user?.id}
        supabase={supabase}
        initialData={profile}
      />
    </div>
  )
}
