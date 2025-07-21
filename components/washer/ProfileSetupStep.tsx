'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowRight, Loader2 } from 'lucide-react'
import { 
  OnboardingState, 
  ProfileSetupData,
  completeProfileSetup,
} from '@/lib/onboarding/onboarding-service'
import { createClient } from '@/utils/supabase/client'

interface ProfileSetupStepProps {
  userId: string
  userEmail?: string
  onboardingState: OnboardingState
  onStepComplete: (step: 'profile_setup', data: ProfileSetupData) => Promise<void>
  onStepError: (step: 'profile_setup', error: string, data?: ProfileSetupData) => Promise<void>
  isLoading: boolean
}

export function ProfileSetupStep({
  userId,
  userEmail,
  onboardingState,
  onStepComplete,
  onStepError,
  isLoading,
}: ProfileSetupStepProps) {
  const [formData, setFormData] = useState<ProfileSetupData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    serviceArea: '',
    availability: [],
    serviceTypes: [],
    bio: '',
    preferences: '',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pre-fill form data from existing profile
  useEffect(() => {
    const loadExistingProfile = async () => {
      try {
        const supabase = createClient()
        
        // Get user profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone_number')
          .eq('id', userId)
          .single()
        
        if (profile) {
          const nameParts = profile.full_name?.split(' ') || []
          const firstName = nameParts[0] || ''
          const lastName = nameParts.slice(1).join(' ') || ''
          
          setFormData(prev => ({
            ...prev,
            firstName: prev.firstName || firstName,
            lastName: prev.lastName || lastName,
            phoneNumber: prev.phoneNumber || profile.phone_number || '',
          }))
        }
        
        // Get existing washer profile data if available
        const { data: washerProfile } = await supabase
          .from('washer_profiles')
          .select('bio, service_areas, service_types, availability_schedule')
          .eq('user_id', userId)
          .single()
        
        if (washerProfile) {
          setFormData(prev => ({
            ...prev,
            bio: prev.bio || washerProfile.bio || '',
            serviceArea: prev.serviceArea || washerProfile.service_areas?.[0] || '',
            serviceTypes: prev.serviceTypes.length > 0 ? prev.serviceTypes : washerProfile.service_types || [],
            availability: prev.availability.length > 0 ? prev.availability : washerProfile.availability_schedule?.availability || [],
          }))
        }
        
      } catch (error) {
        console.error('Error loading existing profile:', error)
      }
    }
    
    if (userId) {
      loadExistingProfile()
    }
  }, [userId])

  // London boroughs for service area
  const londonBoroughs = [
    'Barking and Dagenham', 'Barnet', 'Bexley', 'Brent', 'Bromley', 'Camden',
    'Croydon', 'Ealing', 'Enfield', 'Greenwich', 'Hackney', 'Hammersmith and Fulham',
    'Haringey', 'Harrow', 'Havering', 'Hillingdon', 'Hounslow', 'Islington',
    'Kensington and Chelsea', 'Kingston upon Thames', 'Lambeth', 'Lewisham',
    'Merton', 'Newham', 'Redbridge', 'Richmond upon Thames', 'Southwark',
    'Sutton', 'Tower Hamlets', 'Waltham Forest', 'Wandsworth', 'Westminster',
    'City of London',
  ]

  // Service types
  const serviceTypeOptions = [
    'Standard Wash & Fold',
    'Delicate Items',
    'Bedding & Linens',
    'Dry Cleaning',
    'Ironing Service',
    'Express Service',
  ]

  // Availability time slots
  const availabilityOptions = [
    'Monday 9:00 AM - 12:00 PM',
    'Monday 1:00 PM - 4:00 PM',
    'Monday 5:00 PM - 8:00 PM',
    'Tuesday 9:00 AM - 12:00 PM',
    'Tuesday 1:00 PM - 4:00 PM',
    'Tuesday 5:00 PM - 8:00 PM',
    'Wednesday 9:00 AM - 12:00 PM',
    'Wednesday 1:00 PM - 4:00 PM',
    'Wednesday 5:00 PM - 8:00 PM',
    'Thursday 9:00 AM - 12:00 PM',
    'Thursday 1:00 PM - 4:00 PM',
    'Thursday 5:00 PM - 8:00 PM',
    'Friday 9:00 AM - 12:00 PM',
    'Friday 1:00 PM - 4:00 PM',
    'Friday 5:00 PM - 8:00 PM',
    'Saturday 9:00 AM - 12:00 PM',
    'Saturday 1:00 PM - 4:00 PM',
    'Saturday 5:00 PM - 8:00 PM',
    'Sunday 9:00 AM - 12:00 PM',
    'Sunday 1:00 PM - 4:00 PM',
    'Sunday 5:00 PM - 8:00 PM',
  ]

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required'
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number'
    }
    
    if (!formData.serviceArea.trim()) {
      newErrors.serviceArea = 'Service area is required'
    }
    
    if (formData.availability.length === 0) {
      newErrors.availability = 'Please select at least one availability slot'
    }
    
    if (formData.serviceTypes.length === 0) {
      newErrors.serviceTypes = 'Please select at least one service type'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const result = await completeProfileSetup(userId, formData)
      
      if (result.success) {
        await onStepComplete('profile_setup', formData)
      } else {
        await onStepError('profile_setup', result.error?.message || 'Failed to save profile', formData)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile'
      await onStepError('profile_setup', errorMessage, formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormLoading = isLoading || isSubmitting

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Personal Information</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              placeholder="First name"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className={errors.firstName ? 'border-red-500' : ''}
              disabled={isFormLoading}
            />
            {errors.firstName && (
              <p className="text-sm text-red-500">{errors.firstName}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              placeholder="Last name"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className={errors.lastName ? 'border-red-500' : ''}
              disabled={isFormLoading}
            />
            {errors.lastName && (
              <p className="text-sm text-red-500">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number *</Label>
          <Input
            id="phoneNumber"
            placeholder="e.g., +44 7123 456789"
            value={formData.phoneNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
            className={errors.phoneNumber ? 'border-red-500' : ''}
            disabled={isFormLoading}
          />
          {errors.phoneNumber && (
            <p className="text-sm text-red-500">{errors.phoneNumber}</p>
          )}
        </div>
      </div>

      {/* Service Information */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Service Information</h4>
        
        <div className="space-y-2">
          <Label htmlFor="serviceArea">Service Area *</Label>
          <Select
            value={formData.serviceArea}
            onValueChange={(value) => setFormData(prev => ({ ...prev, serviceArea: value }))}
            disabled={isFormLoading}
          >
            <SelectTrigger className={errors.serviceArea ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select your service area" />
            </SelectTrigger>
            <SelectContent>
              {londonBoroughs.map((borough) => (
                <SelectItem key={borough} value={borough}>
                  {borough}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.serviceArea && (
            <p className="text-sm text-red-500">{errors.serviceArea}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Service Types *</Label>
          <p className="text-xs text-gray-500">Select the services you can provide</p>
          <div className="grid grid-cols-2 gap-2">
            {serviceTypeOptions.map((serviceType) => (
              <div key={serviceType} className="flex items-center space-x-2">
                <Checkbox
                  id={serviceType}
                  checked={formData.serviceTypes.includes(serviceType)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData(prev => ({
                        ...prev,
                        serviceTypes: [...prev.serviceTypes, serviceType]
                      }))
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        serviceTypes: prev.serviceTypes.filter(t => t !== serviceType)
                      }))
                    }
                  }}
                  disabled={isFormLoading}
                />
                <Label htmlFor={serviceType} className="text-sm">
                  {serviceType}
                </Label>
              </div>
            ))}
          </div>
          {errors.serviceTypes && (
            <p className="text-sm text-red-500">{errors.serviceTypes}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Availability *</Label>
          <p className="text-xs text-gray-500">
            Select when you're available for pickup and delivery
          </p>
          <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
            {availabilityOptions.map((slot) => (
              <div key={slot} className="flex items-center space-x-2">
                <Checkbox
                  id={slot}
                  checked={formData.availability.includes(slot)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData(prev => ({
                        ...prev,
                        availability: [...prev.availability, slot]
                      }))
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        availability: prev.availability.filter(a => a !== slot)
                      }))
                    }
                  }}
                  disabled={isFormLoading}
                />
                <Label htmlFor={slot} className="text-sm">
                  {slot}
                </Label>
              </div>
            ))}
          </div>
          {errors.availability && (
            <p className="text-sm text-red-500">{errors.availability}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">About You (Optional)</Label>
          <Textarea
            id="bio"
            placeholder="Tell customers about your experience and approach to laundry..."
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            rows={3}
            disabled={isFormLoading}
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isFormLoading}
        className="w-full"
        size="lg"
      >
        {isFormLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving Profile...
          </>
        ) : (
          <>
            Complete Profile Setup
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  )
}