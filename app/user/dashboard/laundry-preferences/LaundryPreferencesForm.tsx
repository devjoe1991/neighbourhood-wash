'use client'

import { useState, useEffect, FormEvent } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { CogIcon, Loader2Icon } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

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
  allergies?: string[] | null
  product_preferences?: string[] | null
}

interface LaundryPreferencesFormProps {
  userId: string
  initialProfile: ProfileData | null
}

export default function LaundryPreferencesForm({
  userId,
  initialProfile,
}: LaundryPreferencesFormProps) {
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([])
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (initialProfile) {
      // Set initial state from profile data, ensuring it's an array
      setSelectedAllergies(initialProfile.allergies || [])
      setSelectedPreferences(initialProfile.product_preferences || [])
    }
  }, [initialProfile])

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
          // Save the arrays to the database
          allergies: selectedAllergies,
          product_preferences: selectedPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user preferences:', error)
        toast.error('Failed to save preferences')
      } else {
        toast.success('Laundry preferences saved successfully!')
        router.refresh()
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setSaving(false)
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
