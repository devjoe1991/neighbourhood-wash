'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Settings, Save } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import ServiceSettings from '@/components/washer/ServiceSettings'
import AvailabilitySettings from '@/components/washer/AvailabilitySettings'
import AreaSettings from '@/components/washer/AreaSettings'
import { VerificationStatusCard } from '@/components/washer/VerificationStatusCard'

interface WasherProfile {
  id: string
  service_offerings: string[]
  availability_schedule: Record<string, { start: string; end: string } | null>
  service_area_radius: number
}

export default function WasherSettingsPage() {
  const [profile, setProfile] = useState<WasherProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Form state
  const [serviceOfferings, setServiceOfferings] = useState<string[]>([])
  const [availabilitySchedule, setAvailabilitySchedule] = useState<
    Record<string, { start: string; end: string } | null>
  >({})
  const [serviceAreaRadius, setServiceAreaRadius] = useState<number>(5)

  const supabase = createClient()



  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        setError('Authentication error. Please log in again.')
        return
      }

      // Set userId for verification status hook
      setUserId(user.id)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(
          'id, service_offerings, availability_schedule, service_area_radius'
        )
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        setError('Failed to fetch profile data.')
        return
      }

      setProfile(profileData)
      setServiceOfferings(profileData.service_offerings || [])
      setAvailabilitySchedule(profileData.availability_schedule || {})
      setServiceAreaRadius(profileData.service_area_radius || 5)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleSaveChanges = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const updateData: Partial<WasherProfile> = {
        service_offerings: serviceOfferings,
        availability_schedule: availabilitySchedule,
        service_area_radius: serviceAreaRadius,
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id)

      if (error) {
        console.error('Update error:', error)
        toast.error('Failed to save settings. Please try again.')
        return
      }

      toast.success('Settings saved successfully!')
      // Update local profile state
      setProfile({ ...profile, ...updateData })
    } catch (err) {
      console.error('Error saving settings:', err)
      toast.error('An unexpected error occurred.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='text-gray-600'>Loading settings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <Card className='w-full max-w-md'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <Settings className='mx-auto mb-4 h-12 w-12 text-red-500' />
              <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                Error Loading Settings
              </h3>
              <p className='text-gray-600'>{error}</p>
              <Button onClick={fetchProfile} className='mt-4' variant='outline'>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>
            My Washer Settings
          </h1>
          <p className='mt-2 text-gray-600'>
            Configure your services, availability, and service area to receive
            bookings
          </p>
        </div>

        <div className='space-y-8'>
          {/* Verification Status Display */}
          <VerificationStatusCard userId={userId} showTitle={true} />

          {/* Service Offerings */}
          <ServiceSettings
            value={serviceOfferings}
            onChange={setServiceOfferings}
          />

          {/* Availability Schedule */}
          <AvailabilitySettings
            value={availabilitySchedule}
            onChange={setAvailabilitySchedule}
          />

          {/* Service Area */}
          <AreaSettings
            value={serviceAreaRadius}
            onChange={setServiceAreaRadius}
          />

          {/* Save Button */}
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-lg font-semibold'>Save Changes</h3>
                  <p className='text-sm text-gray-600'>
                    Make sure to save your settings to start receiving bookings
                  </p>
                </div>
                <Button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  size='lg'
                  className='gap-2'
                >
                  {saving ? (
                    <>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className='h-4 w-4' />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
